-- Run once in Supabase SQL Editor for member profiles and the new forum categories.
-- Existing posts are retained and mapped into the new forum centers.
alter table public.profiles
  alter column display_name set default 'Community Member';

update public.profiles
set display_name = 'Community Member'
where display_name is null or length(trim(display_name)) = 0;

alter table public.profiles
  drop constraint if exists profiles_display_name_length_check;
alter table public.profiles
  add constraint profiles_display_name_length_check
  check (char_length(trim(display_name)) between 3 and 24);

-- Keep role private from member edits: authenticated users may update display_name only.
revoke update on table public.profiles from anon, authenticated;
grant update (display_name) on table public.profiles to authenticated;

drop policy if exists "Members can update own display name" on public.profiles;
create policy "Members can update own display name"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Move legacy forum categories into the current three roleplay centers.
update public.forum_posts set category = 'factions' where category = 'gangs';
update public.forum_posts set category = 'ooc' where category in ('announcements','general','support');

alter table public.forum_posts
  drop constraint if exists forum_posts_category_check;
alter table public.forum_posts
  add constraint forum_posts_category_check
  check (category in ('civilian','factions','ooc'));
