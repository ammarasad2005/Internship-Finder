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
