# AI Session Handoff Guide

**Welcome!** If you are a newly instantiated AI agent reading this file, you have been brought into the **Internship Finder** project. This file is your map.

## 1. Project Philosophy
- **Asynchronous Execution:** Searching the internet and running AI evaluations takes minutes. Never block the UI thread. The Next.js frontend is purely a state viewer; the heavy lifting occurs in background workers parsing relational database rows.
- **Determinism Over AI:** AI is expensive. Use standard deterministic code to filter, normalize, and query data first. Only use an LLM (Gemini) when deep semantic understanding is explicitly required (e.g., expanding domains or matching a user's skills to an unstructured job description).
- **Aesthetic Matters:** The app must look premium. We are explicitly **banned from using TailwindCSS**. You must write raw CSS Modules following modern design patterns.

## 2. Architecture Summary
- **Frontend:** Next.js App Router (`src/app/`), React Hook Form, Zod.
- **Backend/DB:** Supabase (PostgreSQL), strictly enforced with Row Level Security (RLS).
- **Structure:** Feature-based folder architecture (`src/features/auth`, `src/features/onboarding`, `src/features/brain`, `src/features/worker`, `src/features/matching`).

## 3. Mandatory Read Order
Before you write *any* code or make an architectural decision, you MUST read the following files in this exact sequence:
1. `.rules` (System constraints and stack mandates)
2. `project-context.md` (Product vision and end-user flow)
3. `agents.md` (Execution philosophy and component isolation)
4. `database-design.md` (The source of truth for all data relationships)
5. `CURRENT_STATE.md` (Where the project is right now — including all known bugs)

## 4. Current Status
Phase 13 Matching Engine code has been **written but the project does NOT compile cleanly**. A TypeScript audit produced 17 errors. The build is BROKEN. You must fix these before any further implementation.

## 5. Outstanding Bugs — Fix These First

### Bug 1: Missing internships + matches table types (BLOCKER)
**File:** `src/lib/supabase/types.ts`
**Problem:** The `Database` interface is missing the `internships` and `matches` table definitions. The Supabase client resolves these tables as type `never`, causing 14 compiler errors in `MatchEngine.ts` and `MatchRepository.ts`.
**Fix:** Add `internships` and `matches` table Row/Insert/Update type blocks to the `Tables` property of the `Database` interface. Reference `initial_schema.sql` for the authoritative column list.

### Bug 2: Gemini SDK incompatibility (BLOCKER)
**File:** `src/features/brain/services/gemini.service.ts`, line 49
**Problem:** `response.text()` is called as a function. In the current `@google/genai` SDK, `text` is a getter property, not a method.
**Fix:** Change `response.text()` to `response.text`.

### Bug 3: MatchEngine not wired into WorkerLifecycle (INTEGRATION MISSING)
**File:** `src/features/worker/core/WorkerLifecycle.ts`
**Problem:** The worker completes the discovery/extraction/persistence pipeline but never calls `MatchEngine.executeDeltaBatch()`. The matching step is absent.
**Fix:** After `executor.executeWave(wave)` completes (step 5 in the lifecycle), instantiate `MatchEngine` and call `executeDeltaBatch(lastRunTime)`, where `lastRunTime` is the session's `started_at` timestamp.

## 6. Next Development Branch
`phase-13a-matching-fixes`

## 7. Success Criteria for Phase 13a
- `npx tsc --noEmit` returns zero errors.
- `MatchEngine` is called from within `WorkerLifecycle.runSession()`.
- All Phase 13 audit findings are resolved.

## ACCOUNT TRANSITION RECOVERY PROCEDURE

Step 1: Read `PROJECT_BOOTSTRAP.md`
Step 2: Read `CURRENT_STATE.md` — pay special attention to **Outstanding Bugs**
Step 3: Read `SESSION_HANDOFF.md` (this file)
Step 4: Read `TRANSITION_SNAPSHOT.md`
Step 5: Read `PHASE_13_ARCHITECTURE.md`
Step 6: Summarize your understanding of all bugs before writing any code.
