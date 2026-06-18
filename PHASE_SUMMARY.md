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

## 2. Current Architecture
- **Frontend:** Next.js App Router, CSS Modules (NO Tailwind), React Hook Form, Zod.
- **Backend/DB:** Supabase (PostgreSQL) with strict Row Level Security.
- **Execution Model:** Vercel manages UI and state. Asynchronous "Worker" layer executes long-running search scraping and AI prompts independently.
- **Data Flow:** UI `StartSession` -> `SearchWavePlanner` -> `ProviderRouter` -> `GoogleCSEProvider` -> Normalized `SearchResult[]`.

## 3. Current Branch
`phase-8c-provider-execution-refactor`

## 4. Most Recent Commits
```text
4652c4c (HEAD -> phase-8c-provider-execution-refactor) docs: update continuity after execution refactor
5f27f98 refactor: integrate provider registry into execution pipeline
fd0442a (phase-8b-google-cse-provider) docs: update continuity after google cse integration
d1ae596 feat: integrate Google CSE provider and real search execution
e5288f5 (phase-8-provider-integration) docs: update continuity documentation after provider registry
```

## 5. Current Execution Flow
1. **Planning:** `SearchWavePlanner` translates a user's `ResearchPlan` into a budgeted, deduplicated, and categorically diverse `SearchWave`.
2. **Routing:** `ProviderRouter` maps query intents (e.g., `role_based`) to healthy search engines while checking daily API quotas.
3. **Execution:** `ResearchExecutor` dynamically maps the required provider and calls `.search()`.
4. **Fault Tolerance:** If Google CSE throws a 429 quota exception or times out, the executor updates the `ProviderRegistry` circuit breaker and immediately asks the router for a failover provider, rerouting seamlessly.
5. **Telemetry:** Successes, quota hits, and failovers stream live to the Next.js UI via Supabase WebSockets.

## 6. Remaining Roadmap
- **Phase 9:** Content Extraction and Matching (Scraping raw URLs and using LLMs to structure data).
- **Phase 10:** True AI Integration (Replacing deterministic `DomainExpansionService` with real Gemini logic).
- **Phase 11:** GitHub Actions / Cron Job decoupling (Moving `WorkerLifecycle` off the Vercel UI thread).
- **Phase 12:** Polish and UI completion.

## 7. Immediate Next Phase
**Phase 9: Content Extraction and Matching.** 
Taking the URLs outputted by Phase 8, fetching their HTML, parsing with a scraper (e.g., Cheerio), and using an LLM to build structured database payloads.

## 8. Known Technical Debt
- Mock services still active (`DomainExpansionService`, `QueryGenerationService`).
- No string normalizer for `internships.canonical_key` to prevent database collisions.
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
