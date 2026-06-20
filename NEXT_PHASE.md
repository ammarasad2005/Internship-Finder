# Next Phase: Handoff Guide

## 1. Current Branch
`phase-15-planning` (until merged)

## 2. Next Required Branch
`phase-16-notifications`

## 3. Last Completed Phase
Phase 15: Background Scheduling & Worker Decoupling — **COMPLETE**.
Phase 16 Planning: Notifications & User Re-engagement — **COMPLETE**.

## 4. Current Project Status
Phase 15 (decoupled background crawler execution) is fully implemented and audited. Phase 16 Planning is also complete; we have evaluated the roadmap priorities and created `PHASE_16_ARCHITECTURE.md` to support user re-engagement via Database Webhook-triggered summary emails.

## 5. Outstanding Bugs (Must Fix Before Any Other Work)
*None.*

## 6. Technical Debt
- **Sequential Gemini Scaling Bottleneck:** Explanation generation is executed sequentially. While moving execution to GitHub Actions eliminates Next.js/Vercel timeout limits, it still consumes excessive GHA runner minutes. Needs parallelization/batching.
- **Matches TTL Cleanup:** The `matches` table will grow infinitely. Needs a 30-day TTL job.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during persistence.
- **UI Styling pass:** Styling relies on bare CSS Modules and needs aesthetic animation/glassmorphism adjustments.
- **Types Drift:** `types.ts` must be manually kept in sync with the schema.

## 7. Immediate Next Objective
**Phase 16: Notifications & User Re-engagement (Implementation)**

Implement the event-driven notification summaries triggered via Supabase Database Webhooks calling a Next.js API route that delivers transaction emails through Resend.

## 8. Exact Next Prompt to Run
```
/goal Begin Phase 16 implementation according to PHASE_16_ARCHITECTURE.md.

Steps:
1. Create Supabase database migration to add `email_notifications_enabled` (boolean, default true) and `notification_threshold` (integer, default 75) columns to the `profiles` table.
2. Update the frontend onboarding/settings UI (ProfileReview.tsx) to expose notification preference selectors (toggle and slider) and persist updates to Supabase.
3. Build the Next.js API webhook endpoint `/api/webhooks/session-completed` which validates authorization headers, checks profile notification toggles, gathers matches >= threshold, and constructs a responsive email template.
4. Integrate the Resend client SDK to deliver the generated HTML email summaries.
5. Set up the Supabase database webhook trigger on the `search_sessions` table to call the API endpoint when status becomes 'completed'.
6. Run `npx tsc --noEmit` to ensure a clean build.
```

## 9. Recommended Model
Claude 3.5 Sonnet or Gemini 3.5 Flash (High)

## 10. Recommended Antigravity Mode
Standard Auto-Execution

