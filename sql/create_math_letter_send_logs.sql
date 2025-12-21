-- Create math_letter_send_logs table
create table if not exists public.math_letter_send_logs (
  id uuid default gen_random_uuid() primary key,
  participant_id uuid references public.event_participants(id) on delete cascade not null,
  letter_id integer references public.math_letters(id) on delete set null,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sent_by uuid references auth.users(id) on delete set null, -- Optional: link to sender
  status text default 'success',
  message_id text, -- Optional: from AlimTalk provider
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for performance
create index if not exists idx_math_letter_send_logs_participant_id on public.math_letter_send_logs(participant_id);
create index if not exists idx_math_letter_send_logs_sent_at on public.math_letter_send_logs(sent_at);

-- Enable RLS (Row Level Security)
alter table public.math_letter_send_logs enable row level security;

-- Policy: Allow read access to authenticated users (or specific roles)
create policy "Allow read access to authenticated users"
  on public.math_letter_send_logs for select
  using ( auth.role() = 'authenticated' );

-- Policy: Allow insert access to authenticated users
create policy "Allow insert access to authenticated users"
  on public.math_letter_send_logs for insert
  with check ( auth.role() = 'authenticated' );
