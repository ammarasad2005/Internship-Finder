# Current State: Internship Finder

**Last Updated:** Phase 18 Architectural Planning (PASSED)

## 1. Codebase Status
- **Current Git Branch:** `phase-18-planning` (until merged)
- **Application Status:** Phase 17 Feedback Learning Loop is fully implemented. Phase 18 Planning (Production Bootstrap & First Real Run) is complete. The system architecture for a live production deployment and end-to-end testing protocol is designed and documented in `PHASE_18_ARCHITECTURE.md`. TypeScript compilation passes with 0 errors.

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
**Phase 18: Production Bootstrap & First Real Run**

Before investing heavily in UI Polish, we must validate the 17-phase architecture in a real production environment. This includes configuring Vercel, Supabase, and GitHub Actions, and executing the worker pipeline against live internet sources to verify Google CSE parsing, Gemini API quotas, and SMTP webhooks.

See `NEXT_PHASE.md` for implementation details.

## 7. Executive Summary of System Maturity (Post-Phase 17)
The Internship Finder has transitioned from a static search application into a fully personalized, closed-loop recommendation platform. 
- The background worker executes async discovery at $0 operational cost via GitHub Actions.
- The Matching Engine seamlessly blends an 85-point deterministic heuristic with a 15-point semantic Gemini boost.
- Phase 17 closed the feedback loop: explicit user actions (saves/rejects) now automatically adjust their future heuristic scores and personalize Gemini's upstream search queries.
- The system is incredibly stable for the target 50-user alpha. However, as the userbase scales to 5,000+, deferred technical debt (such as sequential N+1 feedback aggregation queries and sequential LLM generations) will need to be refactored into batch operations.



