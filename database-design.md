# Internship Finder - Database Design

This document outlines the Supabase (PostgreSQL) data model required to support the Internship Finder's asynchronous, recursive research architecture.

## 1. Entity Overview

The system is designed around separating user preferences (UI domain) from the global discovery engine (Worker domain). 

### 1.1 `profiles`
- **Purpose:** Stores core user information, onboarding state, and high-level internship preferences.
- **Columns:**
  - `id` (uuid, primary key)
  - `first_name` (text)
  - `last_name` (text)
  - `location_preference` (text)
  - `remote_preference` (enum: 'remote', 'hybrid', 'onsite', 'no_preference')
  - `duration_preference` (text)
  - `paid_preference` (boolean)
  - `confidence_score` (integer, 0-100) - Checked via DB constraint. Determines if research can begin.
  - `created_at` (timestamp)
  - `updated_at` (timestamp, updated via trigger)
- **Foreign Keys:** `id` references `auth.users(id)`
- **Indexes:** `id`
- **Relationships:** 1:1 with `auth.users`, 1:N with `profile_skills`, 1:N with `profile_projects`, 1:N with `search_sessions`.

### 1.2 `profile_skills` (Onboarding & Enrichment)
- **Purpose:** Stores normalized skills, domains, and technologies the user possesses, gathered via resume parsing, manual entry, or conversational AI.
- **Columns:**
  - `id` (uuid, primary key)
  - `profile_id` (uuid)
  - `skill_name` (text)
  - `source` (text) - e.g., 'resume_parse', 'manual', 'ai_enrichment'
  - `created_at` (timestamp)
- **Foreign Keys:** `profile_id` references `profiles(id)`
- **Indexes:** `profile_id`
- **Relationships:** N:1 with `profiles`.

### 1.3 `profile_projects`
- **Purpose:** Store user projects separately from basic skills. Projects act as one of the strongest signals for semantic internship matching.
- **Columns:**
  - `id` (uuid, primary key)
  - `profile_id` (uuid)
  - `project_name` (text)
  - `description` (text)
  - `technologies` (text[]) - Array of technologies used in the project.
  - `project_url` (text, nullable)
  - `source` (text) - e.g., 'resume_parse', 'manual'
  - `created_at` (timestamp)
- **Foreign Keys:** `profile_id` references `profiles(id)`
- **Indexes:** `profile_id`
- **Relationships:** N:1 with `profiles`.

### 1.4 `search_sessions`
- **Purpose:** Represents a user's request to initiate a discovery cycle. Acts as the orchestrator record for GitHub Actions workers.
- **Columns:**
  - `id` (uuid, primary key)
  - `profile_id` (uuid)
  - `status` (enum: 'pending', 'in_progress', 'completed', 'failed')
  - `started_at` (timestamp, nullable)
  - `completed_at` (timestamp, nullable)
  - `created_at` (timestamp)
- **Constraints:** CHECK (`completed_at >= started_at` OR `completed_at IS NULL`)
- **Foreign Keys:** `profile_id` references `profiles(id)`
- **Indexes:** `profile_id`, `status`
- **Relationships:** 1:N with `research_runs`, 1:N with `research_session_events`, 1:N with `matches`.

### 1.5 `research_session_events`
- **Purpose:** Supports live progress tracking in the UI and stores timeline events generated during the recursive research loop.
- **Columns:**
  - `id` (uuid, primary key)
  - `session_id` (uuid)
  - `event_type` (text) - e.g., 'resume_analyzed', 'domain_expansion_complete', 'search_wave_complete', 'internship_extracted'
  - `message` (text) - Human-readable status update for the UI.
  - `metadata` (jsonb, nullable)
  - `created_at` (timestamp)
- **Foreign Keys:** `session_id` references `search_sessions(id)`
- **Indexes:** `session_id`, `created_at`
- **Relationships:** N:1 with `search_sessions`.

### 1.6 `research_runs`
- **Purpose:** Tracks the specific recursive steps or queries performed during a search session by the background worker, ensuring traceability.
- **Columns:**
  - `id` (uuid, primary key)
  - `session_id` (uuid)
  - `query_used` (text)
  - `search_provider` (text) - e.g., 'google_cse', 'linkedin', 'rozee_html'
  - `depth_level` (integer) - Tracks recursion depth (CHECK >= 0).
  - `results_found` (integer) - (CHECK >= 0).
  - `created_at` (timestamp)
- **Foreign Keys:** `session_id` references `search_sessions(id)`
- **Indexes:** `session_id`
- **Relationships:** N:1 with `search_sessions`.

### 1.7 `internships`
- **Purpose:** The global, canonical repository of deduplicated internship records discovered across all users' research sessions.
- **Columns:**
  - `id` (uuid, primary key)
  - `canonical_key` (text, unique) - Format: `normalized_company:normalized_role:normalized_location`
  - `company_name` (text)
  - `role_title` (text)
  - `location` (text)
  - `description` (text)
  - `application_url` (text, nullable)
  - `tags` (text[]) - Array of categorical tags (e.g., 'frontend', 'marketing') to enable fast SQL filtering before AI semantic matching.
  - `is_active` (boolean) - Validated via deadline or URL HTTP status.
  - `discovered_at` (timestamp)
  - `updated_at` (timestamp, updated via trigger)
- **Foreign Keys:** None.
- **Indexes:** `canonical_key` (UNIQUE), `is_active`, GIN index on `tags`
- **Relationships:** 1:N with `internship_sources`, 1:N with `matches`.

### 1.8 `internship_sources`
- **Purpose:** Tracks provenance. An internship might be found on a company page, LinkedIn, and Indeed simultaneously.
- **Columns:**
  - `id` (uuid, primary key)
  - `internship_id` (uuid)
  - `source_url` (text)
  - `source_type` (enum: 'official_career_page', 'job_board', 'linkedin', 'other')
  - `is_primary` (boolean) - True for official pages.
  - `first_seen_at` (timestamp)
- **Constraints:** UNIQUE (`internship_id`, `source_url`)
- **Foreign Keys:** `internship_id` references `internships(id)`
- **Indexes:** `internship_id`
- **Relationships:** N:1 with `internships`.

### 1.9 `matches`
- **Purpose:** Maps an internship to a specific user profile, storing the AI-generated semantic score and personalized explanation.
- **Columns:**
  - `id` (uuid, primary key)
  - `profile_id` (uuid)
  - `internship_id` (uuid)
  - `session_id` (uuid)
  - `semantic_score` (integer) - AI generated relevance score (0-100).
  - `explanation` (text) - AI generated "Why this fits you" text.
  - `user_feedback` (enum: 'applied', 'rejected', 'saved')
  - `created_at` (timestamp)
- **Constraints:** UNIQUE (`profile_id`, `internship_id`, `session_id`), CHECK (`semantic_score` between 0 and 100)
- **Foreign Keys:** `profile_id` references `profiles(id)`, `internship_id` references `internships(id)`, `session_id` references `search_sessions(id)`
- **Indexes:** `profile_id`, `internship_id`, `session_id`
- **Relationships:** N:1 with `profiles`, N:1 with `internships`.

### 1.10 `ai_cache`
- **Purpose:** Prevents duplicate Gemini API calls by caching expensive AI outputs (e.g., domain expansions, tech stack normalizations) globally.
- **Columns:**
  - `id` (uuid, primary key)
  - `cache_key` (text, unique) - Hash of the prompt or input parameters.
  - `cache_type` (enum: 'domain_expansion', 'resume_parse', 'skill_extraction', 'other')
  - `output_value` (jsonb)
  - `expires_at` (timestamp, nullable)
  - `created_at` (timestamp)
- **Foreign Keys:** None.
- **Indexes:** `cache_key` (UNIQUE), `cache_type`

### 1.11 `research_usage_logs` (Limits & Quotas)
- **Purpose:** Replaces standard "credits" by logging each research session execution. This time-series log natively supports daily limits, weekly limits, guest search capping, and future quota/tier systems by simply querying `COUNT(*)` over a timeframe.
- **Columns:**
  - `id` (uuid, primary key)
  - `profile_id` (uuid, nullable) - Nullable for tracking guest searches via IP or fingerprint if needed.
  - `session_id` (uuid)
  - `tokens_used` (integer, nullable) - Track cost per run (CHECK >= 0).
  - `created_at` (timestamp)
- **Foreign Keys:** `profile_id` references `profiles(id)`, `session_id` references `search_sessions(id)`
- **Indexes:** `profile_id`, `created_at`
- **Relationships:** N:1 with `profiles`.

---

## 2. Architecture & Interactions

### 2.1 GitHub Actions (Worker) Integration
The GitHub Actions worker acts as the asynchronous research engine. 
1. The Next.js UI creates a `search_sessions` record with `status='pending'`.
2. A cron-triggered GitHub Action runs a Node.js script that connects directly to the Supabase Postgres database.
3. It fetches pending sessions, marks them `in_progress`.
4. It reads the user's `profiles`, `profile_skills`, and `profile_projects`.
5. It executes recursive research, writing progress to `research_session_events` (for UI tracking) and `research_runs` (for telemetry).
6. It deduplicates and writes new findings to `internships` and `internship_sources`.
7. It runs AI matching algorithms and writes to `matches`.
8. It marks the `search_sessions` as `completed` and logs the usage in `research_usage_logs`.
The worker authenticates using the Supabase **Service Role Key** (bypassing RLS) or a dedicated database role with specific permissions.

### 2.2 Table Write Access Segmentation
- **Written exclusively by UI (Next.js):** 
  - `profiles`, `profile_skills`, `profile_projects`, `search_sessions` (initiation), `matches.user_feedback` (rejecting/applying).
- **Written exclusively by Research Workers (GitHub Actions):** 
  - `search_sessions` (status updates), `research_session_events`, `research_runs`, `internships`, `internship_sources`, `matches` (creating the actual match records), `ai_cache`, `research_usage_logs`.

### 2.3 Row Level Security (RLS) Strategy
All tables must have RLS enabled to prevent cross-user data leakage.
- **Strict User Ownership (`profiles`, `profile_skills`, `profile_projects`, `search_sessions`, `matches`, `research_usage_logs`):** 
  - RLS policies ensure that users can only SELECT, INSERT, and UPDATE rows where `profile_id = auth.uid()`.
- **Global Read-Only for Users (`internships`, `internship_sources`):** 
  - Users can SELECT these tables (often joined through `matches`), but cannot INSERT or UPDATE. 
  - Only the Service Role (Worker) can mutate these tables.
- **Worker-Only Internal Tables (`research_runs`, `research_session_events`, `ai_cache`):**
  - Users can read `research_runs` and `research_session_events` if they own the parent `session_id` (useful for a "live progress" UI).
  - Users have NO access to `ai_cache`. The Service Role manages this entirely.
