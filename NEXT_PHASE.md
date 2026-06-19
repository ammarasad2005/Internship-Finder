# Next Phase: Handoff Guide

## 1. Current Branch
`phase-13a-matching-fixes` (until merged)

## 2. Next Required Branch
`phase-14-worker-decoupling`

## 3. Last Completed Phase
Phase 13: Matching Engine Architecture, Implementation, & Audit Fixes — **COMPLETE**

## 4. Current Project Status
Phase 13 implementation and audit fixes are fully complete. The `MatchEngine` has been wired into `WorkerLifecycle.runSession()`. The codebase compiles perfectly with zero TypeScript errors. The `discovered_at` migration was completed. Gemini explanation generation is operational for the top 5 matches per user.

## 5. Outstanding Bugs (Must Fix Before Any Other Work)
*None.*

## 6. Technical Debt
- **Sequential Gemini Scaling Bottleneck:** Generating explanations sequentially will breach Vercel's 5-minute timeout if active users exceed ~50.
- **Matches TTL Cleanup:** The `matches` table will grow infinitely. Needs a 30-day TTL job in the future.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during persistence.
- **Server-Only Guards:** No `server-only` import guard on `MatchEngine` or `MatchRepository`.
- **UI:** The UI relies on bare CSS Modules and needs a full visual pass.
- **Types Drift:** `types.ts` must be manually kept in sync with the schema.

## 7. Immediate Next Objective
**Phase 14: GitHub Actions / Cron Job Decoupling**

## 8. Exact Next Prompt to Run
```
Begin Phase 14: GitHub Actions / Cron Job Decoupling.
Create the necessary workflows and API endpoints to decouple WorkerLifecycle from the Vercel UI thread.
```

## 9. Recommended Model
Claude Sonnet (Thinking) or Gemini 2.5 Pro

## 10. Recommended Antigravity Mode
Standard Auto-Execution
