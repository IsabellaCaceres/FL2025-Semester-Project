-- Create set_updated_at function for automatic timestamp updates
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Books table ----------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null unique,
  title text not null,
  author text,
  filename text,
  filesize bigint,
  metadata jsonb not null default '{}'::jsonb,
  subjects text[],
  description text,
  language text,
  storage_path text,
  cover_image text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists books_content_hash_idx on public.books (content_hash);
create index if not exists books_title_idx on public.books (title);
create index if not exists books_author_idx on public.books (author);

-- Enable updated_at trigger for books table
create trigger trg_books_set_updated_at
before update on public.books
for each row
execute function public.set_updated_at();

-- User books table (links users to their library) ----------------------------
create table if not exists public.user_books (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  available_on_device boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_books_unique unique (user_id, book_id)
);

create index if not exists user_books_user_idx on public.user_books (user_id);
create index if not exists user_books_book_idx on public.user_books (book_id);

-- Reading progress table -----------------------------------------------------
create table if not exists public.reading_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  percent_complete numeric(5,2),
  last_location text,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reading_progress_unique unique (user_id, book_id)
);

create index if not exists reading_progress_user_idx on public.reading_progress (user_id, book_id);

create trigger trg_reading_progress_set_updated_at
before update on public.reading_progress
for each row
execute function public.set_updated_at();

-- Lists table -----------------------------------------------------------------
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists lists_user_idx on public.lists (user_id, updated_at desc);

create trigger trg_lists_set_updated_at
before update on public.lists
for each row
execute function public.set_updated_at();

-- List items table -----------------------------------------------------------
create table if not exists public.list_items (
  list_id uuid not null references public.lists (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint list_items_unique unique (list_id, book_id)
);

create index if not exists list_items_list_idx on public.list_items (list_id, position);
create index if not exists list_items_book_idx on public.list_items (book_id);

-- Web sessions table ---------------------------------------------------------
create table if not exists public.web_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists web_sessions_user_idx on public.web_sessions (user_id);

