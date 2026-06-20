# Next Phase: Handoff Guide

## 1. Current Branch
`phase-17-planning` (until merged)

## 2. Next Required Branch
`phase-17-feedback-loop`

## 3. Last Completed Phase
Phase 16: Notifications & User Re-engagement — **COMPLETE**.
Phase 17 Planning: Feedback Learning Loop — **COMPLETE**.

## 4. Current Project Status
Phase 16 (Notifications & Re-engagement via Webhooks/Nodemailer) is fully implemented and audited. Phase 17 Planning is complete. `PHASE_17_ARCHITECTURE.md` has been authored detailing the transition to a dynamic, self-improving recommendation engine using historical user feedback.

## 5. Outstanding Bugs (Must Fix Before Any Other Work)
*None.*

## 6. Technical Debt
- **Sequential Gemini Scaling Bottleneck:** Explanation generation is executed sequentially. While moving execution to GitHub Actions eliminates Next.js/Vercel timeout limits, it still consumes excessive GHA runner minutes. Needs parallelization/batching.
- **Matches TTL Cleanup:** The `matches` table will grow infinitely. Needs a 30-day TTL job.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during persistence.
- **UI Styling pass:** Styling relies on bare CSS Modules and needs aesthetic animation/glassmorphism adjustments.
- **Types Drift:** `types.ts` must be manually kept in sync with the schema.

## 7. Immediate Next Objective
**Phase 17: Feedback Learning Loop (Implementation)**

Implement the `FeedbackProfileBuilder` to aggregate historical user feedback. Inject these insights dynamically into the `MatchScorer` and `QueryGenerationService` to create a self-improving recommendation loop.

## 8. Exact Next Prompt to Run
```
/goal Begin Phase 17 implementation according to PHASE_17_ARCHITECTURE.md.

Steps:
1. Create `src/features/brain/services/FeedbackProfileBuilder.ts` to aggregate user feedback from the `matches` and `internships` tables.
2. Update `src/features/matching/services/MatchScorer.ts` to accept the `FeedbackProfile` and dynamically adjust scores based on positive/negative overlaps.
3. Update `src/features/brain/services/QueryGenerationService.ts` to accept the `FeedbackProfile` and inject preferences into the Gemini prompt.
4. Wire everything together inside `src/features/worker/WorkerLifecycle.ts`.
5. Run `npx tsc --noEmit` and audit the changes.
```

## 9. Recommended Model
Claude 3.5 Sonnet or Gemini 3.5 Flash (High)

## 10. Recommended Antigravity Mode
Standard Auto-Execution

