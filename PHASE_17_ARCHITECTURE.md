# Phase 17 Architecture: Feedback Learning Loop

## 1. Executive Summary
The Internship Finder currently generates high-quality matches and collects explicit user feedback (`saved`, `applied`, `rejected`) via the UI built in Phase 14. However, this feedback is currently static; the system does not learn from it. 

Phase 17 will close the recommendation loop. By aggregating historical feedback during the background worker execution, we will dynamically adjust search query generation and deterministic match scoring. This transforms the system from a static search engine into a personalized, self-improving recommendation engine, representing the highest possible leverage for user value.

## 2. Candidate Comparison Table

| Candidate Phase | User Value | Engineering Effort | Scalability Fit (50 Users) | Deterministic Fit | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Feedback Learning Loop** | **High** | **Medium** | **Excellent** | **High** | **Selected** |
| Realtime Match Updates | Medium | High | Poor (WebSockets overhead) | N/A | Deferred (Users get emails now) |
| Recommendation Explainability | Low | Medium | Poor (Token cost) | Low | Deferred (Top-5 already have explanations) |
| Analytics Dashboard | Low (Admin only) | Low | Excellent | N/A | Deferred (Does not improve product quality) |
| Admin Operations | Low | Medium | Excellent | N/A | Deferred |

## 3. Recommended Phase 17: Feedback Learning Loop
**Why Prioritize This?**
A recommendation engine that doesn't learn from explicit feedback frustrates users. Since the UI (Phase 14) already collects the feedback perfectly, and the background worker (Phase 15) has the compute time to process it, Phase 17 provides immense value with zero new database migrations. It honors the "Deterministic First" philosophy by using simple statistical overlaps (e.g., boosting companies the user previously applied to) before resorting to LLM adjustments.

## 4. Architecture Overview

### A. Feedback Aggregation (`FeedbackProfileBuilder.ts`)
A new service executed at the start of `WorkerLifecycle.runSession()`.
It queries the `matches` table (joined with `internships`) for the current `profile_id` where `user_feedback IS NOT NULL`.
It compiles a `FeedbackProfile` object:
```typescript
interface FeedbackProfile {
  positiveCompanies: Set<string>;
  positiveTags: Set<string>;
  negativeCompanies: Set<string>;
  negativeKeywords: Set<string>;
}
```

### B. Query Generation Injection (`QueryGenerationService.ts`)
The `FeedbackProfile` is passed into the `QueryGenerationService`.
If using the Gemini AI fallback, the prompt is enriched: 
*"The user previously liked internships at [Companies] with tags [Tags]. They rejected internships containing [Keywords]. Adjust the search queries to find similar positive roles and avoid the negative ones."*

### C. Deterministic Match Scoring Adjustment (`MatchScorer.ts`)
The `MatchScorer.ts` matrix (currently an 85-point deterministic heuristic) is updated to accept the `FeedbackProfile`.
Dynamic point adjustments are added:
* **+15 points:** Internship company exists in `positiveCompanies`.
* **+10 points:** Internship tags heavily overlap with `positiveTags`.
* **-30 points:** Internship title/company exists in negative feedback.
* **-50 points:** Exact company previously rejected.

## 5. Database Impact Analysis
* **Migrations Required:** None. The `matches` table already contains the `user_feedback` ENUM (`saved`, `applied`, `rejected`).
* **Query Performance:** The query to fetch historical feedback will be `SELECT ... FROM matches m JOIN internships i ON m.internship_id = i.id WHERE m.profile_id = X AND m.user_feedback IS NOT NULL`.
* **Index Usage:** The composite index `idx_matches_session_profile` (created in Phase 14) will be utilized, but we should ensure a profile-only index or rely on the existing profile index to keep the aggregation query under 50ms.

## 6. Security Considerations
* **Data Isolation:** `FeedbackProfileBuilder` must enforce strict `eq('profile_id', currentProfileId)` constraints to ensure a user's recommendation weights are never contaminated by another user's feedback.
* **Service Role Access:** Since this runs in the GHA worker, it will use the `SUPABASE_SERVICE_ROLE_KEY`. Strict profile-ID propagation is required to prevent data leakage across the loop.

## 7. Scalability Considerations
* **Zero Cost:** Deterministic aggregation of historical feedback costs $0 and 0 Gemini tokens.
* **Memory Constraints:** A user may accumulate thousands of matches over time. The aggregation query should only pull the `internship_id`, `company_name`, `role_title`, and `tags` to prevent V8 memory bloat in the worker script.

## 8. Risks & Mitigations
* **Risk: Feedback Echo Chamber (Overfitting).** If a user likes one "Software Engineer" role at a specific company, the system might aggressively filter out all other companies, destroying discovery.
* **Mitigation:** Cap dynamic scoring boosts (e.g., maximum +20 points from feedback). Maintain a baseline randomness/discovery allowance in `SearchWavePlanner` to ensure out-of-network roles are still crawled.

## 9. Implementation Roadmap
1. **Create `FeedbackProfileBuilder.ts`:** Implement the aggregation logic to compile `positive` and `negative` signals from historical matches.
2. **Update `MatchScorer.ts`:** Inject the `FeedbackProfile` into the scoring matrix and implement the dynamic point adjustments.
3. **Update `QueryGenerationService.ts`:** Pass the summarized feedback into the LLM prompts to influence upstream Google CSE query generation.
4. **Update `WorkerLifecycle.runSession`:** Wire the `FeedbackProfileBuilder` to execute immediately after session initialization, passing the profile down the execution chain.
5. **Add Server-Only Guards:** Ensure new services are marked `import 'server-only'`.
6. **Compile & Audit:** Run `npx tsc --noEmit` and verify standard worker execution still passes cleanly.

## 10. Success Criteria
* Worker execution incorporates historical feedback dynamically without crashing.
* `MatchScorer` successfully boosts scores for internships sharing traits with previously `saved`/`applied` matches.
* `MatchScorer` penalizes scores for traits previously `rejected`.
* Zero structural database changes required.
* TypeScript compilation passes cleanly.
