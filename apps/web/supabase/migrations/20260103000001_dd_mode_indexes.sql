-- DD Mode v2: JSONB Indexes for sparlo_reports

CREATE INDEX IF NOT EXISTS idx_sparlo_reports_version
  ON public.sparlo_reports ((report_data->>'version'));

CREATE INDEX IF NOT EXISTS idx_sparlo_reports_mode
  ON public.sparlo_reports ((report_data->>'mode'));

CREATE INDEX IF NOT EXISTS idx_sparlo_reports_mode_version
  ON public.sparlo_reports ((report_data->>'mode'), (report_data->>'version'));
