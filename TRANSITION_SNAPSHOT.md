# Transition Snapshot

**Date:** June 20, 2026
**Current Active Branch:** `phase-17-feedback-learning`
**Next Required Branch:** `phase-18-ui-polish`

This is a point-in-time architectural snapshot created explicitly to preserve context during an AI account transition.

## 1. Last Completed Work
- **Last Completed Phase:** Phase 17 (Feedback Learning Loop).
- **Phase 17 Status:** COMPLETE. `PHASE_17_AUDIT.md` Authored and Passed.
- **Last Committed Purpose:** Implemented dynamic match scoring and query generation that automatically learns from user `saved`/`rejected` actions to boost or penalize recommended roles deterministically.

## 2. Current Repository Health
- **Build Status:** ✅ CLEAN — `npx tsc --noEmit` exits with code 0.
- **TypeScript Errors:** 0
- **Integrations:** Next.js UI is fully decoupled from crawler execution. Clicking "Start Discovery" calls the API trigger endpoint, which fires a GitHub repository_dispatch event, executing the worker asynchronously. Supabase Realtime reflects session status updates back to the client.

## 3. Outstanding Issues

### Open Bugs (BLOCKERS)
*None.*

### Deferred Technical Debt
- **Duplicate Feedback Reads:** `FeedbackProfile` is fetched twice for the triggering user.
- **N+1 Feedback Aggregation:** Pulling historical feedback sequentially for active users causes N+1 queries. Needs `IN` clause refactoring before scaling to 5,000+ users.
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
- **Phase 18:** UI/UX Polish & Glassmorphism Design System.

---

## IF DEVELOPMENT RESUMES TOMORROW

**Read this carefully.** The project is in a fully clean state. 

**Step 1:** Read `SESSION_HANDOFF.md` for precise state context.

**Step 2:** Merge `phase-17-feedback-learning` into the main branch.

**Step 3:** Checkout or create branch `phase-18-ui-polish`.

**Step 4:** Begin an aesthetic review and execute a full Glassmorphism redesign across the entire Next.js UI using native CSS Modules.


