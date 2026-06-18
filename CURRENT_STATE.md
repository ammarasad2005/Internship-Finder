# Current State: Internship Finder

**Last Updated:** Phase 8B Completion

## 1. Codebase Status
- **Current Git Branch:** `phase-8b-google-cse-provider`
- **Application Status:** The infrastructure layer is 100% complete. The Discovery layer efficiently plans and budgets search waves, and the Provider layer executes real queries via Google Custom Search, logging raw payloads locally for debugging.

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
**Phase 9: Content Extraction and Matching**
The system now retrieves raw Google search links representing internships. The next phase requires fetching the raw HTML of those URLs (e.g., via Cheerio/JSDOM) and utilizing a Gemini LLM prompt to parse the unstructured text into a structured database `internships` payload, and finally scoring it against the user's profile.
