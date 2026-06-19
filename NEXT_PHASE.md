# Next Phase: Handoff Guide

## 1. Current Branch
`phase-14-recommendation-ui` (until merged)

## 2. Next Required Branch
`phase-15-worker-decoupling`

## 3. Last Completed Phase
Phase 14: Recommendation UI & Match Feedback Loop — **COMPLETE**

## 4. Current Project Status
Phase 14 implementation is complete. The `/dashboard/sessions/[id]/matches` page shows student matched internships with custom score label classifications, tag filters, and AI matching explanations. Feedback (Apply, Save, Reject, and Undo) is fully persistent using optimistic UI updates coupled with server-verified Server Actions and PostgreSQL composite indexing. Zero compilation errors exist.

## 5. Outstanding Bugs (Must Fix Before Any Other Work)
*None.*

## 6. Technical Debt
- **Sequential Gemini Scaling Bottleneck:** Generating explanations sequentially will breach Vercel's 5-minute timeout if active users exceed ~50. Priority item for Phase 15 architecture decoupling.
- **Matches TTL Cleanup:** The `matches` table will grow infinitely. Needs a 30-day TTL job.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during persistence.
- **Server-Only Guards:** No `server-only` import guard on `MatchEngine` or `MatchRepository`.
- **UI Styling pass:** Styling relies on bare CSS Modules and needs aesthetic animation/glassmorphism adjustments.
- **Types Drift:** `types.ts` must be manually kept in sync with the schema.

## 7. Immediate Next Objective
**Phase 15: Background Scheduling & Worker Decoupling**

We need to decouple `WorkerLifecycle` execution from the frontend UI thread. The session trigger should trigger a background task (such as triggering a GitHub Actions runner, a background queue consumer, or similar asynchronous runner) instead of blocking the synchronous Next.js request.

## 8. Exact Next Prompt to Run
```
/goal Begin Phase 15 Planning for Background Scheduling & Worker Decoupling.

Consider:
- Zero-cost infrastructure (GitHub Actions, Vercel cron jobs, or database triggers).
- Decoupling WorkerLifecycle from Vercel's 5-minute HTTP request execution environment.
- Solving the sequential Gemini scaling bottleneck during matching.
- Adding a 30-day matches TTL cleanup background job.

Produce a complete PHASE_15_ARCHITECTURE.md design document and outline the next steps. Do not write code.
```

## 9. Recommended Model
Gemini 3.5 Flash (High) or Claude 3.5 Sonnet

## 10. Recommended Antigravity Mode
Standard Auto-Execution
