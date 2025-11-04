-- Enable vector extension for pgvector --------------------------------------
create extension if not exists "vector";

-- Augment books table with AI metadata --------------------------------------
alter table public.books
  add column if not exists semantic_embedding vector(1536),
  add column if not exists ai_traits jsonb not null default '{}'::jsonb,
  add column if not exists ai_summary text;

-- Book embeddings ------------------------------------------------------------
create table if not exists public.book_embeddings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint book_embeddings_unique_chunk unique (book_id, chunk_index)
);

create index if not exists book_embeddings_book_idx
  on public.book_embeddings (book_id, chunk_index);

-- Vector indexes require ivfflat; configure a modest list count for our scale
create index if not exists book_embeddings_embedding_idx
  on public.book_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 8);

create trigger trg_book_embeddings_set_updated_at
before update on public.book_embeddings
for each row
execute function public.set_updated_at();

create or replace function public.match_book_chunks(
  query_embedding vector(1536),
  match_count integer default 12
)
returns table (
  book_id uuid,
  chunk_index integer,
  content text,
  similarity double precision,
  metadata jsonb
)
language sql
stable
as $$
  select
    be.book_id,
    be.chunk_index,
    be.content,
    1 - (be.embedding <=> query_embedding) as similarity,
    be.metadata
  from public.book_embeddings be
  where query_embedding is not null
  order by be.embedding <-> query_embedding
  limit greatest(1, match_count)
$$;

-- User query logs ------------------------------------------------------------
create table if not exists public.user_query_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  query text not null,
  query_embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_query_logs_user_idx
  on public.user_query_logs (user_id, created_at desc);

-- Personalized recommendations cache ----------------------------------------
create table if not exists public.personalized_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  source text not null default 'ai',
  reason text,
  score numeric(6,3),
  metadata jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint personalized_recommendations_unique unique (user_id, book_id, source)
);

create index if not exists personalized_recommendations_user_idx
  on public.personalized_recommendations (user_id, generated_at desc);

create trigger trg_personalized_recommendations_set_updated_at
before update on public.personalized_recommendations
for each row
execute function public.set_updated_at();

-- Row level security ---------------------------------------------------------
alter table public.book_embeddings enable row level security;
alter table public.user_query_logs enable row level security;
alter table public.personalized_recommendations enable row level security;

-- book_embeddings policies: locked to service role --------------------------
drop policy if exists "Service manages book embeddings" on public.book_embeddings;

create policy "Service manages book embeddings"
  on public.book_embeddings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- user_query_logs policies ---------------------------------------------------
drop policy if exists "Service manages user query logs" on public.user_query_logs;

create policy "Service manages user query logs"
  on public.user_query_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- personalized_recommendations policies -------------------------------------
drop policy if exists "Users read their recommendations" on public.personalized_recommendations;
drop policy if exists "Service manages recommendations" on public.personalized_recommendations;

create policy "Users read their recommendations"
  on public.personalized_recommendations
  for select
  using (
    auth.role() = 'service_role'
    or auth.uid() = user_id
  );

create policy "Service manages recommendations"
  on public.personalized_recommendations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

