-- Rename triz_reports table to sparlo_reports
alter table public.triz_reports rename to sparlo_reports;

-- Update the foreign key constraint name (optional but cleaner)
alter table public.sparlo_reports
  rename constraint triz_reports_pkey to sparlo_reports_pkey;

alter table public.sparlo_reports
  rename constraint triz_reports_account_id_fkey to sparlo_reports_account_id_fkey;

-- Update index names
alter index if exists triz_reports_archived_idx rename to sparlo_reports_archived_idx;
alter index if exists triz_reports_account_id_idx rename to sparlo_reports_account_id_idx;
alter index if exists triz_reports_conversation_id_idx rename to sparlo_reports_conversation_id_idx;
