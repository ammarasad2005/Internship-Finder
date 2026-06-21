-- 20260621000000_api_grants.sql

-- Ensure API roles can access the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 1. Service Role (Backend Worker)
-- Requires full access to all tables for background processing, caching, and inserts
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2. Authenticated Role (Logged-in Users)
-- Least privilege table-level grants mapped directly to existing RLS policies

-- Profile & Onboarding (Requires Write)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_projects TO authenticated;

-- Session Management (User triggers searches)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_sessions TO authenticated;

-- User Feedback (User can save/reject/apply to matches)
GRANT SELECT, UPDATE ON public.matches TO authenticated;

-- Read-Only Progress & Analytics
GRANT SELECT ON public.research_session_events TO authenticated;
GRANT SELECT ON public.research_runs TO authenticated;
GRANT SELECT ON public.research_usage_logs TO authenticated;

-- 3. Global Public/Authenticated Read-Only
-- Internships and their sources
GRANT SELECT ON public.internships TO authenticated, anon;
GRANT SELECT ON public.internship_sources TO authenticated, anon;

-- 4. No API Access
-- ai_cache is completely omitted, restricting it securely to the service_role only.
