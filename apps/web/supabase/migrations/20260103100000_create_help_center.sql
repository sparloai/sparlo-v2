-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Documentation embeddings for RAG
CREATE TABLE docs_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) <= 10000),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  embedding vector(1024),  -- voyage-3-lite dimension
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(slug, chunk_index)
);

-- Index for vector similarity search (cosine distance)
CREATE INDEX idx_docs_embedding ON docs_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for slug lookups
CREATE INDEX idx_docs_slug ON docs_embeddings(slug);

-- Chat Feedback (for learning/improving responses)
CREATE TABLE chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  message_content TEXT NOT NULL CHECK (char_length(message_content) <= 10000),
  response_content TEXT NOT NULL CHECK (char_length(response_content) <= 50000),
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment TEXT CHECK (char_length(comment) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ  -- Soft delete support
);

-- Enable RLS
ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT
CREATE POLICY "Users can view own feedback"
  ON chat_feedback FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- RLS Policies: INSERT with rate limiting
CREATE POLICY "Users can submit feedback (rate limited)"
  ON chat_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (
      SELECT COUNT(*)
      FROM chat_feedback
      WHERE user_id = auth.uid()
      AND created_at > NOW() - INTERVAL '1 minute'
    ) < 5
  );

-- RLS Policies: UPDATE (prevent updates - feedback is immutable)
CREATE POLICY "Prevent feedback updates"
  ON chat_feedback FOR UPDATE
  USING (false);

-- RLS Policies: DELETE (soft delete only)
CREATE POLICY "Users can delete own feedback"
  ON chat_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_feedback_user_id ON chat_feedback(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_feedback_rating_created ON chat_feedback(rating, created_at DESC);
CREATE INDEX idx_feedback_created_desc ON chat_feedback(created_at DESC);

-- Unique constraint to prevent duplicate feedback
CREATE UNIQUE INDEX idx_unique_feedback
  ON chat_feedback(user_id, md5(message_content), md5(response_content))
  WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_feedback_updated_at
  BEFORE UPDATE ON chat_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function for semantic search using pgvector
CREATE OR REPLACE FUNCTION search_docs(
  query_embedding vector(1024),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    docs_embeddings.id,
    docs_embeddings.slug,
    docs_embeddings.title,
    docs_embeddings.content,
    1 - (docs_embeddings.embedding <=> query_embedding) AS similarity
  FROM docs_embeddings
  WHERE 1 - (docs_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY docs_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
