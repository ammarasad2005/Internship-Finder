# Worklog: Internship Finder

This document maintains a chronological history of the project's development, tracking major phases, architectural decisions, and pivots.

## Phase 1: Project Foundation
- **Goal:** Establish the underlying technology stack and documentation rules.
- **Actions:**
  - Initialized Next.js App Router project with TypeScript.
  - Drafted core architectural documents: `project-context.md`, `project-roadmap.md`, `agents.md`, `.rules`.
  - Configured Supabase SSR client scaffolding.
  - Implemented the bare-bones UI shell and placeholder routing (`/auth`, `/dashboard`, `/onboarding`).
- **Decisions:** Strictly prohibited Tailwind CSS in favor of CSS Modules to enforce custom aesthetics. Separated the execution model into Vercel (UI/State) and GitHub Actions (Asynchronous Worker).

## Phase 2: Adaptive User Profiling
- **Goal:** Build the onboarding experience.
- **Actions:**
  - Implemented the `OnboardingFlow` state machine.
  - Created mock UI components for Resume Upload, LinkedIn parsing, and Conversational QA.
  - Built a deterministic `confidenceScore` algorithm to govern if the user can proceed to the dashboard.
- **Decisions:** Profile gathering must be flexible. Defer AI extraction integration (Gemini) until infrastructure is solid.

## Phase 3: Supabase Persistence Layer
- **Goal:** Map the application state to a permanent relational database.
- **Actions:**
  - Finalized `database-design.md`.
  - Wrote a massive `initial_schema.sql` migration for 11 tables (`profiles`, `search_sessions`, `internships`, `matches`, etc.).
  - Implemented strict Row Level Security (RLS).
  - Wrote Typescript type definitions (`types.ts`) and the `ProfileService`.
  - Upgraded Phase 1 & 2 UI mock logic to truly persist to the local Supabase instance.
- **Decisions:** Used a `research_usage_logs` time-series table instead of a static "credits" field to support complex future quota logic. Added an `ai_cache` table to prevent duplicate Gemini billing.

## Phase 4: Research Orchestration Layer
- **Goal:** Connect the UI to the background worker paradigm.
- **Actions:**
  - Created `SessionService` to manage `search_sessions` lifecycle.
  - Updated the Dashboard to list sessions and initiate new discovery jobs.
  - Created `SessionDetail` component utilizing **Supabase Realtime** (`supabase.channel().on('postgres_changes')`) to listen to live events.
- **Decisions:** Handshake between the UI and the worker occurs purely via Database events (`research_session_events` and `search_sessions.status`). The UI never waits on an HTTP response for research completion.

## Phase 5: Research Brain Architecture
- **Goal:** Design the intelligence layer separating user data from search strings.
- **Actions:**
  - Implemented `DomainExpansionService` to map skills into broad technological ecosystems.
  - Implemented `QueryGenerationService` to build highly specific string intents.
  - Implemented `QueryRankingService` to sort queries deterministically.
  - Created `ResearchPlanBuilder` to bundle outputs.
- **Decisions:** The "Brain" operates inside the worker, strictly limiting the worker loop to a maximum of 15 highly optimized queries to save downstream search API tokens. All AI operations are mocked for now.

## Phase 6: Worker Foundation
- **Goal:** Build the engine that consumes the `ResearchPlan`.
- **Actions:**
  - Designed the `SearchProvider` interface.
  - Built `WorkerLifecycle` for session locking and cleanup.
  - Built `ResearchExecutor` to iterate through search plans.
  - Implemented exponential backoff retry logic.
  - Created `CostTracker` to flush operational logs.
- **Decisions:** Real searching deferred. `MockSearchProvider` injected to test network failure scenarios (10% random timeout).

## Phase 7: Search Discovery Strategy
- **Goal:** Build the planning and optimization layer for internship discovery.
- **Actions:**
  - Designed `SearchWavePlanner` to orchestrate budget and deduplication.
  - Built `QueryBudgetManager`, `SearchCostEstimator`, and `QueryDeduplicationEngine`.
  - Implemented `SearchCoverageAnalyzer` to round-robin select diverse search intents.
- **Decisions:** AI queries must be aggressively filtered. Executing all queries at once wastes API quotas; instead, queries are chunked into cost-aware waves.

## Phase 8: Provider Integration
- **Goal:** Connect real search APIs via a resilient registry architecture.
- **Actions:**
  - Built `ProviderRegistry` for quota tracking and circuit-breaking.
  - Built `ProviderRouter` for weighted failover routing.
  - Implemented the first real API: `GoogleCSEProvider` (Google Custom Search).
- **Decisions:** Used Google CSE as the first provider because it perfectly matches the constraint of "Free infrastructure" (100 free queries/day renewing forever) and natively indexes local Pakistani job boards better than AI proxies like Tavily.

## Phase 8B: Google CSE Provider Integration
- **Goal:** Execute real internet queries using Google Programmable Search Engine.
- **Actions:**
  - Implemented the `GoogleCSEProvider` to map the `SearchProvider` interface to the physical Google REST API.
  - Implemented `SearchResult` normalization to flatten Google JSON payloads.
  - Built a local debug storage utility to drop raw search payloads into `.debug/search_responses/`.
- **Decisions:** Used native `fetch` with strict HTTP 429 Quota Exceeded trapping to perfectly synchronize with the `WorkerLifecycle` exponential backoff and circuit breaker algorithms.

## Phase 8C: Provider Execution Refactor
- **Goal:** Unify the Discovery Strategy and Provider Registry into the Worker Lifecycle.
- **Actions:**
  - Removed the hardcoded mock provider from `WorkerLifecycle`.
  - Refactored `ResearchExecutor` to accept `SearchWave` tasks instead of a raw `ResearchPlan`.
  - Implemented dynamic per-query provider selection inside the execution loop.
  - Connected `ProviderRegistry.reportSuccess` and `ProviderRegistry.reportFailure` to the execution metrics.
  - Built an active failover trap that calls `ProviderRouter.getFailover()` if a query completely crashes.
- **Decisions:** Stopped retrying fatal HTTP errors (429, 403) to prevent the worker from hanging. The execution loop now seamlessly falls back to backup providers if the primary (like Google CSE) hits a daily limit or goes down.

## Phase 9: Extraction & Classification Engine
- **Goal:** Transform raw search URLs into structured `InternshipCandidate` payloads using purely deterministic methods.
- **Actions:**
  - Built `PageFetcher` using native `fetch` with browser header spoofing.
  - Built `PageClassifier` to waterfall URLs and HTML into distinct page categories (e.g., `internship_listing`).
  - Built `InternshipExtractor` utilizing `cheerio` to parse structured JSON-LD and DOM elements into a candidate schema.
  - Built `ExtractionConfidenceScorer` and `CandidateValidator` to gate database insertion based on data density and relevant keywords.
- **Decisions:** Strictly deferred LLM usage. By utilizing a 100% deterministic pipeline (Regex + Cheerio), the system heavily protects AI quotas. LLMs will only be used in the future if the `confidenceScore` of a valid listing falls below a strict threshold.

## Phase 10: Canonicalization & Deduplication Engine
- **Goal:** Transform raw `InternshipCandidate` objects into unified, deduplicated `CanonicalInternship` records ready for database insertion.
- **Actions:**
  - Built `InternshipNormalizer` to string-clean domains, titles, and locations (e.g., stripping legal suffixes and standardizing Pakistani city abbreviations).
  - Built `CanonicalKeyGenerator` to produce deterministic hashes (e.g., `devsinc:software_engineer_intern:lahore`).
  - Built `DeduplicationEngine` and `InternshipMergeStrategy` to handle collision resolution, actively preferring Official Career Page data over third-party boards.
  - Built `SourceAggregator` to maintain an array of all discovered URLs.
- **Decisions:** Continued the philosophy of deterministic processing over AI. Relying on strict dictionary normalization heavily protects database integrity against duplicate postings without spending Gemini tokens.

## Phase 10B: Canonicalization Hardening
- **Goal:** Resolve severe database collision risks identified during the Canonicalization Engine audit.
- **Actions:**
  - Updated `CanonicalKeyGenerator` to dynamically inject base-36 URL hashes into the primary key whenever a "Generic Title" (e.g., "Internship") or "Unknown Company" is detected.
  - Reduced `InternshipNormalizer` aggressiveness, retaining essential entity modifiers like `technologies` and `software`, and strictly differentiating between `remote` and `hybrid`.
  - Added native `requiresManualReview` flags to the `CanonicalInternship` payload.
- **Decisions:** Accepted the architectural trade-off of "fracturing" (creating duplicate DB records for the same generic job scraped across different boards) in order to completely eliminate the fatal risk of colliding entirely distinct jobs together.

## Phase 11: Persistence Pipeline
- **Goal:** Persist `CanonicalInternship` records into Supabase while enforcing deduplication constraints and provenance tracking.
- **Actions:**
  - Built `DatabaseMappingLayer` to transform in-memory models to Supabase `internships` and `internship_sources` rows, dynamically injecting deterministic SQL `tags`.
  - Built `InternshipRepository` and `InternshipSourcePersistenceService` to execute direct database queries.
  - Implemented `UpsertStrategy` utilizing Supabase's native `ON CONFLICT` resolution to handle canonical collisions.
  - Built `InternshipPersistenceService` as the orchestrator to process batches and compile `PersistenceMetrics`.
- **Decisions:** Strictly utilized native PostgreSQL upsert mechanisms to resolve collisions instead of executing an inefficient "check if exists -> insert or update" sequential pattern, reducing database round-trips by 50%.

## Hotfix: Application URL Persistence
- **Goal:** Resolve critical data loss bug where `application_url` was permanently dropped during the database mapping phase.
- **Actions:**
  - Updated `database-design.md` and `initial_schema.sql` to natively include an `application_url TEXT` column on the `internships` table.
  - Updated `InternshipRow` TypeScript interface.
  - Updated `DatabaseMappingLayer` to dynamically extract and persist the URL.
- **Decisions:** Allowed `application_url` to remain natively nullable in the PostgreSQL database because many scraped job listings do not supply an exact application link.

## Phase 12: AI Research Brain Integration
- **Goal:** Replace deterministic mock intelligence components (`DomainExpansionService`, `QueryGenerationService`) with true LLM reasoning via Google Gemini.
- **Actions:**
  - Installed `@google/genai` and created the `GeminiService` wrapper for structured JSON outputs.
  - Implemented `gemini.schema.ts` defining strict Zod validation schemas for all LLM payloads.
  - Built `AiCacheService` to hook into the existing Supabase `ai_cache` table.
  - Updated Domain and Query services to execute caching, execute Gemini prompts, validate output, and fall back to deterministic mocks on failure.
- **Decisions:** 
  - Required strict `application/json` output and forced `Zod` validation.
  - Hashed stringified, sorted arrays (`[...arr].sort()`) using `crypto.createHash('sha256')` to prevent cache collisions and guarantee deduplicated profile cache hits.
  - Built the `GeminiService` with an exponential backoff loop to survive 429s and timeouts.
  - If the API key is missing or validation critically fails, the code throws gracefully and the services instantaneously fall back to hardcoded dictionaries (the "Deterministic First" philosophy).

## Phase 13: Matching Engine (Architecture & Audit)
- **Goal:** Design the matching engine pipeline to evaluate internships against user profiles scaleably and safely.
- **Actions:** 
  - Authored `PHASE_13_ARCHITECTURE.md` mapping inputs, matching signals (0-100 score), AI generation layers, and batch processing strategies.
  - Conducted a strict database scalability audit (`PHASE_13_DB_AUDIT.md`) identifying severe N+1 bottlenecks and missing indexes.
  - Revised the architecture to mandate an **Internship-Centric Delta Batch** to eliminate thousands of network connections, evaluating all matches exclusively in Node.js memory.
- **Decisions:** 
  - Mandated a new B-Tree index on `discovered_at` for the `internships` table.
  - Discarded complex SQL location trigram indexes in favor of purely in-memory evaluation.
  - Deferred Match TTL retention policies and PostgreSQL dead-tuple vacuum optimizations to a future scaling sprint to maintain momentum.

## Hotfix: Async Integration & TypeScript Fixes
- **Goal:** Resolve compilation errors induced by the Phase 12 architecture transition.
- **Actions:**
  - Upgraded `ResearchPlanBuilder.buildPlan` to correctly instantiate `SupabaseClient` and `await` the new async `DomainExpansionService` and `QueryGenerationService` methods.
  - Fixed strict typing for `remote_preference` inside `ProfileReview.tsx` mapping to Supabase's literal types.
  - Corrected broken relative imports for `WorkerMetrics` across the worker module.
- **Decisions:** Enforced exact TypeScript literals (`"remote" | "hybrid" | "onsite" | "no_preference"`) for profile state extraction instead of falling back to `any`.

## Phase 13: Matching Engine (Implementation & Audit Fixes)
- **Goal:** Translate the `PHASE_13_ARCHITECTURE.md` into TypeScript code and integrate it into the application lifecycle.
- **Actions:**
  - Created `supabase/migrations/20260619000000_idx_internships_discovered_at.sql` — adds required B-Tree index on `internships(discovered_at)`.
  - Added complete type definitions for `internships` and `matches` tables in `src/lib/supabase/types.ts`.
  - Implemented `MatchScorer.ts` with a deterministic 85-point heuristic matrix.
  - Implemented `MatchExplanationService.ts` via Gemini for top-5 match semantic score boosts.
  - Implemented `MatchRepository.ts` for safe `ON CONFLICT` Upserts omitting `user_feedback` overwrites.
  - Implemented `MatchEngine.ts` utilizing an Internship-Centric Delta Batch to prevent N+1 queries.
  - Integrated `MatchEngine.executeDeltaBatch()` seamlessly into the `WorkerLifecycle.runSession()` pipeline.
- **Decisions:**
  - Gemini explanation generation is bounded to the top 5 matches per user to prevent infinite scaling loops and token exhaustion.
  - Matching executes as the absolute final step in the worker lifecycle.
- **Audit Verdict:** PASSED. Build exits with code 0 (`npx tsc --noEmit`). Zero TypeScript compilation errors.
- **Remaining Debt:** Sequential Gemini calls create a serverless timeout risk above 50 simultaneous users. Needs future background decoupling (Phase 15).

## Phase 14 Planning: Recommendation UI & Match Feedback Loop
- **Goal:** Determine the highest-value Phase 14 direction and produce complete architecture documentation.
- **Actions:**
  - Conducted a comparative analysis of 6 candidate phases: Notifications, Recommendation UI, Background Scheduling, Match Feedback Loop, Analytics, and Admin Tooling.
  - Determined that Recommendation UI combined with Match Feedback Loop is the highest-priority Phase 14 because the entire Matching Engine backend is invisible to users without it.
  - Authored `PHASE_14_ARCHITECTURE.md` with: comparative analysis, system overview, data flow, component hierarchy, card state machine, database migrations required, route structure, feature module structure, server action design, full implementation roadmap, and success criteria.
- **Decisions:**
  - Background Scheduling (Vercel timeout fix) is deferred to Phase 15 because it is a scaling concern, not a beta-readiness concern. Low user volume during initial beta does not trigger the timeout risk.
  - Notifications require a feedback loop to exist first — deferred to Phase 16.
  - No new columns required in the schema. All necessary columns (`semantic_score`, `explanation`, `user_feedback`) already exist in the `matches` table.
  - Two new B-Tree index migrations are required for performant reads.

## Phase 14: Recommendation UI & Match Feedback Loop
- **Goal:** Implement the user-facing recommendation interface and feedback loop to record user actions (saved, applied, rejected) per the `PHASE_14_ARCHITECTURE.md`.
- **Actions:**
  - Created database migrations for index performance optimization: `20260619100000_idx_matches_session_profile.sql` (composite index on `session_id`, `profile_id`) and `20260619200000_idx_matches_semantic_score.sql` (index on `semantic_score DESC`).
  - Implemented the Next.js Server Component page `/dashboard/sessions/[id]/matches` to load and render session match recommendations.
  - Developed `MatchService.getSessionMatches()` to fetch matches joined with their corresponding internship postings.
  - Created the `recordMatchFeedback` Server Action inside `feedback.action.ts` utilizing secure server-verified user ID validation to record user feedback.
  - Created all core UI components (`MatchCard`, `FeedbackButtons`, `ScoreBar`, `TagList`, `MatchListHeader`) along with their corresponding CSS Modules.
  - Updated `SessionDetail.tsx` to conditionally display a prominent "View Matches" button linking to the matches list when a session status is marked as completed.
  - Audited and resolved a key TypeScript compilation error in `MatchService.ts` by casting the dynamic PostgREST join mapping of `internships` to an array structure and fetching index 0 safely.
- **Decisions:**
  - Enforced CSS Modules strictly without any Tailwind dependency.
  - Opted to handle card rejection states by dimming the `MatchCard` container (`opacity: 0.45`) and disabling pointer-events across the card layout except for the actions panel, allowing the user to seamlessly undo rejections.
  - Omitted `user_feedback` field updates during backend `MatchRepository` upserts to guarantee that student actions (e.g. saves or rejections) are never overwritten when new match waves execute.
- **Audit Verdict:** PASSED. Verified zero compilation errors under `npx tsc --noEmit` and strict authorization checks at both route and action levels.

## Phase 15: Background Scheduling & Worker Decoupling
- **Goal:** Decouple the worker execution pipeline off the Next.js client-side thread to solve Vercel's 10-second serverless execution limits, secure privileged access tokens, and run asynchronously on a zero-cost runner.
- **Actions:**
  - Created Next.js API trigger route `/api/sessions/trigger` which receives UI session requests, inserts records to `search_sessions` (state: `'pending'`), writes timeline logs, and fires an HTTP POST dispatch to the GitHub Repository Dispatch API (`trigger-worker` event).
  - Created background execution workflow `.github/workflows/worker.yml` triggered on `repository_dispatch` to instantiate Node on ubuntu-latest and run CLI scripts.
  - Developed CLI script `src/scripts/run-worker.ts` which instantiates a Supabase client using `SUPABASE_SERVICE_ROLE_KEY` to bypass database RLS rules and triggers `WorkerLifecycle.runSession()`.
  - Refactored `WorkerLifecycle.ts`, `ResearchExecutor.ts`, `CostTracker.ts`, `ProfileService.ts`, `ResearchPlanBuilder.ts`, and `SessionService.ts` to support optional privileged client parameter injections.
  - Refactored `StartSessionButton.tsx` to POST search sessions directly to the trigger endpoint, removing direct imports of `MockWorker` and purging parsing/crawling libraries from client React bundles.
  - Added `import 'server-only'` headers to matching and worker core services, resolving standalone script ESM imports by introducing a custom paths override in `tsconfig.json` that maps `server-only` to a dummy local mock file (`src/mocks/server-only-mock.ts`).
  - Added `tsx` dependency to devDependencies and installed `server-only` to resolve script runtime issues.
- **Worker Architecture & Trigger Flow:**
  - **Flow:** User clicks "Start Discovery" -> UI calls `/api/sessions/trigger` -> API creates a pending session and dispatches `trigger-worker` event -> GitHub API initiates the GHA Workflow -> GHA clones the repo, installs dependencies via npm cache, and runs `npx tsx src/scripts/run-worker.ts` -> Worker updates DB session state to `crawling`, executes scraping, normalizes and canonicalizes results, computes match scores, and writes them to the database -> Supabase Realtime notifies the UI of state changes.
- **Required Credentials & Secrets:**
  - **Vercel Hosting Env Vars:**
    - `GITHUB_OWNER`: Owner of the GitHub repository.
    - `GITHUB_REPO`: Repository name.
    - `GITHUB_PAT`: GitHub Personal Access Token with write scope for Repository Dispatches.
  - **GitHub Actions Repository Secrets:**
    - `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL.
    - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role secret key (bypasses RLS).
    - `GEMINI_API_KEY`: API Key for Google Gemini services.
    - `GOOGLE_CSE_API_KEY`: API Key for Google Custom Search.
    - `GOOGLE_CSE_ENGINE_ID`: Programmable Search Engine ID.
- **Decisions:**
  - Standardized on GitHub Actions dispatch as a zero-cost ($0) background runner satisfying the 50-user execution quota.
  - Standardized on `tsx` (TypeScript Execute) for running backend Node.js scripts in the GHA runner because it natively parses and resolves `tsconfig.json` path mappings for ESModule `import` statement environments where CommonJS-based `require` aliases fail.
  - Bypassed standard runtime checks of the `server-only` package in standalone CLI execution by mapping the module path to an empty local mock in `tsconfig.json`, preserving Next.js build-time safety checks.
- **Audit Verdict:** PASSED. Verified zero compilation errors under `npx tsc --noEmit` and successful script execution check. No backend worker/scraping dependencies leak to the frontend client React bundle. RLS is fully respected and service role keys are strictly locked on the server/runner environment.

## Phase 16 Planning: Notifications & User Re-engagement
- **Goal:** Determine the highest-leverage next phase and produce comprehensive architecture documentation for user alerts.
- **Actions:**
  - Evaluated 7 candidate phases: Notifications, Feedback Learning Loop, Analytics Dashboard, Realtime Match Updates, Admin Operations Console, AI Extraction Fallbacks, and Match Quality Improvement.
  - Formulated a prioritization matrix ranking candidates by user value, engineering effort, cost, deterministic alignment, and beta fit.
  - Selected Notifications & User Re-engagement as the highest-priority Phase 16 to close the asynchronous background execution loop established in Phase 15.
  - Authored `PHASE_16_ARCHITECTURE.md` specifying database columns, event-driven trigger flow, webhook authentication, template design, cost analysis, failure modes, and implementation roadmap.
- **Decisions:**
  - Standardized on a Supabase Database Webhook trigger on `search_sessions` completion rather than worker-initiated alerts, keeping worker scopes clean.
  - Standardized on Resend as the SMTP provider utilizing its 3,000 free emails/month tier to maintain zero-cost operations ($0).
  - Enforced email throttling by sending a single summary digest per session, filtering matches at a customizable threshold (default >= 75) to prevent email spam.

## Phase 16: Notifications & User Re-engagement (Implementation & Nodemailer Migration)
- **Goal:** Implement the asynchronous user re-engagement system to dispatch email summaries for successful background search sessions.
- **Actions:**
  - Created migration `20260620000000_profile_notification_settings.sql` adding `email_notifications_enabled` and `notification_threshold` to `profiles`.
  - Created migration `20260620100000_session_notification_idempotency.sql` adding `notification_sent` tracking to `search_sessions` to prevent duplicate emails.
  - Implemented `NotificationService` that handles database preference queries, Match logic checks, HTML email rendering, and delivery integration.
  - Created a styled React template (`NotificationEmailTemplate.tsx`) using SSR string rendering (`renderToStaticMarkup`).
  - Added user configuration toggles to `ProfileReview.tsx` so students can configure their preferences dynamically.
  - Created the `/api/webhooks/session-completed` secure API endpoint mapped to Supabase database update triggers.
- **Decisions:**
  - Pivot from Resend: To ensure true $0 operational cost and resolve production audit limitations, Resend was removed entirely and replaced with `nodemailer` utilizing Gmail SMTP App Password authentication.
  - Idempotency Gate: Enforced an atomic read/update pattern natively inside `NotificationService` against `search_sessions.notification_sent` to silently block any twin execution triggered by duplicated webhooks.
- **Audit Verdict:** PASSED. Verified zero compilation errors under `npx tsc --noEmit`. Identified that scaling beyond 500 users per day would require migrating away from standard Gmail SMTP to a transactional provider due to Gmail's daily limits.
