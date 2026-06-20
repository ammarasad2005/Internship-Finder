# Phase 18 Architecture: Production Bootstrap & First Real Run

## 1. Candidate Comparison Matrix

| Candidate Phase | User Value | Engineering Effort | Cost / Risk | Fit with 30-50 User Target | Recommendation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Production Bootstrap & First Real Run** | **Critical** (Ensures the platform actually works) | Medium | High (Flushes out live rate-limits) | **Perfect** (Crucial before alpha) | **RECOMMENDED** |
| UI Polish & Glassmorphism | High (First impression) | High | Low | Good | Ranked #2 (Execute after stability is proven) |
| Recommendation Quality Refinements | Medium (Already mature via Phase 17) | Medium | Low | Good | Deferred (Need real data first) |
| Operational Tooling | Low | Low | Low | Poor | Deferred |
| Analytics Dashboard | Low | High | Low | Poor | Deferred |
| Admin Operations | Low | Medium | Low | Poor | Deferred |

## 2. Recommended Phase 18
**Production Bootstrap & First Real Run**

## 3. Justification
Over 17 complex architectural phases, we have built a sophisticated pipeline involving Next.js App Router, Supabase PostgreSQL, GitHub Actions, Google Custom Search API, Gemini multimodal inference, Node.js background workers, SMTP email dispatches, and real-time database webhooks. 

However, this intricate machine has never been tested end-to-end against the real internet with a live user profile.

Before investing heavy engineering effort into a premium Glassmorphism UI (Ranked #2) or Admin Operations, we must execute a "First Real Run". This phase will validate our `$0` operational budget hypothesis, flush out unexpected Google CSE DOM structure changes, test the webhook idempotency, and ensure GitHub Actions correctly executes the background pipeline. Premature UI polishing is meaningless if the underlying pipeline crashes on real-world data.

## 4. Architecture Overview (Bootstrap Strategy)
This phase focuses entirely on configuring the production environment, deploying the code, and triggering a live, end-to-end session.

1. **Environment Configuration:**
   - Deploy Supabase (apply `initial_schema.sql` to a live instance).
   - Configure Vercel (link GitHub repo, set Vercel environment variables).
   - Configure GitHub Actions (set repository secrets for Supabase Service Role, Google CSE, Gemini).
2. **Webhook & SMTP Wiring:**
   - Create the Supabase Database Webhook to point to the Vercel production URL (`https://<domain>/api/webhooks/session-completed`).
   - Validate Gmail App Passwords and SMTP connection.
3. **Execution & Monitoring:**
   - Create a test student profile (e.g., "React/Node.js Developer looking for remote internships").
   - Click "Start Search".
   - Monitor the Next.js API dispatch -> GitHub Action execution.
   - Monitor the GitHub Action logs for `DomainExpansion`, `QueryGeneration`, Google CSE scraping, and `MatchEngine` scoring.
   - Verify the SMTP email lands in the inbox.

## 5. Required Database Changes
- **None.** The database schema is locked and mature following Phase 17.
- *Requirement:* The `initial_schema.sql` must be successfully executed on the production Supabase instance.

## 6. Security Considerations
- **Secret Propagation:** Strict adherence to secret boundaries. Vercel only gets the Supabase Anon key and GitHub PAT. GitHub Actions gets the Service Role key and AI API keys. Supabase gets the Webhook secret.
- **Row Level Security:** RLS policies must be verified to allow the user to read their own matches but prevent cross-tenant reads.

## 7. Scalability Considerations
- **API Quotas:** This first run will provide the baseline token usage for Gemini and the query count for Google CSE. We will use this data to calculate the exact cost per user to validate the 30-50 user target.
- **Worker Duration:** We will measure exactly how many minutes the GitHub Action runner takes to complete a session, ensuring it sits well within the 6-hour limit.

## 8. Risks and Mitigations
- **Risk:** Google CSE returns empty or heavily obfuscated job board DOMs, breaking the deterministic extraction logic.
  - **Mitigation:** The pipeline relies on multiple providers and canonicalization. If extraction fails, we document the DOM structures for a future Phase 19 fix.
- **Risk:** GitHub Actions rejects the repository dispatch due to PAT permissions.
  - **Mitigation:** Double-check fine-grained PAT scopes (`contents: write` or `actions: write`) before deployment.
- **Risk:** Supabase Webhook times out calling Vercel Serverless Functions.
  - **Mitigation:** The Next.js endpoint responds immediately with `202 Accepted` after verifying the secret, processing idempotency in the background to avoid Supabase timeout limits.

## 9. Implementation Roadmap
1. Provision Supabase production project and apply schema.
2. Provision Vercel project and deploy Next.js code.
3. Set GitHub Actions secrets.
4. Manually trigger the first session from the Vercel production UI.
5. Record telemetry (execution time, API quotas, error logs).
6. Verify email receipt and UI match rendering.
7. Compile a "First Run Post-Mortem" report.

## 10. Success Criteria
- The GitHub Action worker successfully runs from start to finish without crashing.
- Live internships are scraped, extracted, deduplicated, and inserted into the production database.
- The `MatchEngine` correctly scores the internships against the user profile.
- The webhook successfully triggers the Nodemailer email delivery.
- The user can view their matches in the production UI.
