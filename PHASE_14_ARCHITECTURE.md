# Phase 14 Architecture: Recommendation UI & Match Feedback Loop

**Document Status:** APPROVED FOR IMPLEMENTATION
**Current Branch:** `phase-14-planning`
**Implementation Branch:** `phase-14-recommendation-ui`
**Last Updated:** June 19, 2026

---

## 1. Recommendation

**The highest-value Phase 14 is: Recommendation UI + Match Feedback Loop.**

These two concerns are architecturally inseparable, and neither is useful without the other. This combined phase should be treated as a single unit of work.

---

## 2. Comparative Analysis of Candidates

The following table scores each candidate on five axes relevant to this product's stage.

| Candidate                     | User Value | Beta Readiness | Arch Complexity | Urgency | Infrastructure Cost |
|-------------------------------|-----------|----------------|-----------------|---------|---------------------|
| **Recommendation UI**         | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐        | Medium          | Highest | $0 (Vercel + Supabase) |
| **Match Feedback Loop**       | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐        | Low             | Highest | $0 |
| Background Scheduling / Cron  | ⭐⭐⭐      | ⭐⭐⭐          | High            | High    | $0 (GitHub Actions) |
| Notifications                 | ⭐⭐⭐      | ⭐⭐⭐          | Medium          | Medium  | $0 (Supabase Edge) |
| Analytics & Monitoring        | ⭐⭐        | ⭐⭐            | Medium          | Low     | Low |
| Admin Tooling                 | ⭐⭐        | ⭐             | High            | Low     | $0 |

### Why Recommendation UI + Feedback Loop Wins

1. **The Matching Engine is currently invisible to the user.** Phase 13 built a complete backend pipeline producing `matches` rows in Supabase. However, zero UI surface exposes these matches to students. A matching engine that no user can see provides exactly zero product value. This is a product-blocking gap.

2. **Beta students cannot test what they cannot see.** Before handing off to real students, they must be able to view the recommendations generated for them. Without this, the product is untestable in any real capacity.

3. **Feedback is the engine of improvement.** The `user_feedback` column (`applied`, `rejected`, `saved`) already exists in the `matches` table. The Phase 13 architecture intentionally preserved this column through upserts specifically so that user actions are never lost. But the column is currently empty because there is no UI for the user to provide feedback. Collecting signal immediately on first use is far more valuable than any infrastructure improvement.

4. **Background Scheduling can wait.** The current architecture works. Workers execute synchronously during development, which is sufficient for beta testing with low user volume. The scaling risk (Vercel timeout at 50+ simultaneous users) only materializes under production load, not small-cohort beta testing. Decoupling the worker is a scaling concern, not a product-readiness concern.

5. **Notifications require feedback to be meaningful.** "You have new recommendations!" is only valuable if the user has already interacted with previous recommendations and explicitly desires more. Notifications before a feedback loop exist produce noise.

6. **Analytics require data to analyze.** Zero users have provided feedback, applied to anything, or saved a match. An analytics dashboard today would display empty charts. This is backwards.

---

## 3. Architecture Design

### 3.1 System Overview

```
matches table (Supabase)
        │
        ▼
MatchService (server action)
        │
        ▼
MatchCard component (UI)
        │
   ┌────┴─────┐
   │           │
Applied     Rejected / Saved
   │           │
   ▼           ▼
feedback action (server action)
        │
        ▼
matches.user_feedback column (Supabase UPDATE)
```

### 3.2 Data Flow

#### Fetch Path (Read)
1. User navigates to `/dashboard/sessions/[id]/matches`.
2. Next.js Server Component fetches all `matches` for this session where `profile_id = auth.uid()`.
3. For each match, the `internship_id` is used to join `internships` to retrieve company name, role title, location, description, and application URL.
4. Matches are sorted descending by `semantic_score`.
5. Server renders the full match list with explanation text and score.
6. `user_feedback` state is passed down to each `MatchCard`.

#### Write Path (Feedback)
1. User clicks "Save", "Apply", or "Reject" on a `MatchCard`.
2. A Next.js Server Action executes an authenticated Supabase UPDATE.
3. The UPDATE strictly targets `matches.user_feedback` on the specific row, filtered by `id` AND `profile_id = auth.uid()` (RLS double-enforcement).
4. The UI immediately reflects the new state via optimistic update.

### 3.3 Component Hierarchy

```
/dashboard/sessions/[id]/matches
  └── SessionMatchesPage (Server Component)
        ├── MatchListHeader (score summary, match count)
        └── MatchCard[] (Client Component)
              ├── InternshipHeader (company, role, location badge)
              ├── ScoreBar (visual 0–100 semantic score)
              ├── ExplanationText (AI-generated 1–2 sentence explanation)
              ├── TagList (matched skill tags)
              ├── FeedbackButtons (Apply / Save / Reject)
              └── ApplicationLink (opens application_url in new tab)
```

### 3.4 MatchCard States

Each `MatchCard` has four exclusive states driven by `user_feedback`:
- **Neutral** (null): Default state, all three feedback buttons visible.
- **Applied** (`applied`): Card shows an "Applied" badge in green, "Apply" button disabled.
- **Saved** (`saved`): Card shows a bookmark indicator, still shows Apply and Reject.
- **Rejected** (`rejected`): Card is visually dimmed (opacity 0.5), collapsed, with an Undo button.

This behavior mirrors real-world job tracking UX patterns from Handshake and LinkedIn.

### 3.5 Realtime Match Arrival (Optional Enhancement)
The `SessionDetail` component already implements Supabase Realtime subscriptions. The same pattern can be extended to the matches page: subscribe to `INSERT` events on `matches WHERE session_id=eq.[id]` so that new matches appear on screen while the worker is still running, without requiring a page refresh.

---

## 4. Required Database Changes

### 4.1 Required — Composite Index on matches.session_id + profile_id
The fetch query for the matches page will always be:
```sql
SELECT m.*, i.*
FROM matches m
JOIN internships i ON i.id = m.internship_id
WHERE m.session_id = $1 AND m.profile_id = $2
ORDER BY m.semantic_score DESC;
```
A composite B-Tree index on `(session_id, profile_id)` ensures this query executes as an index scan.

**New migration required:**
```sql
CREATE INDEX IF NOT EXISTS idx_matches_session_profile
ON public.matches(session_id, profile_id);
```

### 4.2 Required — matches score index for sorted reads
To support sorted reads efficiently:
```sql
CREATE INDEX IF NOT EXISTS idx_matches_semantic_score
ON public.matches(semantic_score DESC);
```

### 4.3 Optional — matches TTL housekeeping (Deferred)
Add a PostgreSQL function and cron (via Supabase pg_cron extension) to delete matches older than 30 days. This is deferred but should be created within this phase to keep the table bounded as real beta users begin generating data.

```sql
-- Run weekly to clean stale matches
DELETE FROM public.matches
WHERE created_at < NOW() - INTERVAL '30 days'
  AND user_feedback IS NULL;
```

> **Note:** Only matches with `user_feedback IS NULL` (never interacted with) should be eligible for deletion. Saved, applied, and rejected matches must be retained indefinitely per the "Never overwrite user actions" constraint.

### 4.4 RLS Policy Update
The existing RLS policy `"Users can update own matches"` is already defined. Verify the policy allows targeted updates to `user_feedback` specifically:
```sql
CREATE POLICY "Users can update own matches" ON public.matches
  FOR UPDATE USING (auth.uid() = profile_id);
```
This is already present in `initial_schema.sql`. No change needed.

### 4.5 No schema changes needed
The `matches` table already has all required columns (`semantic_score`, `explanation`, `user_feedback`, `internship_id`, `profile_id`, `session_id`). No `ALTER TABLE` is required.

---

## 5. New Route Structure

```
src/app/dashboard/sessions/[id]/
  ├── page.tsx               (existing — timeline events)
  └── matches/
        └── page.tsx         (NEW — match recommendations list)
```

The session detail page should add a prominent "View Matches" link/button after the session reaches `completed` status.

---

## 6. New Feature Module Structure

```
src/features/matching/
  ├── types/index.ts         (existing)
  ├── services/
  │   ├── MatchEngine.ts     (existing)
  │   ├── MatchScorer.ts     (existing)
  │   ├── MatchExplanationService.ts  (existing)
  │   └── MatchRepository.ts (existing)
  └── components/            (NEW — UI layer)
        ├── MatchListHeader.tsx
        ├── MatchCard.tsx
        ├── ScoreBar.tsx
        ├── TagList.tsx
        └── FeedbackButtons.tsx
```

### Server Actions

```
src/features/matching/actions/
  └── feedback.action.ts     (NEW — server action for recording feedback)
```

The server action must:
1. Accept `matchId` and `feedback: 'applied' | 'saved' | 'rejected'`.
2. Authenticate the user via `createClient()`.
3. Update `matches SET user_feedback = $2 WHERE id = $1 AND profile_id = auth.uid()`.
4. Return the updated row for optimistic UI confirmation.

---

## 7. Implementation Roadmap

### Sprint 1: Database & Data Layer
- [ ] Create migration `20260619100000_idx_matches_session_profile.sql` (composite index).
- [ ] Create migration `20260619200000_idx_matches_semantic_score.sql` (score desc index).
- [ ] Write `MatchService.getSessionMatches(sessionId, profileId)` — fetches matches joined with internships.
- [ ] Write `feedback.action.ts` — server action for recording user feedback.

### Sprint 2: Core UI Components
- [ ] Build `MatchCard.tsx` — card displaying role, company, location, score, explanation, and tags.
- [ ] Build `ScoreBar.tsx` — visual representation of 0–100 semantic score.
- [ ] Build `FeedbackButtons.tsx` — Apply, Save, Reject buttons with optimistic state.
- [ ] Build `TagList.tsx` — matched skill tag pills.

### Sprint 3: Page Integration
- [ ] Create `src/app/dashboard/sessions/[id]/matches/page.tsx`.
- [ ] Update `SessionDetail.tsx` to add a "View Matches" link upon session completion.
- [ ] Apply CSS Modules styling — premium card designs, score bar gradients, badge states.

### Sprint 4: Realtime Enhancement (Optional)
- [ ] Subscribe to `matches` `INSERT` events on the matches page for live match arrival.

### Sprint 5: Polish & Testing
- [ ] Handle empty state (no matches found above threshold).
- [ ] Handle edge case where `application_url` is null (show "No direct link — search manually").
- [ ] Handle Rejected state collapse animation.
- [ ] End-to-end verification: Start a session, wait for matching to complete, view matches, apply to one, reject another.

---

## 8. Scalability Constraints

### Under current architecture (synchronous worker):
- 1–10 users: Fully functional.
- 10–50 users: Sessions will queue, but each individual user experience remains correct.
- 50+ users: Worker timeout risk materializes. This is the trigger for Phase 15 (Worker Decoupling).

### Recommendation UI is not constrained by worker architecture:
- The Recommendation UI reads from the `matches` table, which is populated by the worker independently. Even if the worker timing is suboptimal, the UI will display whatever matches have been successfully persisted.

---

## 9. UX Philosophy Notes

- **Do not show raw numeric scores.** Instead, translate scores into descriptive labels: 80–100 = "Excellent Match", 60–79 = "Strong Match", 40–59 = "Good Match", 25–39 = "Possible Match".
- **Show explanation text prominently.** This is the key differentiator from a plain job board. The AI explanation is what transforms a score into a personalized narrative.
- **Application URL must open in a new tab** with `target="_blank" rel="noopener noreferrer"`.
- **Rejected cards collapse but are not deleted.** Users should be able to undo accidental rejections.
- **Do not use Tailwind CSS.** All styles must be CSS Modules only.

---

## 10. Success Criteria for Phase 14 Completion

- [ ] `npx tsc --noEmit` continues to return zero errors.
- [ ] User can navigate from a completed session to their match recommendations.
- [ ] Each match displays company, role, location, semantic score, explanation, and matched tags.
- [ ] User can click Apply / Save / Reject and the state persists on page reload.
- [ ] Rejected matches collapse with an Undo option.
- [ ] "Apply" button correctly opens the external application URL.
- [ ] `matches.user_feedback` column is updated correctly in Supabase for all three feedback types.
- [ ] The UI remains entirely CSS Modules with no Tailwind CSS.
- [ ] Empty state is handled gracefully (no matches above threshold).

---

## 11. What Remains After Phase 14

| Phase | Objective |
|-------|-----------|
| **Phase 15** | Worker Decoupling — GitHub Actions / Cron to remove Vercel timeout risk. |
| **Phase 16** | Notifications — alert users when new matches arrive via Supabase Edge Functions + Email. |
| **Phase 17** | Analytics — session success rates, match quality trends, skill coverage gaps. |
| **Phase 18** | UI Polish — full Glassmorphism, animations, onboarding visual overhaul. |
| **Phase 19** | Admin Tooling — manually deactivating bad internship listings, reviewing flagged matches. |

---

## 12. Documentation Traceability

| Artifact | Location |
|----------|----------|
| Initial Schema | `supabase/migrations/20260618000000_initial_schema.sql` |
| Matching Engine Architecture | `PHASE_13_ARCHITECTURE.md` |
| Database Scalability Audit | `PHASE_13_DB_AUDIT.md` |
| Project Philosophy | `PROJECT_BOOTSTRAP.md` |
| Current State | `CURRENT_STATE.md` |
| This Document | `PHASE_14_ARCHITECTURE.md` |
