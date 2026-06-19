-- Descending B-Tree index on semantic_score for efficient sorted reads.
-- The matches page always orders: ORDER BY semantic_score DESC
CREATE INDEX IF NOT EXISTS idx_matches_semantic_score
ON public.matches(semantic_score DESC);
