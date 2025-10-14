-- Extend books metadata and prepare storage for EPUB assets
alter table public.books
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists subjects text[] not null default '{}'::text[],
  add column if not exists description text,
  add column if not exists language text,
  add column if not exists storage_path text,
  add column if not exists cover_image text;

create index if not exists books_subjects_idx
  on public.books using gin (subjects);

-- Ensure default values for rows that existed before the migration
update public.books
set metadata = coalesce(metadata, '{}'::jsonb),
    subjects = coalesce(subjects, '{}'::text[])
where metadata is null
   or subjects is null;

-- Provision a dedicated storage bucket for EPUB payloads
insert into storage.buckets (id, name, public)
values ('epubs', 'epubs', false)
on conflict (id) do nothing;
