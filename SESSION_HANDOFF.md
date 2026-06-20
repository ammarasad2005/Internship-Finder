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
Phase 15 (Background Scheduling & Worker Decoupling) is fully implemented, verified, and audited with success. Phase 16 Planning (Notifications & User Re-engagement) is also complete and documented in `PHASE_16_ARCHITECTURE.md`. The codebase is fully typesafe and `npx tsc --noEmit` exits with 0 errors.

## 5. Outstanding Bugs — Fix These First
*There are no compilation or runtime blockers at this time.*

## 6. Next Development Branch
`phase-15-planning` remains active until merged, after which we will branch to `phase-16-notifications` for Phase 16 implementation.

## 7. Success Criteria for Phase 16 (Notifications)
- Create notification preference schema (e.g., `profiles.email_notifications_enabled`).
- Implement an asynchronous notification trigger (e.g., Supabase Webhooks or Database Triggers) when new matches with high scores (>75) are persisted.
- Connect an email provider service (e.g., Resend or mock equivalent with switch) to send HTML recommendation summaries.
- Provide direct link templates in email leading back to `/dashboard/sessions/[id]/matches`.
- Verify security of notification dispatch pipelines (ensure no data leakage of other users' matches).


## ACCOUNT TRANSITION RECOVERY PROCEDURE

Step 1: Read `PROJECT_BOOTSTRAP.md`
Step 2: Read `CURRENT_STATE.md`
Step 3: Read `SESSION_HANDOFF.md` (this file)
Step 4: Read `TRANSITION_SNAPSHOT.md`
Step 5: Summarize your understanding before writing any code.

