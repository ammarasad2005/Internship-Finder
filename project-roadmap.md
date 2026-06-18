# Internship Finder - Project Roadmap

## Phase 1: Foundation & Session UI
- [ ] Initialize Next.js App Router project (Vanilla CSS / CSS Modules).
- [ ] Establish feature-based directory structure (`src/features/`).
- [ ] Set up Supabase project (Database, Auth, Storage).
- [ ] Create mobile-first layout and authentication flow.

## Phase 2: Adaptive User Profiling
- [ ] Implement multi-path onboarding components (Resume Upload, LinkedIn URL input, Quick Start manual entry).
- [ ] Develop the **Profile Confidence Score** calculator.
- [ ] Build the Conversational Onboarding UI to dynamically ask adaptive questions for sparse profiles.
- [ ] Integrate Gemini API strictly for profile analysis and enrichment logic.
- [ ] Store comprehensive user profile data in Supabase.

## Phase 3: Asynchronous Recursive Research Engine
- [ ] Set up GitHub Actions (or equivalent background worker) to handle long-running, asynchronous research workflows.
- [ ] Develop the iterative query generation and domain expansion agent.
- [ ] Implement pluggable search providers (e.g., HTML parsers, Search APIs, Playwright extractors).
- [ ] Build the recursive workflow that cascades from domains -> companies -> career pages -> internship roles.
- [ ] Implement deterministic listing validation (deadlines, 404 checks) before AI fallback.

## Phase 4: Deduplication & Matching
- [ ] Build deterministic deduplication pipeline using `company + role + location` canonical identifiers.
- [ ] Store all discovered sources but present the official company page as the primary source.
- [ ] Develop SQL-based pre-filtering (location, duration constraints) to narrow down candidates.
- [ ] Use Gemini to semantically match the filtered shortlist to the user profile.
- [ ] Generate personalized explanations ("Why this fits you") and missing skill analysis.

## Phase 5: Polish & Final Review
- [ ] Finalize the mobile-first Recommendation Feed UI.
- [ ] Implement global caching for reusable AI outputs (e.g., domain expansions, tech mappings) to save API limits.
- [ ] Configure Row Level Security (RLS) in Supabase.
- [ ] End-to-end testing of the asynchronous handoff between Vercel (UI) and GitHub Actions (Research Engine).
