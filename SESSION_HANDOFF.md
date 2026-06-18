# AI Session Handoff Guide

**Welcome!** If you are a newly instantiated AI agent reading this file, you have been brought into the **Internship Finder** project. This file is your map.

## 1. Project Philosophy
- **Asynchronous Execution:** Searching the internet and running AI evaluations takes minutes. Never block the UI thread. The Next.js frontend is purely a state viewer; the heavy lifting occurs in background workers parsing relational database rows.
- **Determinism Over AI:** AI is expensive. Use standard deterministic code to filter, normalize, and query data first. Only use an LLM (Gemini) when deep semantic understanding is explicitly required (e.g., expanding domains or matching a user's skills to an unstructured job description).
- **Aesthetic Matters:** The app must look premium. We are explicitly **banned from using TailwindCSS**. You must write raw CSS Modules following modern design patterns.

## 2. Architecture Summary
- **Frontend:** Next.js App Router (`src/app/`), React Hook Form, Zod.
- **Backend/DB:** Supabase (PostgreSQL), strictly enforced with Row Level Security (RLS).
- **Structure:** Feature-based folder architecture (`src/features/auth`, `src/features/onboarding`, `src/features/brain`, `src/features/worker`).

## 3. Mandatory Read Order
Before you write *any* code or make an architectural decision, you MUST read the following files in this exact sequence:
1. `.rules` (System constraints and stack mandates)
2. `project-context.md` (Product vision and end-user flow)
3. `agents.md` (Execution philosophy and component isolation)
4. `database-design.md` (The source of truth for all data relationships)
5. `CURRENT_STATE.md` (Where the project is right now)

## 4. Current Status
We have completed Phase 9. The Worker node executes optimized search waves dynamically routed to real APIs (Google CSE), fetches the HTML from the returned URLs, and uses a `cheerio`-based extraction engine to parse the DOM into validated `InternshipCandidate` objects.
**However:** The AI Brain components (`DomainExpansionService`, `QueryGenerationService`) are still using deterministic string-matching instead of true Gemini prompts.

## 5. Exact Next Development Objective
Your immediate objective should be negotiating **Phase 10: True AI Integration**. 
This means taking the foundational mocked AI systems and wiring them up to the Google Gemini API.
- Example task: Replace `DomainExpansionService` mock dictionaries with a Gemini structured JSON output prompt.
- Example task: Implement an LLM fallback extractor for the `ExtractionEngine` when deterministic parsing returns a low confidence score.

**DO NOT** rewrite the infrastructure. **PLUG IN** to the existing `SearchProvider` interfaces and `WorkerLifecycle`.

Good luck!
