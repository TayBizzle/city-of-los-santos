-- City Of Los Santos custom community roles
-- Run this once in Supabase SQL Editor. Safe to re-run.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in (
'member','admin','moderator','Management','Community Management','Developer','Designer','Lead Admins','Senior Admin','Game Admin','Testers','ContentCreator','Police department','PriorityPass','Whitelisted','Staffblacklist'
));
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path=public
as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('admin','moderator','Management','Community Management','Lead Admins','Senior Admin','Game Admin'));
$$;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;
create or replace function public.admin_set_member_role(target_user_id uuid,new_role text)
returns void language plpgsql security definer set search_path=public
as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Only an administrator can manage member roles'; end if;
 if target_user_id=auth.uid() then raise exception 'You cannot change your own administrator role'; end if;
 if new_role not in ('member','admin','moderator','Management','Community Management','Developer','Designer','Lead Admins','Senior Admin','Game Admin','Testers','ContentCreator','Police department','PriorityPass','Whitelisted','Staffblacklist') then raise exception 'That community role is not available'; end if;
 update public.profiles set role=new_role where id=target_user_id;
 if not found then raise exception 'Member profile not found'; end if;
end;
$$;
revoke all on function public.admin_set_member_role(uuid,text) from public;
grant execute on function public.admin_set_member_role(uuid,text) to authenticated;
