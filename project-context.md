# Internship Finder - Project Context

## Product Philosophy
Internship Finder is **not a job board**. It is a domain-specific deep research agent for internship discovery. The core objective is maximizing discovery quality and match quality for a small, highly targeted user base (10-50 Pakistani university students), rather than building a scalable web crawler.

## Execution Architecture
- **Frontend & Session Management:** Vercel (Next.js App Router). Handles UI, onboarding, and session state.
- **Research Engine Backend:** GitHub Actions (or similar asynchronous workers). Research workflows run asynchronously and are **not** constrained to a single HTTP request.
- **Database:** Supabase (PostgreSQL, Auth, Storage).
- **Search Providers:** Must be pluggable to support multiple search providers and extraction methods.

## Core Workflow

### 1. Multi-path Onboarding & Profile Enrichment
Users can onboard via multiple methods to reduce friction:
- Resume Upload (PDF)
- LinkedIn Profile URL
- Quick Start (Manual entry of domain, skills, location)
- Conversational Onboarding (Adaptive AI questions)

The system calculates a **Profile Confidence Score**. Research only begins after sufficient profile confidence is reached. AI is used to evaluate the profile and prompt for missing gaps.

### 2. Recursive Research Pipeline
Rather than a single-pass search, the system acts as a recursive research agent. 
- It maps the user's profile to relevant domains and technologies.
- It performs iterative research (e.g., discovering a company → searching its career page → extracting specific roles).
- It relies on multiple pluggable search providers and extractors (HTML, Playwright).

### 3. Processing & Deduplication
Data quality is handled via deterministic processing first:
- **Canonical Identifier:** Generated using `company + role + location` after string normalization.
- **Provenance:** All discovered sources for an internship are retained.
- **Preference:** Official company career pages are preferred over third-party boards.
- **Listing Validation:** Uses deterministic validation (deadlines, page status) before falling back to AI to check if a listing is expired.

### 4. Matching & Recommendation
Internships are mapped against the user's profile.
- **Pre-filtering:** Uses inexpensive SQL filtering (location, remote preference) first.
- **Semantic Scoring:** AI is used on the narrowed subset for semantic matching and to generate personalized "Why this fits you" explanations.

## AI Resource Strategy
AI calls (Google Gemini) are expensive resources. 
- **Deterministic First:** Always attempt deterministic matching, deduplication, and validation before using AI.
- **Targeted AI Usage:** Use AI *only* for profile analysis, profile enrichment, domain expansion, semantic matching, and explanation generation.
- **Batching & Caching:** Batch AI operations where possible and globally cache reusable outputs (like technology domain mappings).
