-- Enable required extensions -------------------------------------------------
create extension if not exists "pgcrypto";

-- Enum definitions -----------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'group_visibility') then
    create type group_visibility as enum ('public', 'private');
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'group_member_role') then
    create type group_member_role as enum ('owner', 'moderator', 'member');
  end if;
end;
$$;

-- Helper function to keep updated_at in sync ---------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Books ----------------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null unique,
  title text,
  author text,
  filename text,
  filesize bigint,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_books_set_updated_at
before update on public.books
for each row
execute function public.set_updated_at();

-- User books -----------------------------------------------------------------
create table if not exists public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  available_on_device boolean not null default false,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_books_unique_user_book unique (user_id, book_id)
);

create index if not exists user_books_user_idx on public.user_books (user_id);
create index if not exists user_books_book_idx on public.user_books (book_id);

create trigger trg_user_books_set_updated_at
before update on public.user_books
for each row
execute function public.set_updated_at();

-- Reading progress -----------------------------------------------------------
create table if not exists public.reading_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  percent_complete numeric(5,2) not null default 0
    check (percent_complete >= 0 and percent_complete <= 100),
  last_location jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, book_id)
);

create index if not exists reading_progress_book_idx on public.reading_progress (book_id);

create trigger trg_reading_progress_set_updated_at
before update on public.reading_progress
for each row
execute function public.set_updated_at();

-- Lists ----------------------------------------------------------------------
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists lists_unique_name_per_user
  on public.lists (user_id, lower(name));

create trigger trg_lists_set_updated_at
before update on public.lists
for each row
execute function public.set_updated_at();

-- List items -----------------------------------------------------------------
create table if not exists public.list_items (
  list_id uuid not null references public.lists (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  position integer,
  added_by uuid references auth.users (id) on delete set null,
  added_at timestamptz not null default timezone('utc', now()),
  primary key (list_id, book_id),
  check (position is null or position >= 0)
);

create index if not exists list_items_list_idx on public.list_items (list_id);
create index if not exists list_items_book_idx on public.list_items (book_id);

-- Groups ---------------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  visibility group_visibility not null default 'public',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint positive_name_length check (char_length(name) > 0)
);

create trigger trg_groups_set_updated_at
before update on public.groups
for each row
execute function public.set_updated_at();

-- Group members --------------------------------------------------------------
create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role group_member_role not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  added_by uuid references auth.users (id) on delete set null,
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on public.group_members (user_id);
create index if not exists group_members_role_idx on public.group_members (role);

-- Ensure group owners are members --------------------------------------------
create or replace function public.ensure_group_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role, added_by)
  values (new.id, new.owner_id, 'owner', new.owner_id)
  on conflict (group_id, user_id) do update
    set role = excluded.role;
  return new;
end;
$$;

create trigger trg_groups_owner_membership
after insert on public.groups
for each row
execute function public.ensure_group_owner_membership();

-- Row level security ---------------------------------------------------------
alter table public.books enable row level security;
alter table public.user_books enable row level security;
alter table public.reading_progress enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- books policies
drop policy if exists "Public read access" on public.books;
drop policy if exists "Authenticated can insert books" on public.books;
drop policy if exists "Authenticated can update books" on public.books;

create policy "Public read access"
  on public.books
  for select
  using (true);

create policy "Authenticated can insert books"
  on public.books
  for insert
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "Authenticated can update books"
  on public.books
  for update
  using (auth.role() = 'authenticated' or auth.role() = 'service_role')
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

-- user_books policies
drop policy if exists "Users manage their user books" on public.user_books;

create policy "Users manage their user books"
  on public.user_books
  for all
  using (
    auth.role() = 'service_role'
    or auth.uid() = user_id
  )
  with check (
    auth.role() = 'service_role'
    or auth.uid() = user_id
  );

-- reading_progress policies
drop policy if exists "Users manage their reading progress" on public.reading_progress;

create policy "Users manage their reading progress"
  on public.reading_progress
  for all
  using (
    auth.role() = 'service_role'
    or auth.uid() = user_id
  )
  with check (
    auth.role() = 'service_role'
    or auth.uid() = user_id
  );

-- lists policies
drop policy if exists "Users manage their lists" on public.lists;

create policy "Users manage their lists"
  on public.lists
  for all
  using (
    auth.role() = 'service_role'
    or auth.uid() = user_id
  )
  with check (
    auth.role() = 'service_role'
    or auth.uid() = user_id
  );

-- list_items policies
drop policy if exists "Users manage their list items" on public.list_items;

create policy "Users manage their list items"
  on public.list_items
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.lists l
      where l.id = list_items.list_id
        and l.user_id = auth.uid()
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.lists l
      where l.id = list_items.list_id
        and l.user_id = auth.uid()
    )
  );

-- groups policies
drop policy if exists "Public groups visible" on public.groups;
drop policy if exists "Members see their groups" on public.groups;
drop policy if exists "Users create groups" on public.groups;
drop policy if exists "Owners manage groups" on public.groups;

create policy "Public groups visible"
  on public.groups
  for select
  using (
    visibility = 'public'
    or auth.role() = 'service_role'
  );

create policy "Members see their groups"
  on public.groups
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = groups.id
        and gm.user_id = auth.uid()
    )
  );

create policy "Users create groups"
  on public.groups
  for insert
  with check (
    auth.role() = 'service_role'
    or auth.uid() = owner_id
  );

create policy "Owners manage groups"
  on public.groups
  for update
  using (
    auth.role() = 'service_role'
    or auth.uid() = owner_id
  )
  with check (
    auth.role() = 'service_role'
    or auth.uid() = owner_id
  );

-- group_members policies
drop policy if exists "View group memberships" on public.group_members;
drop policy if exists "Join public groups" on public.group_members;
drop policy if exists "Moderate group memberships" on public.group_members;
drop policy if exists "Leave groups" on public.group_members;

create policy "View group memberships"
  on public.group_members
  for select
  using (
    auth.role() = 'service_role'
    or auth.uid() = user_id
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'moderator')
    )
  );

create policy "Join public groups"
  on public.group_members
  for insert
  with check (
    auth.role() = 'service_role'
    or (
      auth.uid() = user_id
      and exists (
        select 1
        from public.groups g
        where g.id = group_members.group_id
          and g.visibility = 'public'
      )
    )
  );

create policy "Moderate group memberships"
  on public.group_members
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'moderator')
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'moderator')
    )
  );

create policy "Leave groups"
  on public.group_members
  for delete
  using (
    auth.role() = 'service_role'
    or auth.uid() = user_id
  );
