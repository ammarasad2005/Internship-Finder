-- Define ENUMs
CREATE TYPE public.search_session_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE public.remote_preference_type AS ENUM ('remote', 'hybrid', 'onsite', 'no_preference');
CREATE TYPE public.source_type_enum AS ENUM ('official_career_page', 'job_board', 'linkedin', 'other');
CREATE TYPE public.cache_type_enum AS ENUM ('domain_expansion', 'resume_parse', 'skill_extraction', 'other');
CREATE TYPE public.user_feedback_type AS ENUM ('applied', 'rejected', 'saved');

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    location_preference TEXT,
    remote_preference public.remote_preference_type,
    duration_preference TEXT,
    paid_preference BOOLEAN,
    confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 2. profile_skills
CREATE TABLE public.profile_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. profile_projects
CREATE TABLE public.profile_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    description TEXT,
    technologies TEXT[],
    project_url TEXT,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. search_sessions
CREATE TABLE public.search_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.search_session_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- 5. research_session_events
CREATE TABLE public.research_session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. research_runs
CREATE TABLE public.research_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    query_used TEXT NOT NULL,
    search_provider TEXT NOT NULL,
    depth_level INTEGER NOT NULL CHECK (depth_level >= 0),
    results_found INTEGER NOT NULL DEFAULT 0 CHECK (results_found >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. internships
CREATE TABLE public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_key TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    location TEXT,
    description TEXT,
    application_url TEXT,
    tags TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_internships_updated_at
BEFORE UPDATE ON public.internships
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 8. internship_sources
CREATE TABLE public.internship_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    source_type public.source_type_enum NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (internship_id, source_url)
);

-- 9. matches
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    semantic_score INTEGER CHECK (semantic_score >= 0 AND semantic_score <= 100),
    explanation TEXT,
    user_feedback public.user_feedback_type,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (profile_id, internship_id, session_id)
);

-- 10. ai_cache
CREATE TABLE public.ai_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    cache_type public.cache_type_enum NOT NULL,
    output_value JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. research_usage_logs
CREATE TABLE public.research_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id UUID NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    tokens_used INTEGER CHECK (tokens_used >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profile_skills_profile_id ON public.profile_skills(profile_id);
CREATE INDEX idx_profile_projects_profile_id ON public.profile_projects(profile_id);
CREATE INDEX idx_search_sessions_profile_id ON public.search_sessions(profile_id);
CREATE INDEX idx_search_sessions_status ON public.search_sessions(status);
CREATE INDEX idx_research_session_events_session_id ON public.research_session_events(session_id);
CREATE INDEX idx_research_session_events_created_at ON public.research_session_events(created_at);
CREATE INDEX idx_research_runs_session_id ON public.research_runs(session_id);
CREATE INDEX idx_internships_is_active ON public.internships(is_active);
CREATE INDEX idx_internships_tags ON public.internships USING GIN (tags);
CREATE INDEX idx_internship_sources_internship_id ON public.internship_sources(internship_id);
CREATE INDEX idx_matches_profile_id ON public.matches(profile_id);
CREATE INDEX idx_matches_internship_id ON public.matches(internship_id);
CREATE INDEX idx_matches_session_id ON public.matches(session_id);
CREATE INDEX idx_ai_cache_cache_type ON public.ai_cache(cache_type);
CREATE INDEX idx_research_usage_logs_profile_id ON public.research_usage_logs(profile_id);
CREATE INDEX idx_research_usage_logs_created_at ON public.research_usage_logs(created_at);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: User can see and update their own profile.
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Profile Skills
CREATE POLICY "Users can manage own skills" ON public.profile_skills FOR ALL USING (auth.uid() = profile_id);

-- Profile Projects
CREATE POLICY "Users can manage own projects" ON public.profile_projects FOR ALL USING (auth.uid() = profile_id);

-- Search Sessions
CREATE POLICY "Users can manage own sessions" ON public.search_sessions FOR ALL USING (auth.uid() = profile_id);

-- Research Session Events
CREATE POLICY "Users can view own session events" ON public.research_session_events FOR SELECT USING (
    session_id IN (SELECT id FROM public.search_sessions WHERE profile_id = auth.uid())
);

-- Research Runs
CREATE POLICY "Users can view own runs" ON public.research_runs FOR SELECT USING (
    session_id IN (SELECT id FROM public.search_sessions WHERE profile_id = auth.uid())
);

-- Internships (Read-only for all users, Service Role bypasses this for write)
CREATE POLICY "Anyone can view active internships" ON public.internships FOR SELECT USING (is_active = true);

-- Internship Sources
CREATE POLICY "Anyone can view internship sources" ON public.internship_sources FOR SELECT USING (true);

-- Matches
CREATE POLICY "Users can view own matches" ON public.matches FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can update own matches" ON public.matches FOR UPDATE USING (auth.uid() = profile_id);

-- AI Cache (No access to public, only service role)
-- No policies created implies default deny for authenticated/anon users.

-- Research Usage Logs
CREATE POLICY "Users can view own usage logs" ON public.research_usage_logs FOR SELECT USING (auth.uid() = profile_id);
