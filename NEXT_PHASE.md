# Next Phase: Handoff Guide

## 1. Current Branch
`phase-13-matching-engine`

## 2. Next Required Branch
`phase-13a-matching-fixes`

## 3. Last Completed Phase
Phase 13 (Design): Matching Engine Architecture & Scalability Audit — **COMPLETE**
Phase 13 (Code): Matching Engine scaffolded — **AUDIT FAILED, NOT MERGED**

## 4. Current Project Status
Phase 13 implementation was attempted. The Matching Engine module was scaffolded (`MatchScorer`, `MatchExplanationService`, `MatchRepository`, `MatchEngine`, types). A comprehensive audit then revealed **17 TypeScript compilation errors** and **1 missing integration**. The project does NOT currently build cleanly. Phase 13 is considered **incomplete** until these issues are resolved.

## 5. Outstanding Bugs (Must Fix Before Any Other Work)

### Bug 1 — BLOCKER: Missing table types in `src/lib/supabase/types.ts`
The `internships` and `matches` tables are not defined in the Database interface.
The Supabase typed client resolves them as `never`, causing 14 cascade errors in `MatchEngine.ts` and `MatchRepository.ts`.

**Fix:** Manually add `internships` Row/Insert/Update and `matches` Row/Insert/Update definitions to `src/lib/supabase/types.ts`. Reference `supabase/migrations/20260618000000_initial_schema.sql` for authoritative columns.

### Bug 2 — BLOCKER: Gemini SDK API mismatch in `gemini.service.ts`
Line 49: `response.text()` calls `text` as a function. In the current SDK it is a getter property.

**Fix:** Change `response.text()` to `response.text` on line 49 of `src/features/brain/services/gemini.service.ts`.

### Bug 3 — INTEGRATION MISSING: MatchEngine not called in WorkerLifecycle
`WorkerLifecycle.runSession()` never calls `MatchEngine.executeDeltaBatch()`. The matching step does not execute.

**Fix:** After `executor.executeWave(wave)` in `WorkerLifecycle.ts`, add:
```typescript
const matchEngine = new MatchEngine();
await matchEngine.executeDeltaBatch(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
```

## 6. Technical Debt
- The UI relies on bare CSS Modules and needs a full visual pass.
- The `tags` array overwrite in the Persistence layer is highly destructive to manual updates and should be handled dynamically in the future.
- The `matches` table will grow infinitely. A future scaling sprint needs to add a 30-day TTL.
- `types.ts` must be manually kept in sync with the schema — Supabase CLI auto-generation is not yet part of the workflow.
- No `server-only` import guard on `MatchEngine` or `MatchRepository`.

## 7. Immediate Next Objective
**Phase 13a: Fix Matching Engine Audit Failures**

## 8. Exact Next Prompt to Run
```
Fix all Phase 13 audit failures on branch phase-13a-matching-fixes.

Steps:
1. Add internships and matches table definitions to src/lib/supabase/types.ts.
   Reference supabase/migrations/20260618000000_initial_schema.sql for the authoritative column list.
2. Fix src/features/brain/services/gemini.service.ts line 49:
   Change response.text() to response.text.
3. Wire MatchEngine into WorkerLifecycle.ts:
   After executor.executeWave(wave), instantiate MatchEngine and call executeDeltaBatch()
   using the session started_at timestamp as the lastRunTime.
4. Run npx tsc --noEmit and verify zero errors.
5. Commit with message: fix: resolve phase 13 audit failures and wire MatchEngine into lifecycle
```

## 9. Recommended Model
Claude Sonnet (Thinking) or Gemini 2.5 Pro

## 10. Recommended Antigravity Mode
Standard Auto-Execution
