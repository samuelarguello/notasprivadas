create table if not exists public.notes (
  id text primary key,
  encrypted_note text not null,
  iv text not null,
  salt text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  read_at timestamptz
);

create index if not exists notes_expires_at_idx on public.notes (expires_at);

alter table public.notes enable row level security;

-- No policies needed: the browser never talks directly to Supabase.
-- Next.js API uses SUPABASE_SERVICE_ROLE_KEY on the server only.
