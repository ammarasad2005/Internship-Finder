# Transition Snapshot

**Date:** June 19, 2026
**Current Active Branch:** `phase-13-matching-engine`
**Next Required Branch:** `phase-13a-matching-fixes`

This is a point-in-time architectural snapshot created explicitly to preserve context during an AI account transition.

## 1. Last Completed Work
- **Last Completed Phase:** Phase 12 (AI Research Brain Integration) & Phase 13 Architecture Design & Scalability Audit.
- **Phase 13 Code Status:** Scaffolded — **AUDIT FAILED. NOT MERGED.**
- **Last Committed Purpose:** Documentation continuity refresh after Phase 13 implementation attempt and audit.

## 2. Current Repository Health
- **Build Status:** ❌ BROKEN — `npx tsc --noEmit` exits with code 2.
- **TypeScript Errors:** 17 errors in 3 files.
- **Error Files:**
  - `src/lib/supabase/types.ts` — missing `internships` and `matches` table definitions.
  - `src/features/matching/services/MatchEngine.ts` — 13 cascade errors from `never` type resolution.
  - `src/features/matching/services/MatchRepository.ts` — 1 cascade error from `never` type resolution.
  - `src/features/brain/services/gemini.service.ts` — 3 errors from `.text()` called as function instead of property getter.
- **Integrations:** Supabase local development synchronized with `initial_schema.sql`.

## 3. Outstanding Issues

### Open Bugs (BLOCKERS — Must Fix on phase-13a-matching-fixes)
1. **Missing DB types** — `src/lib/supabase/types.ts` does not define the `internships` or `matches` tables. Add both using `initial_schema.sql` as the source of truth.
2. **Gemini SDK incompatibility** — `gemini.service.ts:49` uses `response.text()` as a function call. In the current `@google/genai` SDK, `text` is a getter. Change to `response.text`.
3. **Missing WorkerLifecycle integration** — `MatchEngine.executeDeltaBatch()` is never called in `WorkerLifecycle.runSession()`. Matching never executes.

### Deferred Technical Debt
- `matches` table has no 30-day Time-To-Live (TTL) deletion job.
- No handling for dead-tuple PostgreSQL bloat via anti-joins.
- UI relies on unstyled CSS Modules.
- `internships.tags` array is destructively overwritten during persistence upserts.
- No `server-only` import guard on `MatchEngine` or `MatchRepository`.

## 4. Risks & Blockers
- **Current Blockers:** TypeScript build is broken. Cannot merge or deploy.
- **Current Risks:** If Phase 13a is not completed, the matching pipeline will never execute in production.

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

### What is Scaffolded But Broken
- `src/features/matching/` — All files exist but TypeScript compiler rejects them due to missing DB type definitions.

### What is Mocked
- `QueryRankingService` (Currently returns priority score 0 for everything).

### What Still Requires Implementation
- **Phase 13a:** Fix TypeScript errors, wire MatchEngine into WorkerLifecycle, achieve clean build.
- **Phase 14:** Decoupling the worker off Vercel onto GitHub Actions.
- **Phase 15:** Global UI styling and aesthetics.

---

## IF DEVELOPMENT RESUMES TOMORROW

**Read this carefully.** The project is in a broken build state. Do NOT add new features. Do NOT modify the architecture. Your first and only objective is to fix the existing build.

**Step 1:** Read `SESSION_HANDOFF.md` for precise bug fix instructions.

**Step 2:** Checkout or create branch `phase-13a-matching-fixes`.

**Step 3:** Apply exactly 3 targeted fixes:
1. Add `internships` and `matches` table type blocks to `src/lib/supabase/types.ts` using `supabase/migrations/20260618000000_initial_schema.sql` as the source.
2. Change `response.text()` to `response.text` in `src/features/brain/services/gemini.service.ts` line 49.
3. Call `MatchEngine.executeDeltaBatch()` from within `WorkerLifecycle.runSession()` after the executor wave completes.

**Step 4:** Run `npx tsc --noEmit` and verify zero errors before doing anything else.

**Step 5:** Once clean, commit, then re-run the Phase 13 audit.
