# Transition Snapshot

**Date:** June 20, 2026
**Current Active Branch:** `phase-17-planning`
**Next Required Branch:** `phase-17-feedback-loop`

This is a point-in-time architectural snapshot created explicitly to preserve context during an AI account transition.

## 1. Last Completed Work
- **Last Completed Phase:** Phase 16 (Notifications) & Phase 17 Planning.
- **Phase 17 Planning Status:** COMPLETE. `PHASE_17_ARCHITECTURE.md` Authored.
- **Last Committed Purpose:** Evaluated remaining architectural priorities and determined that a "Feedback Learning Loop" represents the highest leverage user value for the next phase. Designed the system to dynamically inject historical user feedback into match scoring and query generation.

## 2. Current Repository Health
- **Build Status:** ✅ CLEAN — `npx tsc --noEmit` exits with code 0.
- **TypeScript Errors:** 0
- **Integrations:** Next.js UI is fully decoupled from crawler execution. Clicking "Start Discovery" calls the API trigger endpoint, which fires a GitHub repository_dispatch event, executing the worker asynchronously. Supabase Realtime reflects session status updates back to the client.

## 3. Outstanding Issues

### Open Bugs (BLOCKERS)
*None.*

### Deferred Technical Debt
- **Sequential Gemini Scaling Bottleneck:** Generating match explanations sequentially still consumes GHA runner minutes. Needs future parallelization.
- **matches TTL Cleanup:** The `matches` table has no 30-day Time-To-Live (TTL) deletion job.
- **CSS Modules:** UI styling is base layout CSS Modules and needs polish.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during persistence upserts.
- **Types Drift:** `types.ts` is manually maintained and must be carefully synced with the schema.

## 4. Risks & Blockers
- **Current Blockers:** None.
- **Current Risks:** API/Dispatch dependency on GitHub API availability. If GitHub API is down, the dispatch trigger fails (handled gracefully via HTTP 500 response and transaction rollback status).

## 5. Architecture State

### What is Implemented & Production-Ready
- Next.js 15 App Router & SSR Authentication.
- Supabase PostgreSQL schema with RLS active on all tables.
- Background worker execution loop running in GitHub Actions triggered via API dispatch.
- Standalone runner script `src/scripts/run-worker.ts` executed via `tsx` with server-only mock path overrides.
- Client UI bundle completely decoupled from server-side dependencies.
- Matching Engine and normalizers/crawlers fully migrated to GHA runner.
- Matches Page recommendation cards and action logging (Save, Apply, Reject).

### What is Scaffolded But Broken
*None.*

### What is Mocked
- `QueryRankingService` (Currently returns priority score 0 for everything).

### What Still Requires Implementation
- **Phase 17:** Feedback Learning Loop (dynamically adjust scores based on user feedback).

---

## IF DEVELOPMENT RESUMES TOMORROW

**Read this carefully.** The project is in a fully clean state. 

**Step 1:** Read `SESSION_HANDOFF.md` for precise state context.

**Step 2:** Merge `phase-17-planning` into the main branch.

**Step 3:** Checkout or create branch `phase-17-feedback-loop`.

**Step 4:** Begin implementing `FeedbackProfileBuilder` and integrating it into `MatchScorer` and `QueryGenerationService` as outlined in `PHASE_17_ARCHITECTURE.md`.


