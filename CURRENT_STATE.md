# Current State: Internship Finder

**Last Updated:** Phase 14 Recommendation UI & Match Feedback Loop (PASSED)

## 1. Codebase Status
- **Current Git Branch:** `phase-14-recommendation-ui` (until merged)
- **Application Status:** Phase 14 Recommendation UI & Match Feedback Loop has been implemented, integrated, and audited. The matching engine's recommendations are now fully visible to users via a dedicated UI page, and they can provide persistent feedback. The TypeScript compiler (`npx tsc --noEmit`) exits with 0 errors.

## 2. Implemented Systems (Production-Ready)
- Next.js 15 App Router Architecture with `src/features/` module separation.
- Supabase SSR Auth (Login/Signup).
- Supabase PostgreSQL backend fully modeled (11 tables + RLS + Triggers + Enums).
- Supabase Realtime UI integrations (WebSockets).
- Research Brain Pipeline (Domain Expansion -> Query Generation -> Query Ranking -> Plan Building).
- Worker Node Foundation (Lifecycle -> Executor -> Retry Logic -> Cost Tracking).
- Content Extraction & Canonicalization Pipeline.
- **Phase 13 Matching Engine:** `MatchScorer`, `MatchExplanationService`, `MatchRepository`, `MatchEngine` integrated into `WorkerLifecycle.runSession()`.
- **Phase 14 UI & Feedback Loop:** 
  - Server Action `recordMatchFeedback` inside `feedback.action.ts` for student feedback updates (`applied`, `saved`, `rejected`).
  - Next.js Server Page route `/dashboard/sessions/[id]/matches` displaying matched internships.
  - Interactive UI components (`MatchCard`, `FeedbackButtons`, `ScoreBar`, `TagList`, `MatchListHeader`) with CSS Modules styling, optimistic UI states, and responsive undo actions.
  - Performance indexes (`idx_matches_session_profile` and `idx_matches_semantic_score`) to accelerate sorting and reading matches.
  - Session Detail page (`SessionDetail.tsx`) updated to link directly to recommendations on completion.

## 3. Deferred Systems & Mocks
- **`QueryRankingService`**: Still mocked, returns priority 0 for all queries.
- **GitHub Actions Runner**: Worker is still synchronously invoked via UI for testing.

## 4. Known Technical Debt & Risks
- **Sequential Gemini Scaling Bottleneck (High Risk):** Gemini explanation calls inside `MatchEngine.ts` are processed sequentially within a `for` loop. This will hit Vercel 5-minute timeout limits if user load exceeds ~50 active simultaneous users. Deferring parallelization / background queuing to Phase 15.
- **CSS Styling:** Bare CSS Modules. Needs a general layout / design polish.
- **TypeScript Types Drift:** `types.ts` is manually maintained and must be carefully synced with the schema.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during DB upserts.
- **Matches Table Bloat:** No 30-day TTL deletion strategy. Will grow unbounded in production.
- **Missing Import Guards:** No `server-only` import guard protecting `MatchEngine` and `MatchRepository` from accidental frontend bundle inclusion.

## 5. Immediate Next Phase
**Phase 15: Background Scheduling & Worker Decoupling**

The matches UI is now live. We must decouple the `WorkerLifecycle` execution from the synchronous Next.js request thread to eliminate serverless timeout limits as concurrency grows.

See `NEXT_PHASE.md` for planning.

