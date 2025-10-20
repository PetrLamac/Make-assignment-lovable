-- Create analyses table to store extracted error information
CREATE TABLE public.image_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  
  -- Error information
  error_title TEXT NOT NULL,
  error_code TEXT,
  product TEXT,
  environment JSONB,
  
  -- Text blocks with coordinates
  key_text_blocks JSONB,
  
  -- Classification
  probable_cause TEXT NOT NULL,
  suggested_fix TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Follow-up questions
  follow_up_questions TEXT[],
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'failed')),
  failure_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  image_filename TEXT,
  image_size_bytes INTEGER,
  
  -- Optional: track API requester for analytics
  requester_ip TEXT,
  user_agent TEXT
);

-- Index for quick lookups by analysis_id
CREATE INDEX idx_image_analyses_analysis_id ON public.image_analyses(analysis_id);

-- Index for filtering by status and created_at
CREATE INDEX idx_image_analyses_status_created ON public.image_analyses(status, created_at DESC);

-- Index for filtering by severity
CREATE INDEX idx_image_analyses_severity ON public.image_analyses(severity);

-- Enable Row Level Security
ALTER TABLE public.image_analyses ENABLE ROW LEVEL SECURITY;

-- Public read policy (since this is a public API for Make.com integrations)
CREATE POLICY "Anyone can view analyses" ON public.image_analyses
  FOR SELECT
  USING (true);

-- Public insert policy (since this is a public API)
CREATE POLICY "Anyone can create analyses" ON public.image_analyses
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.image_analyses IS 'Stores extracted error information from analyzed images. No images are stored, only extracted metadata.';