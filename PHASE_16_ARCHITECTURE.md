# Phase 16 Architecture: Notifications & User Re-engagement

**Document Status:** APPROVED FOR REVIEW
**Current Branch:** `phase-15-planning`
**Implementation Branch:** `phase-16-notifications`
**Last Updated:** June 20, 2026

---

## 1. Goals & Objectives

The goal of Phase 16 is to close the asynchronous research feedback loop. Because search discovery sessions execute offline inside GitHub Actions and require 2–5 minutes to complete, users close the dashboard. Without active re-engagement, users will not return to view recommendations.

### Core Objectives:
- **Asynchronous User Re-engagement:** Alert students via transactional email when a background search session completes and finds high-quality recommendations.
- **Batched Summary Digests:** Send exactly **one** aggregated summary email per session containing the top matches (score $\ge 75$) to avoid spamming the user.
- **User Preference Sovereignty:** Provide a database-driven opt-in/opt-out toggle for notifications, fully editable from the student's profile/settings interface.
- **Zero-Cost Operation ($0):** Leverage free-tier SMTP/HTTP email services (e.g. Resend) and serverless database webhooks to remain within our strict zero-budget infrastructure constraint.

---

## 2. System Architecture & Trigger Flow

We utilize an **Event-Driven Database Webhook** model to decouple the email dispatch from the GitHub Actions execution environment. This ensures that the GHA runner is only responsible for crawler/matching logic, while the Next.js API layer handles secure template rendering and API delivery.

### System Diagram

```
 [ GitHub Actions Worker ]
            │ 
            ▼ (Updates session state to 'completed')
     [ Supabase DB ]
            │ (Trigger fires AFTER UPDATE of status)
            ▼
 [ Supabase DB Webhook ]
            │ (Secure POST payload with JWT or Secret Token)
            ▼
 [ Next.js API Webhook Handler ]  -- (Route: `/api/webhooks/session-completed`)
            │
            ├─► 1. Verifies Webhook authorization secret header.
            ├─► 2. Checks `profiles.email_notifications_enabled` preference.
            ├─► 3. Queries session matches where `semantic_score` >= threshold.
            ├─► 4. Compiles HTML email template using NextJS SSR.
            ▼
      [ Resend API ]
            │ 
            ▼ (Sends Email)
   [ Student's Inbox ]
```

### Step-by-Step Data Flow

1. **Worker Completion:** The GitHub Actions runner finishes executing `src/scripts/run-worker.ts` and updates `search_sessions.status = 'completed'` in Supabase.
2. **Database Trigger:** A PostgreSQL trigger detects that a session status was updated to `completed`. It triggers a native Supabase **Database Webhook**.
3. **HTTP POST Dispatch:** The Database Webhook performs a POST request to `/api/webhooks/session-completed` with a payload containing the `session_id` and `profile_id`.
4. **Endpoint Authorization:** The Next.js API handler verifies the `Webhook-Secret` token injected into the request header to prevent unauthorized trigger spamming.
5. **Preference Filtration:** The handler queries the user's profile to verify that `email_notifications_enabled` is true. If false, the process terminates immediately with an HTTP 200.
6. **Match Gathering:** The handler queries the `matches` table joined with the `internships` table for the target `session_id`, filtering for `semantic_score >= 75` and sorting by score descending.
7. **Compilation:** The handler formats the list into a premium, responsive HTML template.
8. **Delivery:** The handler calls the Resend API to deliver the email.

---

## 3. Database Impact & Migrations

We introduce a notification preference column to the `profiles` table to track opt-in/opt-out status.

### Migration SQL: `20260620000000_profile_notification_settings.sql`

```sql
-- Add notification preferences to profiles table
ALTER TABLE profiles 
ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN notification_threshold INTEGER NOT NULL DEFAULT 75;

-- Add check constraint for threshold boundary safety
ALTER TABLE profiles
ADD CONSTRAINT chk_notification_threshold CHECK (notification_threshold BETWEEN 0 AND 100);

-- Enable RLS permissions on the new columns implicitly (handled by existing SELECT / UPDATE policies)
```

### Index Optimization
No new indexes are required on `matches` or `profiles` because the query uses the existing composite index `idx_matches_session_profile` built in Phase 14.

---

## 4. Backend Architecture

A new `notifications` feature module will be created under `src/features/notifications`.

### Component Structure:
- `src/features/notifications/services/NotificationService.ts`: Core service to query match metadata and trigger email requests.
- `src/features/notifications/components/NotificationEmailTemplate.tsx`: Server-side React component that renders the email layout.
- `src/app/api/webhooks/session-completed/route.ts`: API route handling the Supabase DB Webhook POST request.

### `NotificationService` API Interface:
```typescript
interface NotificationService {
  /**
   * Queries matches, validates user preferences, renders email, and calls Resend API.
   */
  sendSessionSummaryEmail(sessionId: string, profileId: string): Promise<{ success: boolean; message: string }>;
}
```

### Webhook Verification & Security:
To secure the endpoint against external DDOS or fake alert triggers, the webhook API route compares a custom header key against an environment secret:
```typescript
const secret = process.env.SUPABASE_WEBHOOK_SECRET;
const receivedHeader = request.headers.get("x-webhook-secret");
if (receivedHeader !== secret) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## 5. Frontend Architecture

The user interface will be updated to expose email settings.

### Profile Settings Page Expansion
- **Component:** `src/features/onboarding/components/ProfileReview.tsx` or a new standalone settings view.
- **Controls:** A simple, premium toggler (`email_notifications_enabled`) and a slider for `notification_threshold` (ranging from 50 to 90).
- **Styling:** CSS Module rules with glassmorphism layout, smooth hover states, and optimistic UI toggle updates.
- **Persistence:** Integrates with the existing `ProfileService` to perform PATCH requests.

---

## 6. Cost Considerations

Our zero-cost ($0) architecture relies on the following tiers:
- **Resend Free Tier:** Includes **3,000 emails/month** (capped at 100 emails/day, single sending domain).
- **Beta Volumetrics:**
  - 50 active beta users.
  - Assuming an average of 4 discovery runs per user per month.
  - Total emails sent: $50 \times 4 = 200$ emails/month.
  - This utilizes **6.6%** of Resend's free tier capacity, leaving a massive buffer.
- **Verification Domain:** During early staging, Resend allows sending exclusively to the owner's email address unless a custom domain is verified. A custom domain (e.g. `alerts.internshipfinder.tech`) should be added to the DNS register (TXT and MX records) to support universal sending.

---

## 7. Failure Modes & Resilience

| Failure Mode | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Resend API Key Quota Limit Hit** | Emails fail to send. | Service catches the API 429 response, logs it, and falls back gracefully. No system crash. |
| **GHA Runner crashes before updating status** | No notification trigger. | Add retry steps in GHA yaml workflow. If run fails completely, status is marked `failed` in DB (trigger does not fire summary notification). |
| **Student has 0 matches above threshold** | Empty summary email risk. | Service counts matches first. If `matchCount === 0`, it sends a friendly "No new matches found in this wave, try expanding your project descriptions!" or skips the email entirely based on user settings. |
| **Invalid/Fake Webhook Trigger** | Unauthorized spam/API abuse. | Strict header comparison against `SUPABASE_WEBHOOK_SECRET` environment variables. |

---

## 8. Scalability Analysis

The DB Webhook approach scales naturally:
- **Concurrency:** If multiple runs finish simultaneously, Supabase triggers the webhook asynchronously. Vercel routes handle this concurrently.
- **Cold Starts:** Webhook invocation will not hit cold-start limits because Next.js route handlers spin up quickly ($<500$ms).
- **Db Connection Pool:** The Next.js API uses Supabase SSR pooling configurations which handle hundreds of requests effortlessly.

---

## 9. Implementation Roadmap

### Phase 16.1: Database Migration & User Settings
1. Create and apply the Supabase migration file `20260620000000_profile_notification_settings.sql`.
2. Update the `profiles` type interface in `src/lib/supabase/types.ts` to include `email_notifications_enabled` and `notification_threshold`.
3. Add form elements (toggles and range inputs) in the Onboarding Profile Review step or settings panel, wired to update the user's database profile.

### Phase 16.2: Email Template Rendering
1. Install `@react-email/components` if allowed, or design a clean HTML utility string generator in `src/features/notifications/templates/EmailSummary.ts`.
2. Style the template using responsive table-based layouts to ensure rendering consistency across mobile/desktop email clients (Gmail, Outlook).

### Phase 16.3: Webhook Endpoint Setup
1. Create Next.js API Route `src/app/api/webhooks/session-completed/route.ts`.
2. Implement header validation checking `x-webhook-secret`.
3. Implement `NotificationService.ts` to fetch high-scoring matches and trigger Resend API calls.

### Phase 16.4: Supabase Webhook Wiring
1. Connect to local Supabase CLI or panel.
2. Register the Database Webhook:
   - **Event:** `UPDATE` of table `search_sessions`
   - **Condition:** `OLD.status != 'completed' AND NEW.status = 'completed'`
   - **Action:** POST to `https://<YOUR_DEPLOYED_URL>/api/webhooks/session-completed` with secret headers.
