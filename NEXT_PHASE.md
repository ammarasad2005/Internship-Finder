# Next Phase: Handoff Guide

## 1. Current Branch
`phase-15-planning` (until merged)

## 2. Next Required Branch
`phase-16-notifications`

## 3. Last Completed Phase
Phase 15: Background Scheduling & Worker Decoupling — **COMPLETE**.

## 4. Current Project Status
Phase 15 (background execution workflow, trigger endpoint, and standalone script runner) has been successfully implemented and verified with zero compilation errors. The matching engine and crawler run asynchronously off-thread in GitHub Actions.

## 5. Outstanding Bugs (Must Fix Before Any Other Work)
*None.*

## 6. Technical Debt
- **Sequential Gemini Scaling Bottleneck:** Explanation generation is executed sequentially. While moving execution to GitHub Actions eliminates Next.js/Vercel timeout limits, it still consumes excessive GHA runner minutes. Needs parallelization/batching.
- **Matches TTL Cleanup:** The `matches` table will grow infinitely. Needs a 30-day TTL job.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during persistence.
- **UI Styling pass:** Styling relies on bare CSS Modules and needs aesthetic animation/glassmorphism adjustments.
- **Types Drift:** `types.ts` must be manually kept in sync with the schema.

## 7. Immediate Next Objective
**Phase 16: Notifications**

Implement asynchronous alerts (e.g., email notification summaries) to notify students when new high-quality internship matches (score > 75) are found for their profile.

## 8. Exact Next Prompt to Run
```
/goal Begin Phase 16 implementation for Notifications.

Steps:
1. Create a Supabase migration to add `email_notifications_enabled BOOLEAN DEFAULT true` to the `profiles` table.
2. Implement notification settings toggles in the User UI (Onboarding / Settings pages).
3. Set up notification dispatcher logic to collect new matches generated during a session, filters for high scores (> 75), and prepares email alerts.
4. Integrate a transaction email client wrapper (e.g., using Resend, Mailgun, or dynamic mock switch) to compile and send styled HTML email notifications.
5. Ensure emails direct the user to the matches URL: `/dashboard/sessions/[id]/matches`.
6. Run:
   npx tsc --noEmit
```

## 9. Recommended Model
Claude 3.5 Sonnet or Gemini 3.5 Flash (High)

## 10. Recommended Antigravity Mode
Standard Auto-Execution

