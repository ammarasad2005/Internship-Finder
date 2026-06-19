# EXECUTIVE SUMMARY: Internship Finder — Account Transition

**Date:** June 19, 2026

This document is written for a brand-new AI agent with zero prior context. Read it before touching any code.

---

## What This Project Is

Internship Finder is an autonomous, zero-cost pipeline that discovers, deduplicates, and matches software engineering internships to students. It crawls the web, normalizes results into a Supabase PostgreSQL database, and uses Google Gemini selectively for intelligence tasks.

**Philosophy:** Deterministic First. Never use AI when SQL or a dictionary works. No Tailwind CSS. CSS Modules only.

---

## What Has Been Built (Phases 1–12)

Everything works. The full pipeline is:
1. User onboards → profile stored with skills + projects.
2. AI Brain (Gemini) expands user intent into search queries.
3. Worker executes Google Custom Search API queries.
4. DOM is fetched, parsed, and validated into internship candidates.
5. Candidates are deduplicated via tri-factor hashing.
6. Results are persisted to `internships` table via Supabase upserts.

The AI Brain uses `gemini-2.5-flash` with Zod schema validation and an `ai_cache` table to prevent duplicate API calls. Circuit breakers, exponential backoff, and deterministic fallbacks are all implemented.

---

## What Was Attempted (Phase 13) and Why It Failed

Phase 13 adds the Matching Engine: comparing internships against user profiles and writing scored `matches` rows. The code was scaffolded but the **TypeScript build is currently broken** with **17 compilation errors**.

**The three bugs that must be fixed:**

| # | File | Problem | Fix |
|---|------|---------|-----|
| 1 | `src/lib/supabase/types.ts` | Missing `internships` and `matches` table type definitions. Supabase client resolves them as `never`. | Add Row/Insert/Update definitions for both tables using `initial_schema.sql` as reference. |
| 2 | `src/features/brain/services/gemini.service.ts:49` | `response.text()` called as function — it's a getter in the current SDK. | Change to `response.text`. |
| 3 | `src/features/worker/core/WorkerLifecycle.ts` | `MatchEngine.executeDeltaBatch()` is never called. Matching never runs. | Instantiate `MatchEngine` and call `executeDeltaBatch()` after the executor wave completes. |

---

## What the Matching Engine Does (Once Fixed)

The engine uses an **Internship-Centric Delta Batch**:
1. Fetch all internships discovered since last run — **1 query**.
2. Fetch all active user profiles with skills/projects — **1 query**.
3. Score all pairs in Node.js memory (no database round-trips).
4. Score = Location (20) + Tags (20) + Title (20) + Projects (25) + AI Boost (15) = **100 max**.
5. Gemini generates personalized explanations for the **top 5 matches per user only**.
6. Results are upserted into the `matches` table. `user_feedback` is never overwritten.

---

## Current Git State

```
Branch:  phase-13-matching-engine
Status:  BROKEN — tsc exits with code 2
Next:    phase-13a-matching-fixes
```

---

## Your Immediate Job

**Do not add features. Do not refactor. Fix the build.**

Read `SESSION_HANDOFF.md` for the exact steps. Then run `npx tsc --noEmit` and confirm zero errors before doing anything else.
