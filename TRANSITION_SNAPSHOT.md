# Transition Snapshot

**Date:** June 19, 2026
**Current Active Branch:** `phase-13a-matching-fixes`
**Next Required Branch:** `phase-14-worker-decoupling`

This is a point-in-time architectural snapshot created explicitly to preserve context during an AI account transition.

## 1. Last Completed Work
- **Last Completed Phase:** Phase 13 (Matching Engine Architecture, Implementation, & Audit Fixes).
- **Phase 13 Code Status:** COMPLETE. Audit Passed.
- **Last Committed Purpose:** Documentation continuity refresh after successful completion of Phase 13.

## 2. Current Repository Health
- **Build Status:** ✅ CLEAN — `npx tsc --noEmit` exits with code 0.
- **TypeScript Errors:** 0
- **Integrations:** Supabase local development synchronized with `initial_schema.sql` and `20260619000000_idx_internships_discovered_at.sql`. MatchEngine successfully integrated into `WorkerLifecycle.runSession()`. Gemini SDK bugs fixed.

## 3. Outstanding Issues

### Open Bugs (BLOCKERS)
*None.*

### Deferred Technical Debt
- **Sequential Gemini Scaling Bottleneck:** Generating match explanations sequentially will breach Vercel's 5-minute timeout if active users exceed ~50.
- **matches TTL Cleanup:** The `matches` table has no 30-day Time-To-Live (TTL) deletion job.
- **Dead-Tuple Bloat:** No handling for PostgreSQL bloat via anti-joins.
- **CSS Modules:** UI relies on unstyled bare CSS Modules.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during persistence upserts.
- **Server-Only Guards:** No `server-only` import guard on `MatchEngine` or `MatchRepository`.

## 4. Risks & Blockers
- **Current Blockers:** None.
- **Current Risks:** The system is vulnerable to Vercel timeouts under high user concurrency due to sequential Gemini explanation generation within `MatchEngine`.

## 5. Architecture State

### What is Implemented & Production-Ready
- Supabase Authentication & RLS.
- Database Tables & Constraints.
- Supabase Migration for `discovered_at` B-Tree index.
- The Worker Execution Loop (Heartbeats, backoff, failovers).
- The Discovery Pipeline (Budgeting, search API routing).
- The Extraction Engine (DOM fetching, Cheerio parsing).
- The Canonicalization Engine (Deterministic normalization, hashing, deduplication).
- The Persistence Pipeline (Postgres `ON CONFLICT` Upserts).
- AI Brain Integration (Gemini execution, Zod schema validation, Supabase `ai_cache`).
- **Matching Engine:** Delta batching, Top-5 sorting, memory-bounded pairing, Gemini explanations.

### What is Scaffolded But Broken
*None.*

### What is Mocked
- `QueryRankingService` (Currently returns priority score 0 for everything).

### What Still Requires Implementation
- **Phase 14:** Decoupling the worker off Vercel onto GitHub Actions / Cron.
- **Phase 15:** Global UI styling and aesthetics.

---

## IF DEVELOPMENT RESUMES TOMORROW

**Read this carefully.** The project is in a fully clean state. 

**Step 1:** Read `SESSION_HANDOFF.md` for precise state context.

**Step 2:** Merge `phase-13a-matching-fixes` into the main branch.

**Step 3:** Checkout or create branch `phase-14-worker-decoupling`.

**Step 4:** Begin implementing the separation of `WorkerLifecycle` from the Vercel execution environment.
