# Current State: Internship Finder

**Last Updated:** Phase 13 Implementation Attempt + Audit (FAILED)

## 1. Codebase Status
- **Current Git Branch:** `phase-13-matching-engine` (fixes to be done on `phase-13a-matching-fixes`)
- **Application Status:** Phase 13 Matching Engine code has been **written but is NOT functional**. A comprehensive audit was performed and found **17 TypeScript compilation errors** blocking the build. The TypeScript compiler (`npx tsc --noEmit`) exits with code 2. The project does NOT currently compile cleanly.

## 2. Implemented Systems (Production-Ready)
- Next.js 15 App Router Architecture with `src/features/` module separation.
- Supabase SSR Auth (Login/Signup).
- Supabase PostgreSQL backend fully modeled (11 tables + RLS + Triggers + Enums).
- Supabase Realtime UI integrations (WebSockets).
- Research Brain Pipeline (Domain Expansion -> Query Generation -> Query Ranking -> Plan Building).
- Worker Node Foundation (Lifecycle -> Executor -> Retry Logic -> Cost Tracking).
- Supabase Migration: `discovered_at` B-Tree index added.
- Matching Engine module scaffolded: `MatchScorer.ts`, `MatchExplanationService.ts`, `MatchRepository.ts`, `MatchEngine.ts`, `types/index.ts`.

## 3. Phase 13 Audit Findings (All Outstanding)

### TypeScript Errors (BLOCKER)
1. **`src/lib/supabase/types.ts` is missing the `internships` table definition.** The Supabase client infers this table as `never`, causing 13 cascade errors in `MatchEngine.ts`.
2. **`src/lib/supabase/types.ts` is missing the `matches` table definition.** The Supabase client infers this table as `never`, causing the `MatchRepository.ts` upsert to fail type-checking.
3. **`src/features/brain/services/gemini.service.ts:49`** — `response.text()` is called as a function, but in the current `@google/genai` SDK version, `text` is a getter property. Must be changed to `response.text` (no parentheses).

### Worker Integration Gap (BLOCKER)
- `MatchEngine` is not yet invoked from `WorkerLifecycle.ts`. Line 48 currently logs a fake `matching_completed` event with no actual matching occurring.

### Security (Weakness)
- No `server-only` import guard protecting `MatchEngine` and `MatchRepository` from accidental frontend bundle inclusion.

## 4. Deferred Systems & Mocks
- **`QueryRankingService`**: Still mocked, returns priority 0 for all queries.
- **GitHub Actions Runner**: Worker is still synchronously invoked via UI for testing.

## 5. Known Technical Debt & Risks
- **CSS Styling:** Bare CSS Modules. Glassmorphism/animation polish heavily pending.
- **TypeScript Types Drift:** `types.ts` was manually crafted and has fallen out-of-sync with the schema. After every DB schema change, it must be manually updated or regenerated via the Supabase CLI.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during DB upserts.
- **Matches Table Bloat (Deferred):** No 30-day TTL deletion strategy. Will grow unbounded in production.

## 6. Immediate Next Phase
**Phase 13a: Fix Matching Engine Audit Failures**
Branch: `phase-13a-matching-fixes`
1. Add `internships` and `matches` table definitions to `src/lib/supabase/types.ts`.
2. Fix `gemini.service.ts:49` — change `response.text()` to `response.text`.
3. Hook `MatchEngine.executeDeltaBatch()` into `WorkerLifecycle.ts` at step 6 (after persistence).
4. Verify `npx tsc --noEmit` returns zero errors.
