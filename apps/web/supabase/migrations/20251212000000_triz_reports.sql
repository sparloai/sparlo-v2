-- Create triz_reports table for storing Sparlo reports
create table if not exists public.triz_reports (
  id uuid primary key default extensions.uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  conversation_id text not null,
  title text not null,
  status text not null default 'processing' check (status in ('clarifying', 'processing', 'complete', 'error', 'confirm_rerun')),
  report_data jsonb,
  messages jsonb default '[]'::jsonb,
  last_message text,
  current_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for faster lookups
create index if not exists triz_reports_account_id_idx on public.triz_reports(account_id);
create index if not exists triz_reports_conversation_id_idx on public.triz_reports(conversation_id);
create index if not exists triz_reports_status_idx on public.triz_reports(status);

-- Enable RLS
alter table public.triz_reports enable row level security;

-- RLS Policy: Users can only access their own reports (via account_id = auth.uid())
create policy "Users can view their own reports"
  on public.triz_reports
  for select
  using (account_id = auth.uid());

create policy "Users can insert their own reports"
  on public.triz_reports
  for insert
  with check (account_id = auth.uid());

create policy "Users can update their own reports"
  on public.triz_reports
  for update
  using (account_id = auth.uid());

create policy "Users can delete their own reports"
  on public.triz_reports
  for delete
  using (account_id = auth.uid());

-- Create function to update updated_at timestamp
create or replace function public.update_triz_reports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for auto-updating updated_at
create trigger update_triz_reports_updated_at
  before update on public.triz_reports
  for each row
  execute function public.update_triz_reports_updated_at();

-- Function to count completed reports for a user
create or replace function public.count_completed_reports(user_id uuid)
returns integer as $$
  select count(*)::integer
  from public.triz_reports
  where account_id = user_id and status = 'complete';
$$ language sql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.count_completed_reports(uuid) to authenticated;
