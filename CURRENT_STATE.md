# Current State: Internship Finder

**Last Updated:** Phase 17 Architectural Planning (PASSED)

## 1. Codebase Status
- **Current Git Branch:** `phase-17-planning` (until merged)
- **Application Status:** Phase 16 Notifications & User Re-engagement is fully implemented. Phase 17 Planning (Feedback Learning Loop) is complete. The system architecture for integrating historical user feedback into match scoring and query generation is designed and documented in `PHASE_17_ARCHITECTURE.md`. TypeScript compilation passes with 0 errors.

## 2. Implemented Systems (Production-Ready)
- Next.js 15 App Router Architecture with `src/features/` module separation.
- Supabase SSR Auth (Login/Signup).
- Supabase PostgreSQL backend fully modeled (11 tables + RLS + Triggers + Enums).
- Supabase Realtime UI integrations (WebSockets).
- Research Brain Pipeline (Domain Expansion -> Query Generation -> Query Ranking -> Plan Building).
- Worker Node Foundation (Lifecycle -> Executor -> Retry Logic -> Cost Tracking).
- Content Extraction & Canonicalization Pipeline.
- **Phase 13 Matching Engine:** `MatchScorer`, `MatchExplanationService`, `MatchRepository`, `MatchEngine` integrated into `WorkerLifecycle.runSession()`.
- **Phase 14 UI & Feedback Loop:** Server Action `recordMatchFeedback` (`applied`, `saved`, `rejected`), Server Page `/dashboard/sessions/[id]/matches`, and components with optimistic updates.
- **Phase 15 Asynchronous Background Execution:**
  - Secure Next.js API route `/api/sessions/trigger` to authorize requests, insert session, and POST repository dispatch triggers.
  - Dedicated CLI runner script `src/scripts/run-worker.ts` that runs via `npx tsx` and initializes service-role client hooks to bypass RLS.
  - GitHub Actions Workflow `.github/workflows/worker.yml` triggered on dispatch to run matching and crawler tasks asynchronously.
  - Compilation guards (`import 'server-only'`) added to matching and worker core services, resolved via path mapping in `tsconfig.json` to dummy local mock files for standalone node execution.
- **Phase 16 Notifications & Re-engagement:**
  - Secure Database Webhook endpoint `/api/webhooks/session-completed` capturing Supabase event triggers.
  - `NotificationService` dynamically filtering matches by semantic threshold (`notification_threshold`) via service-role DB reads.
  - Gmail SMTP transport implemented via `nodemailer`.
  - Notification idempotency state tracking (`notification_sent`, `notification_sent_at`) preventing duplicate email dispatch.
  - Fully React-styled SSR email templates built with `react-dom/server` (`NotificationEmailTemplate.tsx`).

## 3. Deferred Systems & Mocks
- **`QueryRankingService`**: Still mocked, returns priority 0 for all queries.

## 4. Known Technical Debt & Risks
- **Sequential Gemini Scaling Bottleneck (Low Risk):** Gemini explanation calls inside `MatchEngine.ts` are processed sequentially within a `for` loop. Although Vercel's 5-minute timeout is solved (execution is moved to GHA workflows which allow up to 6 hours), sequential scaling still consumes GHA runner minutes. Needs parallelization/batching in the future.
- **CSS Styling:** Bare CSS Modules. Needs a general layout / design pass.
- **TypeScript Types Drift:** `types.ts` is manually maintained and must be carefully synced with the schema.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during DB upserts.
- **Matches Table Bloat:** No 30-day TTL deletion strategy. Will grow unbounded in production.

## 5. Required Credentials & Secrets
- **Vercel Hosting Environment Variables:**
  - `GITHUB_OWNER`: The GitHub username or organization owning the repo.
  - `GITHUB_REPO`: The name of the GitHub repository.
  - `GITHUB_PAT`: Personal Access Token with repository write scopes (used to POST dispatches).
- **GitHub Actions Repository Secrets:**
  - `NEXT_PUBLIC_SUPABASE_URL`: The URL of the Supabase instance.
  - `SUPABASE_SERVICE_ROLE_KEY`: Service role API key to bypass RLS.
  - `GEMINI_API_KEY`: API key for Google Gemini API.
  - `GOOGLE_CSE_API_KEY`: API key for Google Custom Search.
  - `GOOGLE_CSE_ENGINE_ID`: Custom Search Engine ID.
- **New Required Project Secrets (Phase 16):**
  - `SMTP_HOST`: Standard SMTP host (e.g. `smtp.gmail.com`).
  - `SMTP_PORT`: Standard SMTP port (e.g. `465`).
  - `SMTP_USER`: Standard SMTP email user.
  - `SMTP_PASS`: Application specific password for SMTP.
  - `SUPABASE_WEBHOOK_SECRET`: Authorization code verification string for database webhook calls (shared between Next.js and Supabase).

## 6. Immediate Next Phase
**Phase 17: Feedback Learning Loop (Implementation)**

With Phase 17 planning complete and the architecture designed in `PHASE_17_ARCHITECTURE.md`, we will implement the FeedbackProfileBuilder, inject dynamic feedback adjustments into the MatchScorer, and integrate it with the WorkerLifecycle.

See `NEXT_PHASE.md` for implementation details.



