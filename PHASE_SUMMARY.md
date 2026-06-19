# Phase Summary: Internship Finder

This document is the ultimate continuity guide designed to perfectly restore project state across account transitions, IDE restarts, or quota exhaustion.

## 1. Completed Phases
- **Phase 1:** Project Foundation (Next.js, Supabase, basic architecture).
- **Phase 2:** Adaptive User Profiling (Onboarding flow).
- **Phase 3:** Supabase Persistence Layer (11-table SQL schema, RLS, DB Services).
- **Phase 4:** Research Orchestration Layer (Session lifecycle, UI tracking via WebSockets).
- **Phase 5:** Research Brain Architecture (AI query generation, Domain Expansion engines).
- **Phase 6:** Worker Foundation (Execution loops, heartbeats, exponential backoff).
- **Phase 7:** Search Discovery Strategy (Provider Registry, Budget Planner, Coverage Analyzer).
- **Phase 8:** Provider Integration (Google CSE physical integration, Quota limits, Active Failover).
- **Phase 9:** Content Extraction Engine (DOM Parsing, Candidate Validation).
- **Phase 10:** Canonicalization & Deduplication (String normalizers, tri-factor hashing).
- **Phase 11:** Persistence Pipeline (DB Upserts, Database Mapping, Provenance Tracking).
- **Phase 12:** AI Research Brain Integration (Gemini, Zod strict schema parsing, caching).
- **Hotfix:** Async Integration & TypeScript Fixes (Resolving IDE compilation errors).
- **Phase 13 (Design):** Matching Engine Architecture & Scalability Audit.
- **Phase 13 (Code — INCOMPLETE):** Matching Engine scaffolded. Audit FAILED with 17 TypeScript errors.

## 2. Current Architecture
- **Frontend:** Next.js App Router, CSS Modules (NO Tailwind), React Hook Form, Zod.
- **Backend/DB:** Supabase (PostgreSQL) with strict Row Level Security.
- **Execution Model:** Vercel manages UI and state. Asynchronous "Worker" layer executes long-running search scraping and AI prompts independently.
- **Data Flow:** UI `StartSession` -> `SearchWavePlanner` -> `ProviderRouter` -> `GoogleCSEProvider` -> Normalized `SearchResult[]`.

## 3. Current Branch
`phase-13-matching-engine` (next branch: `phase-13a-matching-fixes`)

## 4. Most Recent Commits
```text
6d6cf46 (HEAD -> phase-13a-matching-fixes, phase-13-matching-engine) docs: prepare project continuity and account transition handoff
ade8d26 docs: final handoff before account transition
53e2edd docs: update continuity after phase 13 architecture review
b02e153 docs: refine phase 13 architecture after scalability audit
d8fbd99 (phase-12-ai-research-brain) docs: update continuity after phase 12
```

## 5. Current Execution Flow
1. **Planning:** `SearchWavePlanner` translates a user's `ResearchPlan` into a budgeted, deduplicated, and categorically diverse `SearchWave`.
2. **Routing:** `ProviderRouter` maps query intents to healthy search engines while checking daily API quotas.
3. **Execution:** `ResearchExecutor` calls the provider and returns raw URLs.
4. **Extraction:** `ExtractionEngine` fetches HTML DOMs, scrapes them deterministically, and validates them into `InternshipCandidate` payloads.
5. **Deduplication:** `DeduplicationEngine` safely collapses identical listings from multiple domains into single `CanonicalInternship` objects utilizing strict tri-factor hashing.
6. **Persistence:** `InternshipPersistenceService` aggressively writes the unified models natively into Supabase via constrained Postgres upserts.
7. **Matching (NOT YET WIRED):** `MatchEngine.executeDeltaBatch()` should be called here but is not yet integrated.

## 6. Remaining Roadmap
- **Phase 13a:** Fix TypeScript errors, wire MatchEngine into WorkerLifecycle, achieve clean build.
- **Phase 14:** GitHub Actions / Cron Job decoupling (Moving `WorkerLifecycle` off the Vercel UI thread).
- **Phase 15:** Polish and UI completion.

## 7. Immediate Next Phase
**Phase 13a: Fix Matching Engine Audit Failures.**

### Required Actions:
1. Add `internships` and `matches` table types to `src/lib/supabase/types.ts`.
2. Fix `response.text()` → `response.text` in `gemini.service.ts:49`.
3. Wire `MatchEngine.executeDeltaBatch()` into `WorkerLifecycle.ts` step 6.
4. Run `npx tsc --noEmit` and verify zero errors.

## 8. Known Technical Debt
- Unbounded `matches` table growth (needs 30-day TTL job in future).
- PostgreSQL Dead Tuple bloat from `ON CONFLICT DO UPDATE`.
- DB `tags` are currently destructively overwritten during persistence.
- The UI is largely unstyled bare CSS Modules.
- `types.ts` must be kept in manual sync with `initial_schema.sql` (Supabase CLI not yet integrated into workflow).
- No `server-only` guard on `MatchEngine` / `MatchRepository`.

## 9. Important Architectural Decisions
- **No TailwindCSS.** Custom aesthetic styling using CSS Modules only.
- **Free Infrastructure Constraint:** We selected Google CSE as the primary API because it provides 100 free queries/day perpetually, perfectly matching the zero-budget 50-user constraint via heavily cached global database lookups.
- **Circuit Breakers Over Infinite Retries:** The system drops fatal HTTP 429/403 errors and actively routes to a failover provider rather than hanging the worker in pointless exponential backoffs.
- **Internship-Centric Delta Batch:** The MatchEngine executes exactly 2 global SQL queries, then performs all match evaluation in local Node.js memory to avoid N+1 connection exhaustion.

## 10. Files a New AI Must Read First
1. `.rules`
2. `project-context.md`
3. `agents.md`
4. `database-design.md`
5. `PHASE_SUMMARY.md` (This file)
