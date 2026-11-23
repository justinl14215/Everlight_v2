create table if not exists public.everlight_campaign (
  id text primary key default 'main',
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.everlight_campaign enable row level security;
revoke all on public.everlight_campaign from anon, authenticated;
insert into public.everlight_campaign (id, state) values ('main', '{}'::jsonb) on conflict (id) do nothing;
