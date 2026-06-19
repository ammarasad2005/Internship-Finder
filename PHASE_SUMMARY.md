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
- **Phase 13:** Matching Engine Architecture, Implementation & Scalability Audit.
- **Phase 14:** Recommendation UI & Match Feedback Loop (Server Page `/dashboard/sessions/[id]/matches`, Server Actions, interactive components, performance indexes).

## 2. Current Architecture
- **Frontend:** Next.js App Router, CSS Modules (NO Tailwind), React Hook Form, Zod.
- **Backend/DB:** Supabase (PostgreSQL) with strict Row Level Security.
- **Execution Model:** Vercel manages UI and state. Asynchronous "Worker" layer executes long-running search scraping and AI prompts independently.
- **Data Flow:** UI `StartSession` -> `SearchWavePlanner` -> `ProviderRouter` -> `GoogleCSEProvider` -> Normalized `SearchResult[]` -> Extraction -> Canonicalization -> Persistence -> MatchEngine -> Student UI (Matches Page + Feedback Loop).

## 3. Current Branch
`phase-15-planning` (until merged)

## 4. Most Recent Commits
```text
ed1b0c0 (HEAD -> phase-15-planning) docs: update continuity after phase 14 completion
3c6670e feat: complete phase 14 recommendation ui
820922a feat: partial phase 14 recommendation ui implementation
```

## 5. Current Execution Flow
1. **Planning:** `SearchWavePlanner` translates a user's `ResearchPlan` into a budgeted, deduplicated, and categorically diverse `SearchWave`.
2. **Routing:** `ProviderRouter` maps query intents to healthy search engines while checking daily API quotas.
3. **Execution:** `ResearchExecutor` calls the provider and returns raw URLs.
4. **Extraction:** `ExtractionEngine` fetches HTML DOMs, scrapes them deterministically, and validates them into `InternshipCandidate` payloads.
5. **Deduplication:** `DeduplicationEngine` safely collapses identical listings from multiple domains into single `CanonicalInternship` objects utilizing strict tri-factor hashing.
6. **Persistence:** `InternshipPersistenceService` aggressively writes the unified models natively into Supabase via constrained Postgres upserts.
7. **Matching:** `MatchEngine.executeDeltaBatch()` executes at the tail end of the worker loop. It performs an Internship-Centric Delta Batch evaluation inside Node.js memory, generating Semantic score boosts via Gemini for the top 5 matches per user before committing to Supabase.
8. **Feedback:** Student reviews matches at `/dashboard/sessions/[id]/matches` and provides actions (Save/Apply/Reject) that write back to `matches.user_feedback` via Optimistic UI + Server Actions.

## 6. Remaining Roadmap
- **Phase 15:** Background Scheduling & Worker Decoupling (move WorkerLifecycle off Vercel UI thread to cron/actions).
- **Phase 16:** Notifications (alert users when new matches arrive via Supabase Edge Functions).
- **Phase 17:** UI Polish & Glassmorphism.

## 7. Immediate Next Phase
**Phase 15: Background Scheduling & Worker Decoupling**
See: `PHASE_15_ARCHITECTURE.md`

## 8. Known Technical Debt
- **Sequential Gemini Scaling Bottleneck:** Explanation generation will exceed Vercel 5-minute timeouts if active users exceed ~50.
- Unbounded `matches` table growth (needs 30-day TTL job in future).
- PostgreSQL Dead Tuple bloat from `ON CONFLICT DO UPDATE`.
- DB `tags` are currently destructively overwritten during persistence.
- The UI is largely unstyled bare CSS Modules.
- `types.ts` must be kept in manual sync with `initial_schema.sql` (Supabase CLI not yet integrated into workflow).
- No `server-only` import guard on `MatchEngine` / `MatchRepository`.

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
