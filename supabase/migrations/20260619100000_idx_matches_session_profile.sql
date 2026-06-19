-- Composite B-Tree index on (session_id, profile_id) for performant match page queries.
-- The matches page always queries: WHERE session_id = $1 AND profile_id = $2 ORDER BY semantic_score DESC
CREATE INDEX IF NOT EXISTS idx_matches_session_profile
ON public.matches(session_id, profile_id);
