create table talent_trees (
  spec_slug text primary key,
  status text not null default 'pending',
  data jsonb,
  icon_queue jsonb,
  icons jsonb,
  updated_at timestamptz not null default now()
);

alter table talent_trees enable row level security;
