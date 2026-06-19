# Phase 13a: Fix Matching Engine Audit Failures

## Exact Prompt for the Next Agent

```
Read the following files in order before writing any code:
1. PROJECT_BOOTSTRAP.md
2. CURRENT_STATE.md
3. SESSION_HANDOFF.md
4. EXECUTIVE_SUMMARY.md
5. NEXT_PHASE.md
6. supabase/migrations/20260618000000_initial_schema.sql (for the authoritative DB schema)
7. src/lib/supabase/types.ts (to understand what type definitions exist vs what is missing)
8. src/features/matching/services/MatchEngine.ts
9. src/features/matching/services/MatchRepository.ts
10. src/features/brain/services/gemini.service.ts
11. src/features/worker/core/WorkerLifecycle.ts

After reading, do the following in exact order:

STEP 1 — Fix src/lib/supabase/types.ts
Add the following table definitions to the Database.public.Tables object.
Reference the columns from initial_schema.sql exactly.

Tables to add:
- internships (id, canonical_key, company_name, role_title, location, description,
  application_url, tags, is_active, discovered_at, updated_at)
- matches (id, profile_id, internship_id, session_id, semantic_score, explanation,
  user_feedback, created_at)
- internship_sources (id, internship_id, source_url, source_type, is_primary, first_seen_at)
- search_sessions (id, profile_id, status, started_at, completed_at, created_at)
- profile_skills (id, profile_id, skill_name, source, created_at)
- profile_projects (id, profile_id, project_name, description, technologies, project_url, source, created_at)

For each table provide Row, Insert, and Update type blocks.
Use the correct Enum types where applicable (e.g., user_feedback_type, source_type_enum, search_session_status).

STEP 2 — Fix gemini.service.ts line 49
Change:
  const text = response.text();
To:
  const text = response.text;

STEP 3 — Wire MatchEngine into WorkerLifecycle.ts
In WorkerLifecycle.runSession(), after executor.executeWave(wave) completes and BEFORE the
costTracker.flushToDatabase() call, add:

  const matchEngine = new MatchEngine();
  const lastRunTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await matchEngine.executeDeltaBatch(lastRunTime);

Also add the import at the top of WorkerLifecycle.ts:
  import { MatchEngine } from '@/features/matching/services/MatchEngine';

STEP 4 — Verify the build
Run: npx tsc --noEmit
Expected output: zero errors, process exits with code 0.

If there are remaining errors, fix them before proceeding.

STEP 5 — Commit
git add -A
git commit -m "fix: resolve phase 13 audit failures and wire MatchEngine into WorkerLifecycle"

STEP 6 — Re-run the Phase 13 audit
Repeat the comprehensive audit from the previous session:
1. TypeScript correctness
2. Worker integration
3. Database compatibility
4. Security review
5. Gemini review
6. Performance review
7. Matching accuracy review
8. Production readiness

Report PASS/FAIL for each category.
```
