-- Add archived column to triz_reports table
alter table public.triz_reports add column if not exists archived boolean not null default false;

-- Create index for faster archived lookups
create index if not exists triz_reports_archived_idx on public.triz_reports(archived);
