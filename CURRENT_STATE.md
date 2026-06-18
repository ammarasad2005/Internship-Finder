# Current State: Internship Finder

**Last Updated:** Phase 12 Completion

## 1. Codebase Status
- **Current Git Branch:** `phase-12-ai-research-brain`
- **Application Status:** The infrastructure layer is 100% complete. The worker pipeline now successfully executes raw queries, deterministically extracts DOM payloads, securely canonicalizes candidates, and successfully persists unified records to the Supabase database. The "Brain" has now successfully integrated Google Gemini for domain expansion and query generation, backed by a persistent global cache.

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

## 5. Next Planned Phase
**Phase 13: GitHub Actions / Cron Job Decoupling**
The worker pipeline is currently tied to Next.js UI execution. The next critical architectural step is fully decoupling the `WorkerLifecycle` from the UI thread and deploying it as an autonomous background chron job (e.g., via GitHub Actions) to circumvent Vercel free-tier timeouts.
