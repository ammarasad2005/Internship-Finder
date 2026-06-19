# Current State: Internship Finder

**Last Updated:** Phase 13 Architecture & Scalability Audit

## 1. Codebase Status
- **Current Git Branch:** `phase-13-matching-engine`
- **Application Status:** The infrastructure layer is 100% complete. The "Brain" integrates Google Gemini for domain expansion and query generation. The Phase 13 Matching Engine architecture and database scalability audit are complete, dictating an in-memory Internship-Centric Delta Batch to safely avoid N+1 networking limits.

## 2. Implemented Systems
- Next.js 15 App Router Architecture with `src/features/` module separation.
- Supabase SSR Auth (Login/Signup).
- Supabase PostgreSQL backend fully modeled (11 tables + RLS + Triggers + Enums).
- Supabase Realtime UI integrations (WebSockets).
- Research Brain Pipeline (Domain Expansion -> Query Generation -> Query Ranking -> Plan Building).
- Worker Node Foundation (Lifecycle -> Executor -> Retry Logic -> Cost Tracking).

## 3. Deferred Systems & Mocks
The following systems currently use mocked stubs and require actual integration in future phases:
- **`QueryRankingService`**: Needs LLM capabilities or Embedding similarity scoring (currently returns default priority 0).
- **GitHub Actions Runner**: `MockWorker` is currently invoked synchronously via the UI for testing. This needs to be decoupled into a CRON or webhook.

## 4. Known Technical Debt & Risks
- **CSS Styling:** The project utilizes very bare CSS Modules. Polishing the aesthetic (Glassmorphism, animations) as defined in `.rules` is heavily pending.
- **TypeScript Generation:** `types.ts` was manually crafted for existing features. If the schema updates, the developer must either run the Supabase CLI generator or manually sync the interfaces.
- **Tags Overwrite:** `internships.tags` array is destructively overwritten during DB upserts instead of cleanly merged.
- **Matches Table Bloat (Deferred):** An unbounded `matches` table will grow exponentially. Implementation of a 30-day TTL deletion strategy is deferred to a future scaling sprint.

## 5. Next Planned Phase
**Phase 13: Matching Engine (Implementation)**
The architecture for Phase 13 is complete. The next step is writing the code to implement the Internship-Centric Delta Batch, indexing `discovered_at`, heuristic scoring, and the top-5 Gemini explanation generator.
