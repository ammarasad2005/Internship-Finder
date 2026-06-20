# Next Phase: Handoff Guide

## 1. Current Branch
`phase-18-planning` (until merged)

## 2. Next Required Branch
`phase-18-bootstrap`

## 3. Last Completed Phase
Phase 17: Feedback Learning Loop — **COMPLETE**.
Phase 18 Planning: Production Bootstrap — **COMPLETE**.

## 4. Current Project Status
Phase 18 Planning is complete. The system architecture for a live production deployment and end-to-end testing protocol is designed and documented in `PHASE_18_ARCHITECTURE.md`. The 17-phase underlying architecture is fully implemented, completely typesafe, and ready for its first real test.

## 5. Outstanding Bugs (Must Fix Before Any Other Work)
*None.*

## 6. Technical Debt
- **Duplicate Feedback Profile Reads:** `FeedbackProfile` is fetched twice for the triggering user (once in `WorkerLifecycle` and once in `MatchEngine`).
- **N+1 Feedback Aggregation:** `MatchEngine.fetchActiveProfiles()` pulls feedback loops sequentially. This is safe for 50 users but creates N+1 latency at scale. Needs an `IN` clause refactor.
- **Sequential Gemini Scaling Bottleneck:** Explanation generation is executed sequentially. While moving execution to GitHub Actions eliminates Next.js/Vercel timeout limits, it still consumes excessive GHA runner minutes. Needs parallelization/batching.
- **Matches TTL Cleanup:** The `matches` table will grow infinitely. Needs a 30-day TTL job.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during persistence.
- **UI Styling pass:** Styling relies on bare CSS Modules and needs aesthetic animation/glassmorphism adjustments.
- **Types Drift:** `types.ts` must be manually kept in sync with the schema.

## 7. Immediate Next Objective
**Phase 18: Production Bootstrap & First Real Run**

Before investing heavily in UI Polish, we must validate the 17-phase architecture in a real production environment. This includes configuring Vercel, Supabase, and GitHub Actions, and executing the worker pipeline against live internet sources to verify Google CSE parsing, Gemini API quotas, and SMTP webhooks.

## 8. Exact Next Prompt to Run
```
/goal Begin Phase 18 implementation according to PHASE_18_ARCHITECTURE.md.

Steps:
1. Configure and deploy the Supabase schema to a live production instance.
2. Deploy the Next.js app to Vercel and configure necessary environment variables.
3. Configure the GitHub Actions repository secrets (Gemini, Supabase, Google CSE).
4. Establish and verify the Supabase Database Webhook to the Vercel endpoint.
5. Manually trigger the first session from the live UI.
6. Verify the GitHub Action executes completely without error.
7. Verify the Nodemailer SMTP email arrives successfully.
8. Compile a baseline rate limit and duration post-mortem to determine true costs for the 50-user target.
```

## 9. Recommended Model
Claude 3.5 Sonnet or Gemini 3.5 Flash (High)

## 10. Recommended Antigravity Mode
Standard Auto-Execution

