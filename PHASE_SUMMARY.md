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
- **Phase 13 (Design):** Matching Engine Architecture & Scalability Audit.

## 2. Current Architecture
- **Frontend:** Next.js App Router, CSS Modules (NO Tailwind), React Hook Form, Zod.
- **Backend/DB:** Supabase (PostgreSQL) with strict Row Level Security.
- **Execution Model:** Vercel manages UI and state. Asynchronous "Worker" layer executes long-running search scraping and AI prompts independently.
- **Data Flow:** UI `StartSession` -> `SearchWavePlanner` -> `ProviderRouter` -> `GoogleCSEProvider` -> Normalized `SearchResult[]`.

## 3. Current Branch
`phase-13-matching-engine`

## 4. Most Recent Commits
```text
(HEAD -> phase-11-persistence-pipeline) docs: update continuity after persistence pipeline
feat: implement internship persistence pipeline
docs: update continuity after canonicalization hardening
refactor: harden canonicalization collision safeguards
docs: update continuity after canonicalization engine
feat: implement canonicalization and deduplication engine
```

## 5. Current Execution Flow
1. **Planning:** `SearchWavePlanner` translates a user's `ResearchPlan` into a budgeted, deduplicated, and categorically diverse `SearchWave`.
2. **Routing:** `ProviderRouter` maps query intents to healthy search engines while checking daily API quotas.
3. **Execution:** `ResearchExecutor` calls the provider and returns raw URLs.
4. **Extraction:** `ExtractionEngine` fetches HTML DOMs, scrapes them deterministically, and validates them into `InternshipCandidate` payloads.
5. **Deduplication:** `DeduplicationEngine` safely collapses identical listings from multiple domains into single `CanonicalInternship` objects utilizing strict tri-factor hashing.
6. **Persistence:** `InternshipPersistenceService` aggressively writes the unified models natively into Supabase via constrained Postgres upserts.

## 6. Remaining Roadmap
- **Phase 13 (Code):** Matching Engine Implementation (In-memory Internship-Centric Delta Batch).
- **Phase 14:** GitHub Actions / Cron Job decoupling (Moving `WorkerLifecycle` off the Vercel UI thread).
- **Phase 15:** Polish and UI completion.

## 7. Immediate Next Phase
**Phase 13: Matching Engine Implementation.** 
Translate the `PHASE_13_ARCHITECTURE.md` into TypeScript. Build the `MatchEngine`, index the database, and wire up Gemini to generate semantic explanations for top-scoring matches.

## 8. Known Technical Debt
- Unbounded `matches` table growth (needs 30-day TTL job in future).
- PostgreSQL Dead Tuple bloat from `ON CONFLICT DO UPDATE`.
- DB `tags` are currently destructively overwritten during persistence.
- The UI is largely unstyled bare CSS Modules.

## 9. Important Architectural Decisions
- **No TailwindCSS.** Custom aesthetic styling using CSS Modules only.
- **Free Infrastructure Constraint:** We selected Google CSE as the primary API because it provides 100 free queries/day perpetually, perfectly matching the zero-budget 50-user constraint via heavily cached global database lookups.
- **Circuit Breakers Over Infinite Retries:** The system drops fatal HTTP 429/403 errors and actively routes to a failover provider rather than hanging the worker in pointless exponential backoffs.

## 10. Files a New AI Must Read First
1. `.rules`
2. `project-context.md`
3. `agents.md`
4. `database-design.md`
5. `PHASE_SUMMARY.md` (This file)
