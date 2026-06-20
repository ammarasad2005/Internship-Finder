# First Real Run Checklist

This checklist is to be executed *after* all configuration steps in `PRODUCTION_BOOTSTRAP.md` have been completed, but *before* the system is opened to alpha users.

## Pre-Flight
- [ ] Vercel deployment reports `Ready`.
- [ ] Supabase database migrations are applied (`matches`, `search_sessions`, `internships`, etc. exist).
- [ ] Supabase Webhook `session_completed_notifier` is active.
- [ ] GitHub Actions tab shows the `Background Matching Worker` workflow exists.
- [ ] All 15 required secrets across Vercel and GitHub Actions are populated.

## Phase 1: Authentication & UI Initialization
- [ ] Navigate to the production Vercel URL.
- [ ] Create a new test account via the Supabase Auth UI.
- [ ] Complete the onboarding profile flow:
  - Add at least 3 skills (e.g., `React`, `Node.js`, `TypeScript`).
  - Add at least 1 project with technologies.
  - Set location preference (e.g., `Remote`).
- [ ] Verify the profile data appears in the Supabase `profiles` table.

## Phase 2: Session Triggering
- [ ] Click the "Start Search" button on the dashboard.
- [ ] Verify the UI transitions to a loading state and polls for updates.
- [ ] Verify a new row is created in the Supabase `search_sessions` table with status `pending`.

## Phase 3: Background Worker Execution
- [ ] Open the GitHub Actions tab in your repository.
- [ ] Verify a new workflow run has been dispatched.
- [ ] Click into the runner logs and monitor the output:
  - [ ] **Research Phase:** Gemini generates `ExpandedDomains` and Google CSE queries.
  - [ ] **Discovery Phase:** Google CSE is queried and DOMs are fetched.
  - [ ] **Persistence Phase:** Internships are deduplicated and inserted into Supabase.
  - [ ] **Matching Phase:** The `MatchEngine` scores internships and AI boosts top matches.
- [ ] Verify the workflow exits with a success code.

## Phase 4: Data Validation
- [ ] Check the Supabase `internships` table. Ensure new rows exist.
- [ ] Check the Supabase `matches` table. Ensure scores range up to 100.
- [ ] Return to the Vercel UI. Verify the dashboard now displays the matched internships.

## Phase 5: Event Notifications
- [ ] Verify the `search_sessions` table status is now `completed`.
- [ ] Check the Supabase Database Webhook logs. Verify it successfully POSTed to Vercel and received a `202 Accepted` or `200 OK`.
- [ ] Check the target Gmail inbox. Verify the Nodemailer HTML digest has arrived containing the top matched internships.
- [ ] Check the Supabase `search_sessions` table again. Verify `notification_sent` is `true` and `notification_sent_at` is populated.

## Post-Flight
If all checks pass, the production bootstrap is considered an absolute success. Proceed to fill out the `FIRST_RUN_POSTMORTEM.md` template.
