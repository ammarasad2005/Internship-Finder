# Current State: Internship Finder

**Last Updated:** Phase 15 Background Scheduling & Worker Decoupling (PASSED)

## 1. Codebase Status
- **Current Git Branch:** `phase-15-planning` (until merged)
- **Application Status:** Phase 15 Background Scheduling & Worker Decoupling has been fully implemented, integrated, and audited. The background crawler and matching engine run offline inside GitHub Actions, triggered via HTTP dispatches from the Next.js API layer. The frontend bundle is fully decoupled from server-side dependencies. TypeScript compilation (`npx tsc --noEmit`) passes with 0 errors.

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

## 6. Immediate Next Phase
**Phase 16: Notifications**

With the worker decoupled onto the server/runner, we can implement asynchronous email/Slack alerts to notify users when new match recommendations have arrived without client interaction.

See `NEXT_PHASE.md` for planning.



