# Current State: Internship Finder

**Last Updated:** Hotfix Application URL Completion

## 1. Codebase Status
- **Current Git Branch:** `hotfix-persistence-application-url`
- **Application Status:** The infrastructure layer is 100% complete. The worker pipeline now successfully executes raw queries, deterministically extracts DOM payloads, securely canonicalizes candidates, and successfully persists unified records (securely including `application_url`s) to the Supabase database.

## 2. Implemented Systems
- Next.js 15 App Router Architecture with `src/features/` module separation.
- Supabase SSR Auth (Login/Signup).
- Supabase PostgreSQL backend fully modeled (11 tables + RLS + Triggers + Enums).
- Supabase Realtime UI integrations (WebSockets).
- Research Brain Pipeline (Domain Expansion -> Query Generation -> Query Ranking -> Plan Building).
- Worker Node Foundation (Lifecycle -> Executor -> Retry Logic -> Cost Tracking).

## 3. Deferred Systems & Mocks
The following systems currently use mocked stubs and require actual integration in future phases:
- **`DomainExpansionService`**: Currently uses dictionary strings. Needs to integrate Gemini structured JSON output.
- **`QueryGenerationService` & `QueryRankingService`**: Needs LLM capabilities or Embedding similarity scoring.
- **GitHub Actions Runner**: `MockWorker` is currently invoked synchronously via the UI for testing. This needs to be decoupled into a CRON or webhook.

## 4. Known Technical Debt & Risks
- **`canonical_key` Collision:** We have a UNIQUE constraint on `internships.canonical_key` but no string normalization service yet to format "company:role:location" reliably.
- **CSS Styling:** The project utilizes very bare CSS Modules. Polishing the aesthetic (Glassmorphism, animations) as defined in `.rules` is heavily pending.
- **TypeScript Generation:** `types.ts` was manually crafted for existing features. If the schema updates, the developer must either run the Supabase CLI generator or manually sync the interfaces.

## 5. Next Planned Phase
**Phase 12: True AI Integration**
The worker pipeline is feature-complete but relies entirely on deterministic heuristics and mocked AI stubs. The next phase involves integrating Google Gemini to act as a fallback extractor for low-confidence candidates, as well as replacing the mocked `DomainExpansionService` and `QueryGenerationService` in the Brain with real LLM prompts.
