# Phase 15 Architecture: Background Scheduling & Worker Decoupling

**Document Status:** APPROVED FOR PLANNING
**Current Branch:** `phase-15-planning`
**Implementation Branch:** `phase-15-worker-decoupling`
**Last Updated:** June 19, 2026

---

## 1. Executive Summary

Phase 15 focuses on decoupling the background scraping and AI-matching worker (`WorkerLifecycle`) from the client-side execution bundle. Currently, when a user starts a discovery session, the browser loads and executes the worker logic directly on the frontend thread. This leaks database access scopes, bundles heavy server packages (like Cheerio and the Gemini SDK) into the client bundle, and exposes the app to browser crashes and user tab-closure termination.

By migrating worker execution to a decoupled environment—specifically **GitHub Actions** triggered via **Repository Dispatch**—we achieve a secure, zero-cost ($0), serverless background worker pipeline that scales reliably up to our 50-user constraint. The Next.js frontend will communicate with the background worker asynchronously through the Supabase database layer and receive live execution updates via Supabase Realtime.

---

## 2. Why This Phase Should Be Prioritized Now

The table below ranks the Candidate Phase 15 options across key constraints.

| Candidate Phase | User Value | Security Leverage | Scalability Impact | Infrastructure Cost | Alignment with "Deterministic First" | Readiness |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Worker Decoupling (GitHub Actions)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (Critical) | ⭐⭐⭐⭐⭐ (Critical) | $0 (Free Runner Minutes) | ⭐⭐⭐⭐⭐ (High) | ⭐⭐⭐⭐⭐ (Ready) |
| **Notifications (Email/Slack)** | ⭐⭐⭐⭐ | ⭐ | ⭐ | Low (Requires SMTP config) | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Feedback Learning Loop** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐ | $0 | ⭐⭐⭐⭐⭐ | ⭐⭐ (Requires Decoupled DB queries) |
| **Analytics Dashboard** | ⭐⭐ | ⭐ | ⭐ | $0 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Realtime Matches Updates** | ⭐ | ⭐ | ⭐ | $0 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Admin Operations** | ⭐ | ⭐ | ⭐ | $0 | ⭐⭐⭐⭐⭐ | ⭐⭐ |

### Critical Motivations

1. **Security Vulnerability (Service Role Key Exposure Risk):** Currently, the worker code is bundled into client-side JS chunk allocations. Though `SUPABASE_SERVICE_ROLE_KEY` is not loaded in browser environments, any logic that depends on bypassing RLS or executing privileged database tasks cannot run. Decoupling the worker resolves this by keeping the `SUPABASE_SERVICE_ROLE_KEY` strictly inside secure environment variables on the background runner.
2. **Vercel Hobby Plan Execution Timeout (10 Seconds):** Running the worker in a Next.js API Route or Server Action is impossible because Vercel's Hobby plan terminates requests after 10 seconds. The crawler, parser, query expander, and matching scorer require 1 to 3 minutes to complete. GitHub Actions offers a 6-hour execution limit, which easily accommodates long-running discovery loops.
3. **Robust UX (Browser Tab Closure Protection):** Currently, if a user starts a session and closes the browser tab, the execution immediately halts because it is running in the client's thread. Decoupling ensures that a user can trigger a session, shut down their laptop, and return later to find their results complete.
4. **Bundle Size Reduction:** Excluding server-side dependencies (Cheerio, `@google/genai`, parser utilities) from client bundles reduces the dashboard initial load time significantly.

---

## 3. Architecture Design

### 3.1 Decoupled Execution Flow

```
                 [ User Dashboard ]
                        │  (Clicks "Start Discovery")
                        ▼
           [ Next.js API Route Handler ]  -- (Server Component)
      (`/api/sessions/trigger` - Auth Secured)
                        │
         ┌──────────────┴──────────────┐
         ▼ (Write Session Status)      ▼ (Trigger Action)
  [ search_sessions ]           [ GitHub API (Repo Dispatch) ]
  (Insert "pending" state)      (event_type: "trigger-worker")
         │                                     │
         │ (Realtime Sync)                     │ (Triggers Workflow)
         ▼                                     ▼
 [ UI Dashboard Session ]            [ GitHub Actions Runner ]
 (Listens for Realtime events)      (ubuntu-latest, runs node script)
         ▲                                     │
         │                                     ▼
         │ (Realtime Broadcast Events)   [ run-worker.ts Script ]
         └────────────────────────────── (Uses Service Role Key)
                                               │
                                               ├─► Planning (Gemini)
                                               ├─► Discovery (Google CSE)
                                               ├─► Extraction (Cheerio)
                                               ├─► Canonicalization & Upsert
                                               └─► MatchEngine Evaluation
```

### 3.2 Detailed Step-by-Step Data Flow

1. **Trigger:** The client component calls `/api/sessions/trigger` via a Server Action or HTTP POST.
2. **Verification & Creation:** The server-side route handler verifies the user's JWT, inserts a session in `search_sessions` with state `pending`, and writes an event `session_created` to the log table.
3. **Dispatch:** The server handler uses a pre-configured GitHub Personal Access Token (PAT) to POST a `repository_dispatch` event to the GitHub API:
   ```json
   POST /repos/{owner}/{repo}/dispatches
   {
     "event_type": "trigger-worker",
     "client_payload": {
       "session_id": "session-uuid-here",
       "profile_id": "profile-uuid-here"
     }
   }
   ```
4. **Response:** The API route handler immediately returns `{ success: true, sessionId: "..." }` to the UI under 200ms.
5. **Execution:** GitHub Actions picks up the workflow `.github/workflows/worker.yml`. The runner installs dependencies (`npm ci`) and runs:
   ```bash
   npx ts-node src/scripts/run-worker.ts --sessionId="UUID" --profileId="UUID"
   ```
   *Note: In the runner, `SUPABASE_SERVICE_ROLE_KEY` is safely injected from GitHub Secrets.*
6. **Updates:** As the worker executes on the runner, it writes timeline events (e.g. `planning_started`, `results_scraped`, `matching_completed`) directly into `research_session_events`. The frontend receives these events via Supabase Realtime channels and displays progress.

---

## 4. Database & Infrastructure Implications

### 4.1 Schema Security (RLS)
The database RLS rules remain unchanged. Users can only select/update their own matches and sessions. The background runner executes with the `SUPABASE_SERVICE_ROLE_KEY` which automatically bypasses RLS policies, allowing it to read profile data (projects/skills) and write matching candidates freely.

### 4.2 GitHub Actions Runner Limits (Free Tier Concurrency)
- **Free Limit:** 2,000 runner minutes/month.
- **Consumption Analysis:**
  - An average discovery run takes ~1.5 minutes (90 seconds).
  - 90 seconds * 50 users = 75 minutes of total runner execution per month (assuming 1 run per user per month).
  - Even if all 50 users execute 10 runs per month, total consumption is 750 runner minutes, which is well below the 2,000-minute free threshold.
- **Workflow Throttling:** GitHub Actions handles concurrent dispatch requests by queuing them automatically if runner limits are saturated. This prevents database overload.

---

## 5. Security & Import Safeguards

### 5.1 Elimination of Client Bundle Leakage
All imports to `@/features/worker/MockWorker` or backend services will be removed from `'use client'` React components. 
The client button will exclusively communicate with `/api/sessions/trigger`. The backend packages will no longer be packaged in the frontend bundle.

### 5.2 Server-Only Guards
Add `import 'server-only'` to:
- `src/features/matching/services/MatchEngine.ts`
- `src/features/matching/services/MatchRepository.ts`
- `src/features/worker/core/WorkerLifecycle.ts`

This compilation check guarantees that backend code cannot be mistakenly imported into client-side files.

---

## 6. Detailed Implementation Roadmap

### Phase 15.1: Next.js API Trigger Route
- Create a Next.js API route handler `/src/app/api/sessions/trigger/route.ts` that:
  - Validates user session token.
  - Generates the database `search_sessions` record.
  - Dispatches the repository event to GitHub Actions using octokit or native fetch.
- Update `StartSessionButton.tsx` to call this API route instead of `MockWorker.start()`.

### Phase 15.2: Decoupled Worker Execution CLI Script
- Create a standalone worker script `src/scripts/run-worker.ts` that parses CLI arguments (`--sessionId` and `--profileId`).
- Initialize a server-scoped Supabase client inside the script using `process.env.SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`.
- Call `WorkerLifecycle.runSession(sessionId, profileId)` directly from the CLI environment.

### Phase 15.3: GitHub Actions Workflow
- Create `.github/workflows/worker.yml` triggered by `repository_dispatch`.
- Configure the environment variables to ingest secret tokens (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GOOGLE_CSE_KEY`, `GOOGLE_CSE_CX`).

### Phase 15.4: Compilation Guarding
- Add `server-only` declarations to prevent server/client boundary pollution.
- Remove redundant backend worker code references from client UI bundles.

---

## 7. Risks & Technical Debt

- **GitHub API Rate Limits:** GitHub allows up to 5,000 API requests per hour per user/PAT, which easily satisfies our target user volumes.
- **Trigger Latency:** Starting a GitHub Action runner takes 5–15 seconds to spin up, meaning a slight delay (cold-start) before the user sees the first timeline event progress. This is handled gracefully by showing a "Waiting for runner..." state in the UI timeline.
- **Vercel timeout limits are solved:** The trigger route returns immediately, bypassing Vercel execution boundaries entirely.

---

## 8. Future Phases Unlocked

1. **Phase 16 (Notifications):** With the worker decoupled on the server, we can trigger email or Discord notifications automatically at the end of a run without client participation.
2. **Phase 17 (Feedback Optimization):** The backend worker can now query a user's historically saved/rejected matches, allowing the query planner to run learning feedback updates before execution.
