# Phase 18 Production Deployment Runbook

This is the definitive operator's guide for bootstrapping the Internship Finder platform into a live production environment. It assumes zero prior configuration.

---

## 🛑 Hidden Prerequisites (Must complete before starting)
- **Time Estimate:** ~5 minutes
1. You must own a GitHub account and have pushed this codebase to a repository.
2. You must have an active Google Account (for Gmail, Custom Search, and Gemini).
3. You must have a free Vercel account linked to your GitHub.
4. You must have a free Supabase account linked to your GitHub.
5. You must have Node.js and the Supabase CLI installed locally (`npm install -g supabase`).

---

## Part 1: External API Provisioning
*Generate the required keys that power the AI and scraping engines.*

### 1.1 Create the Google Custom Search Engine (CSE)
- **Time Estimate:** ~3 minutes
1. Navigate to [Programmable Search Engine](https://programmablesearchengine.google.com/).
2. Click **Create a search engine**.
3. Name it "Internship Finder Crawler".
4. Under "What to search?", select **Search the entire web**.
5. Click **Create**.
6. On the success screen, copy the **Search engine ID** (`GOOGLE_CSE_ENGINE_ID`). Save this to your notes.

### 1.2 Create the Google Custom Search API Key
- **Time Estimate:** ~2 minutes
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "Internship Finder").
3. Search for "Custom Search API" in the top bar and click **Enable**.
4. Go to **APIs & Services** > **Credentials** via the left sidebar.
5. Click **+ CREATE CREDENTIALS** > **API Key**.
6. Copy the generated API key (`GOOGLE_CSE_API_KEY`). Save this to your notes.

### 1.3 Create the Gemini API Key
- **Time Estimate:** ~2 minutes
1. Navigate to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **Create API Key**.
4. Select the Google Cloud project you created in step 1.2.
5. Copy the generated API key (`GEMINI_API_KEY`). Save this to your notes.

### 1.4 Create the Gmail App Password
- **Time Estimate:** ~3 minutes
1. Navigate to your [Google Account Manage Page](https://myaccount.google.com/).
2. Go to **Security** on the left sidebar.
3. Ensure **2-Step Verification** is turned ON (this is a hard requirement for App Passwords).
4. Search for "App Passwords" in the top settings search bar.
5. Create a new app password named "Internship Finder Mailer".
6. Google will display a 16-character string. Copy this (`SMTP_PASS`). Save this to your notes. *You will never be able to see this string again.*

---

## Part 2: Database Provisioning (Supabase)
*Create the database, apply the schema, and wire the webhook.*

### 2.1 Project Initialization
- **Time Estimate:** ~5 minutes
1. Navigate to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**, select an organization, name it "Internship Finder", and generate a secure database password.
3. Wait ~2 minutes for the database to provision.
4. Go to **Project Settings** (gear icon bottom left) > **API**.
5. Under "Project URL", copy the URL (`NEXT_PUBLIC_SUPABASE_URL`). Save it.
6. Under "Project API Keys", copy the `anon` `public` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). Save it.
7. Under "Project API Keys", copy the `service_role` `secret` key (`SUPABASE_SERVICE_ROLE_KEY`). Save it.

### 2.2 Schema Migration
- **Time Estimate:** ~2 minutes
1. Open your local terminal in the root of the project.
2. Log in to the CLI: run `npx supabase login` and paste the token from your browser.
3. Link the project: run `npx supabase link --project-ref <your-project-id>`. *(Your project ID is the alphanumeric string in your Supabase dashboard URL: `supabase.com/dashboard/project/<project-id>`)*.
4. Push the schema: run `npx supabase db push`.
5. Verify in the Supabase Dashboard by clicking **Table Editor** (left sidebar). You should see `internships`, `matches`, `profiles`, etc.

### 2.3 Webhook Configuration
- **Time Estimate:** ~3 minutes
1. Generate a random 32-character string on your computer (e.g., `openssl rand -hex 16`). This is your `SUPABASE_WEBHOOK_SECRET`. Save it.
2. In the Supabase Dashboard, click **Database** (database icon left sidebar) > **Webhooks**.
3. Click **Create Webhook** > **HTTP Request**.
4. **Name:** `session_completed_notifier`
5. **Table:** Select `search_sessions`
6. **Events:** Check **Update**
7. **Method:** `POST`
8. **URL:** `https://<YOUR_VERCEL_DOMAIN_NAME>/api/webhooks/session-completed` *(Note: you will get your Vercel domain in Part 3. Use a placeholder like `https://temp.vercel.app` for now, but YOU MUST REMEMBER TO UPDATE THIS later).*
9. **HTTP Headers:** 
   - Click **Add new header**.
   - Key: `x-webhook-secret`
   - Value: `<YOUR_SUPABASE_WEBHOOK_SECRET>`
10. Click **Create webhook**.

---

## Part 3: Frontend Provisioning (Vercel)
*Deploy the Next.js UI.*

### 3.1 Project Deployment
- **Time Estimate:** ~5 minutes
1. Navigate to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. Open the **Environment Variables** accordion before clicking Deploy. Add the following:
   - `NEXT_PUBLIC_SUPABASE_URL` : Your saved URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Your saved Anon key.
   - `GITHUB_OWNER` : Your GitHub username (e.g., `octocat`).
   - `GITHUB_REPO` : Your exact repo name (e.g., `Internship-Finder`).
   - `GITHUB_PAT` : A GitHub Personal Access Token. *(To get this: GitHub > Settings > Developer Settings > Personal Access Tokens (Fine-grained) > Generate new token. Grant "Read and Write" access to "Contents" and "Actions" for this repository).*
   - `SUPABASE_WEBHOOK_SECRET` : The 32-character string you generated in 2.3.
   - `SMTP_HOST` : `smtp.gmail.com`
   - `SMTP_PORT` : `465`
   - `SMTP_USER` : Your Gmail address (e.g., `youremail@gmail.com`).
   - `SMTP_PASS` : The 16-character App Password from 1.4.
5. Click **Deploy**.
6. Wait for the build to finish. Click **Continue to Dashboard** and copy the live `Domains` URL.
7. **CRITICAL:** Go back to the Supabase Webhook (Step 2.3) and replace the placeholder URL with `https://<YOUR_LIVE_VERCEL_DOMAIN>/api/webhooks/session-completed`.

---

## Part 4: Backend Worker Provisioning (GitHub Actions)
*Configure the background scraping and matching pipeline.*

### 4.1 Repository Secrets
- **Time Estimate:** ~3 minutes
1. Navigate to your GitHub Repository.
2. Click the **Settings** tab.
3. On the left sidebar, go to **Secrets and variables** > **Actions**.
4. Under "Repository secrets", click **New repository secret** and add the following exactly as named:
   - `NEXT_PUBLIC_SUPABASE_URL` : Your saved Supabase URL.
   - `SUPABASE_SERVICE_ROLE_KEY` : Your saved Supabase Service Role key.
   - `GEMINI_API_KEY` : Your saved Gemini key from 1.3.
   - `GOOGLE_CSE_API_KEY` : Your saved CSE API key from 1.2.
   - `GOOGLE_CSE_ENGINE_ID` : Your saved CSE Engine ID from 1.1.

---

## Part 5: Execution Phase
*You are now ready to execute the `FIRST_RUN_CHECKLIST.md` and complete the deployment.*
