-- Create profiles table to extend auth.users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  updated_at timestamptz default timezone('utc', now()),
  created_at timestamptz default timezone('utc', now())
);

-- Enable Row Level Security (RLS) on profiles
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create groups table
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_public boolean default true,
  created_by uuid references auth.users(id),
  vibe_tags text[],
  image_url text,
  max_members integer default 100,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

-- Create group_members table
create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member', -- 'admin', 'member'
  joined_at timestamptz default timezone('utc', now()),
  primary key (group_id, user_id)
);

-- Create follows table
create table if not exists public.follows (
  follower_id uuid references auth.users(id) on delete cascade,
  following_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  primary key (follower_id, following_id)
);

-- Create messages table with vector support
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at timestamptz default timezone('utc', now())
);

-- Create indexes
create index if not exists messages_group_id_idx on public.messages(group_id);
create index if not exists messages_user_id_idx on public.messages(user_id);

-- Function to automatically update updated_at timestamp
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger handle_updated_at before update on public.groups
  for each row execute procedure public.set_updated_at();

-- Function to handle new user creation (automatically create profile)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

-- Trigger for new user creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC function for semantic search on messages
create or replace function match_messages(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_group_ids uuid[]
)
returns table (
  id uuid,
  content text,
  similarity float,
  group_id uuid,
  user_id uuid,
  created_at timestamptz,
  username text
)
language plpgsql
as $$
begin
  return query
  select
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) as similarity,
    m.group_id,
    m.user_id,
    m.created_at,
    p.username
  from messages m
  join profiles p on m.user_id = p.id
  where 1 - (m.embedding <=> query_embedding) > match_threshold
  and (filter_group_ids is null or m.group_id = any(filter_group_ids))
  order by m.embedding <=> query_embedding
  limit match_count;
end;
$$;
