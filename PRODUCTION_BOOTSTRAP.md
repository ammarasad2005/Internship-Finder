# Production Bootstrap Guide

This document contains the exact steps and secrets required to deploy the Internship Finder platform into a production environment for the first time.

## 1. Supabase Setup
The database schema is fully mature. To provision the production database:
1. Create a new Supabase project.
2. Link the Supabase CLI to your project: `npx supabase link --project-ref <your-project-id>`
3. Push all migrations sequentially: `npx supabase db push`
   *This will apply `initial_schema.sql` and all subsequent index/notification migrations.*
4. **Webhook Setup:**
   - In the Supabase Dashboard, navigate to Database -> Webhooks.
   - Create a new Webhook named `session_completed_notifier`.
   - **Table:** `search_sessions`
   - **Events:** `UPDATE`
   - **Condition:** `old_record.status != 'completed' AND new_record.status = 'completed'`
   - **Method:** `POST`
   - **URL:** `https://<YOUR_VERCEL_DOMAIN>/api/webhooks/session-completed`
   - **HTTP Headers:** Add `x-webhook-secret` with a randomly generated high-entropy string. Save this string; you will need it for Vercel.

## 2. Vercel Configuration (Next.js Edge)
1. Import the GitHub repository into Vercel.
2. Set the following Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: (From Supabase -> Settings -> API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (From Supabase -> Settings -> API)
   - `GITHUB_OWNER`: Your GitHub username or organization (e.g., `ammarasad2005`)
   - `GITHUB_REPO`: The repository name (e.g., `Internship-Finder`)
   - `GITHUB_PAT`: A GitHub Personal Access Token with `actions:write` or `contents:write` scope (Required to dispatch the worker).
   - `SUPABASE_WEBHOOK_SECRET`: The exact secret string you created in the Supabase Webhook.
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `465`
   - `SMTP_USER`: Your dedicated notification Gmail address.
   - `SMTP_PASS`: Your 16-character Gmail App Password.
3. Deploy the application.

## 3. GitHub Actions Configuration (Worker Node)
The background worker executes entirely within GitHub Actions to bypass Vercel serverless timeouts and provide a free, 6-hour execution window.
1. Navigate to your GitHub Repository -> Settings -> Secrets and variables -> Actions.
2. Add the following **Repository Secrets**:
   - `NEXT_PUBLIC_SUPABASE_URL`: (Same as Vercel)
   - `SUPABASE_SERVICE_ROLE_KEY`: (From Supabase -> Settings -> API). *CRITICAL: This allows the worker to bypass RLS and perform admin-level deduplication.*
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `GOOGLE_CSE_API_KEY`: Your Google Custom Search API Key.
   - `GOOGLE_CSE_ENGINE_ID`: Your Google Custom Search Engine ID (must be configured to search the entire web or specific ATS domains).

## 4. Google Custom Search Engine (CSE) Configuration
1. Go to programmable searchengine.google.com.
2. Create an engine.
3. In "Search features" -> "Search the entire web", turn it ON.
4. (Optional but recommended) Add ATS domains to the "Sites to search" list to prioritize structured job boards (e.g., `greenhouse.io`, `lever.co`, `workday.com`).

## 5. Gmail SMTP Configuration
1. Log into the Google Account associated with the `SMTP_USER`.
2. Enable 2-Step Verification.
3. Navigate to App Passwords and generate a new password for "Internship Finder Mailer".
4. Copy the 16-character code into the Vercel `SMTP_PASS` variable.

## 6. Pre-Flight Verification
- Verify `npx tsc --noEmit` runs locally with 0 errors.
- Verify GitHub Actions is enabled in the repository (sometimes disabled by default on forks).
- Verify the Vercel deployment URL matches the Supabase Webhook URL exactly.
