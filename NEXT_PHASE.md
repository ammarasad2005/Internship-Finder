# Next Phase: Handoff Guide

## 1. Current Branch
`phase-15-planning` (until merged)

## 2. Next Required Branch
`phase-15-worker-decoupling`

## 3. Last Completed Phase
Phase 14: Recommendation UI & Match Feedback Loop — **COMPLETE** (Phase 15 Planning also complete).

## 4. Current Project Status
Phase 14 (matches list view & action logs) is fully implemented and audited. Phase 15 Planning is also complete; we have authored the architecture plan `PHASE_15_ARCHITECTURE.md` specifying details for decoupling the background worker off the Next.js frontend thread using GitHub Action Repo Dispatches.

## 5. Outstanding Bugs (Must Fix Before Any Other Work)
*None.*

## 6. Technical Debt
- **Sequential Gemini Scaling Bottleneck:** Generating explanations sequentially will breach Vercel's 5-minute timeout if active users exceed ~50. Handled by moving the execution into the decoupled Actions worker runner.
- **Matches TTL Cleanup:** The `matches` table will grow infinitely. Needs a 30-day TTL job.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during persistence.
- **Server-Only Guards:** No `server-only` import guard on `MatchEngine` or `MatchRepository` (to be added in Phase 15).
- **UI Styling pass:** Styling relies on bare CSS Modules and needs aesthetic animation/glassmorphism adjustments.
- **Types Drift:** `types.ts` must be manually kept in sync with the schema.

## 7. Immediate Next Objective
**Phase 15: Background Scheduling & Worker Decoupling (Implementation)**

Implement the decoupled background execution loop using GitHub Actions Repository Dispatches.

## 8. Exact Next Prompt to Run
```
/goal Begin Phase 15 implementation according to PHASE_15_ARCHITECTURE.md.

Steps:
1. Create the API route `/src/app/api/sessions/trigger/route.ts` to receive triggers, verify auth, and POST dispatch requests to GitHub repos/dispatches endpoint.
2. Update `StartSessionButton.tsx` to POST requests to this API endpoint instead of executing `MockWorker.start` on the client.
3. Create a CLI entrypoint `src/scripts/run-worker.ts` that initializes Supabase via SERVICE_ROLE_KEY and triggers `WorkerLifecycle.runSession(sessionId, profileId)`.
4. Create the GitHub Actions workflow `.github/workflows/worker.yml` listening for `trigger-worker` dispatches to run the node script.
5. Add 'server-only' guards to matching and worker core services to prevent bundle leakage.
6. Verify tsc compilation.
```

## 9. Recommended Model
Claude 3.5 Sonnet or Gemini 3.5 Flash (High)

## 10. Recommended Antigravity Mode
Standard Auto-Execution

