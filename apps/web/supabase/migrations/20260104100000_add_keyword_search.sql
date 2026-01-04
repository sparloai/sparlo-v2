-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create documentation table for keyword search
CREATE TABLE IF NOT EXISTS public.help_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  section TEXT, -- e.g., 'getting-started', 'features', 'api'
  -- Full-text search vectors with weights
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(section, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS help_docs_search_idx ON public.help_docs USING GIN (search_vector);

-- Create trigram indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS help_docs_title_trgm_idx ON public.help_docs USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS help_docs_content_trgm_idx ON public.help_docs USING GIN (content gin_trgm_ops);

-- RLS policies - docs are public read
ALTER TABLE public.help_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Help docs are publicly readable"
  ON public.help_docs FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage help docs"
  ON public.help_docs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Keyword search function with ranking
CREATE OR REPLACE FUNCTION public.search_help_docs(
  search_query TEXT,
  match_count INTEGER DEFAULT 5,
  fuzzy_threshold REAL DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  content TEXT,
  section TEXT,
  rank REAL,
  similarity REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query_tsquery tsquery;
BEGIN
  -- Convert search query to tsquery with prefix matching
  query_tsquery := plainto_tsquery('english', search_query);

  RETURN QUERY
  SELECT
    d.id,
    d.slug,
    d.title,
    d.content,
    d.section,
    -- Combine full-text rank with trigram similarity
    (
      ts_rank(d.search_vector, query_tsquery) * 2 +
      GREATEST(
        similarity(d.title, search_query),
        similarity(d.content, search_query) * 0.5
      )
    )::REAL AS rank,
    GREATEST(
      similarity(d.title, search_query),
      similarity(d.content, search_query)
    )::REAL AS similarity
  FROM public.help_docs d
  WHERE
    -- Full-text match OR fuzzy trigram match
    d.search_vector @@ query_tsquery
    OR similarity(d.title, search_query) > fuzzy_threshold
    OR similarity(d.content, search_query) > fuzzy_threshold
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_help_docs TO authenticated, anon;
