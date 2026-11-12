-- City Of Los Santos profile names, profile pictures, and forum categories
-- Run once in Supabase SQL Editor. Safe to re-run.
alter table public.profiles add column if not exists avatar_url text;

-- Let members edit only their public name and avatar, never their staff role.
drop policy if exists "Members can update their own public profile" on public.profiles;
create policy "Members can update their own public profile" on public.profiles
for update to authenticated using (auth.uid()=id) with check (auth.uid()=id);
revoke update on public.profiles from authenticated;
grant update(display_name,avatar_url) on public.profiles to authenticated;

-- Match the three roleplay forum sections used by the website.
alter table public.forum_posts drop constraint if exists forum_posts_category_check;
alter table public.forum_posts add constraint forum_posts_category_check
check (category in ('civilian','factions','ooc'));

-- Public avatar images; uploads and changes are restricted to each member's own folder.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,2097152,array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=2097152,allowed_mime_types=array['image/png','image/jpeg','image/webp','image/gif'];

drop policy if exists "Public avatar images are viewable" on storage.objects;
create policy "Public avatar images are viewable" on storage.objects
for select using (bucket_id='avatars');

drop policy if exists "Members upload their own avatar" on storage.objects;
create policy "Members upload their own avatar" on storage.objects
for insert to authenticated with check (
 bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists "Members update their own avatar" on storage.objects;
create policy "Members update their own avatar" on storage.objects
for update to authenticated using (
 bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text
) with check (
 bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists "Members delete their own avatar" on storage.objects;
create policy "Members delete their own avatar" on storage.objects
for delete to authenticated using (
 bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text
);
