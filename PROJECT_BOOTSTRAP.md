# Project Bootstrap: Internship Finder

**Welcome to Internship Finder.** This is the foundational onboarding document for all autonomous AI agents and human developers entering the project. It provides the high-level context necessary to understand the entire architecture within 5 minutes.

## 1. Project Vision
Internship Finder is a highly autonomous, low-cost pipeline designed to discover, deduplicate, and match software engineering internships to students. It operates independently of expensive subscription job boards by crawling the web directly and building its own normalized database.

## 2. Product Philosophy
- **Deterministic First:** Never use an LLM if a regex, dictionary, or PostgreSQL query can do it. AI is exclusively reserved for semantic understanding (e.g., Domain Expansion or Semantic Explanations).
- **Asynchronous Execution:** Long-running scraping and intelligence gathering runs in the background. The Next.js frontend is purely a fast state viewer.
- **Zero-Budget Constraint:** The infrastructure heavily relies on free tiers (Vercel, Supabase, Google Custom Search API). The system strictly manages API quotas, caching, and circuit breaking to stay within a $0 operational budget.
- **Aesthetic Excellence:** Tailwind CSS is strictly banned. The UI is built using native CSS Modules aiming for premium, modern aesthetics (Glassmorphism, fluid animations).

## 3. Target Users
- Software Engineering students seeking tech internships.
- Users input unstructured text about their projects/skills, and the "Brain" translates that into highly specific search intents.

## 4. Architecture Overview
- **Frontend:** Next.js 15 App Router (`src/app/`), React Hook Form, Zod.
- **Backend/DB:** Supabase PostgreSQL with strict Row Level Security (RLS) and WebSockets for real-time UI updates.
- **Worker:** A Node.js background pipeline orchestrating discovery, extraction, and persistence.
- **Modular Structure:** Code is grouped strictly by domain in `src/features/` (e.g., `auth`, `onboarding`, `brain`, `worker`, `canonicalization`).

## 5. Tech Stack
- Next.js (App Router)
- TypeScript
- Supabase (PostgreSQL, Auth, Realtime)
- CSS Modules
- Google Custom Search API
- Google Gemini API (`@google/genai`)

## 6. Database Overview
11 core tables manage the state:
- `profiles` & `search_sessions` (User intent).
- `internships` & `internship_sources` (The discovered data).
- `matches` (The intersection of User and Data).
- `ai_cache` (Global deduplication of Gemini requests).
- `research_usage_logs` (API budget tracking).

## 7. Worker Architecture
A resilient background process that executes `SearchWaves`. It implements:
- Budget Planners (limits API calls).
- Circuit Breakers (traps 429 errors).
- Failover Routers (switches providers on failure).
- Exponential Backoff (survives transient network errors).

## 8. AI Strategy
Google Gemini 2.5 is integrated using strict Zod JSON schemas.
- **Current usage:** Domain Expansion, Query Generation.
- **Future usage:** Matching Explanations, Implicit Skill Extraction.
- **Resilience:** If Gemini fails, the system instantly triggers deterministic, hardcoded fallback arrays without crashing.

## 9. Search Strategy
The system builds complex Google Dorks based on the user's expanded domains, executes them via Google Custom Search API, and retrieves raw HTML DOMs.

## 10. Deduplication Strategy
"Tri-Factor Hashing": The engine standardizes titles, locations, and companies, stripping legal suffixes and standardizing abbreviations. It generates a deterministic `canonical_key`. If collisions occur, it merges data, heavily preferring Official Career Pages over third-party job boards.

## 11. Matching Strategy
To avoid an N x M performance collapse, the engine performs "Internship-Centric Delta Batches". It loads active users and new internships into Node.js memory and processes a 100-point scoring matrix (SQL tags, Remote match, Project relevance) locally before persisting to the DB.

## 12. Important Constraints
- **Do not modify `initial_schema.sql` without resetting the local Supabase DB.**
- **Do not use Tailwind CSS.**
- **Do not use `fs` or native Node modules in Next.js edge-rendered components.**

## 13. Key Design Decisions
- `application_url` is natively nullable because scraped sites often hide the real link.
- Identical generic job postings (e.g., "Internship") intentionally fracture into duplicate rows to absolutely prevent catastrophic false-positive merging.

## 14. Development Workflow
- Work iteratively in small phases.
- Do not plan without updating continuity documents (`WORKLOG.md`, `CURRENT_STATE.md`, `SESSION_HANDOFF.md`, `PHASE_SUMMARY.md`, `NEXT_PHASE.md`).

## 15. Branching Strategy
Features are developed on isolated branches (e.g., `phase-13-matching-engine`) representing distinct architectural phases.

## 16. Documentation Map
- **This File:** General Onboarding.
- **`CURRENT_STATE.md`:** What exists right now.
- **`WORKLOG.md`:** The chronological history of all decisions.
- **`PHASE_SUMMARY.md`:** The macro roadmap.
- **`SESSION_HANDOFF.md`:** Context for the immediate next development session.
- **`NEXT_PHASE.md`:** The exact prompt to continue work.
- **`database-design.md`:** The absolute source of truth for the DB schema.

## 17. Known Technical Debt
- Unbounded exponential growth in the `matches` table.
- PostgreSQL dead-tuple bloating from upserts.
- Primitive UI styling (CSS Modules are bare).

## 18. Current Project Maturity Assessment
**High Maturity.** The infrastructure is complete. The system can successfully map user intent to the database, dispatch resilient workers, scrape the internet, canonicalize candidates, bypass Gemini failures, and persist to PostgreSQL natively. The project is currently staged perfectly to build the final Matching Engine layer.
