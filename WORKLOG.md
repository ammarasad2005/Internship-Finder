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
- **Remaining Debt:** Sequential Gemini calls create a serverless timeout risk above 50 simultaneous users. Needs future background decoupling (Phase 14).

