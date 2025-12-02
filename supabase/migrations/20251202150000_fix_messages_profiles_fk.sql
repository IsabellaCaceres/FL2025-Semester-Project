alter table public.messages
  add constraint messages_user_id_profiles_fk
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;
