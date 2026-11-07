-- TEMPLATE da verificare su STAGING, non eseguire alla cieca su production.
-- PRIMA: creare/verificare un backup; inserire il proprio auth.users.id in admin_users.
-- Attenzione: questo script elimina e ricrea le policy esistenti sulle tabelle indicate.
-- La migrazione va adattata agli eventuali altri ruoli/app che utilizzano le stesse tabelle.
begin;
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from public, anon, authenticated;
-- Eseguire manualmente in SQL Editor PRIMA di applicare il blocco successivo:
-- insert into public.admin_users(user_id) values ('UUID_ADMIN_DA_AUTH_USERS') on conflict do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = ''
as $$
 select (select auth.uid()) is not null and exists (
   select 1 from public.admin_users where user_id=(select auth.uid())
 );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Protezione anti-lockout: senza almeno un amministratore la transazione fallisce.
-- Inizializzare admin_users in un passaggio precedente, verificando gli UUID in Auth.
do $$ begin
 if not exists(select 1 from public.admin_users) then
  raise exception 'admin_users vuota: inserire l UUID dell amministratore prima di applicare questa migrazione';
 end if;
end $$;

-- Chiude eventuali policy pregresse, comprese quelle permissive in OR.
do $$
declare t text; pol record;
begin
 foreach t in array array['products','featured_products','mancolista','visual_editor_published','visual_editor_drafts'] loop
  execute format('alter table public.%I enable row level security', t);
  for pol in select policyname from pg_policies where schemaname='public' and tablename=t loop
   execute format('drop policy if exists %I on public.%I',pol.policyname,t);
  end loop;
  execute format('revoke all on public.%I from public, anon, authenticated',t);
  execute format('grant select on public.%I to anon, authenticated',t);
  execute format('grant insert, update, delete on public.%I to authenticated',t);
 end loop;
end $$;

create policy products_read on public.products for select to anon, authenticated using (true);
create policy products_admin_insert on public.products for insert to authenticated with check ((select public.is_admin()));
create policy products_admin_update on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy products_admin_delete on public.products for delete to authenticated using ((select public.is_admin()));
create policy featured_read on public.featured_products for select to anon, authenticated using (true);
create policy featured_admin_insert on public.featured_products for insert to authenticated with check ((select public.is_admin()));
create policy featured_admin_update on public.featured_products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy featured_admin_delete on public.featured_products for delete to authenticated using ((select public.is_admin()));
create policy mancolista_read on public.mancolista for select to anon, authenticated using (true);
create policy mancolista_admin_insert on public.mancolista for insert to authenticated with check ((select public.is_admin()));
create policy mancolista_admin_update on public.mancolista for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy mancolista_admin_delete on public.mancolista for delete to authenticated using ((select public.is_admin()));
create policy published_read on public.visual_editor_published for select to anon, authenticated using (true);
create policy published_admin_insert on public.visual_editor_published for insert to authenticated with check ((select public.is_admin()));
create policy published_admin_update on public.visual_editor_published for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy published_admin_delete on public.visual_editor_published for delete to authenticated using ((select public.is_admin()));
-- Le bozze NON devono essere pubblicamente leggibili.
revoke select on public.visual_editor_drafts from anon;
create policy draft_owner_admin_read on public.visual_editor_drafts for select to authenticated using ((select public.is_admin()) and owner_id=(select auth.uid()));
create policy draft_owner_admin_insert on public.visual_editor_drafts for insert to authenticated with check ((select public.is_admin()) and owner_id=(select auth.uid()));
create policy draft_owner_admin_update on public.visual_editor_drafts for update to authenticated using ((select public.is_admin()) and owner_id=(select auth.uid())) with check ((select public.is_admin()) and owner_id=(select auth.uid()));
create policy draft_owner_admin_delete on public.visual_editor_drafts for delete to authenticated using ((select public.is_admin()) and owner_id=(select auth.uid()));

-- Storage: verificare che non ci siano altre policy permissive su storage.objects.
-- Non eliminare automaticamente policy di altri bucket.
do $$ declare pol record; begin
 for pol in select policyname from pg_policies where schemaname='storage' and tablename='objects' loop
  -- ATTENZIONE: altre policy su storage.objects potrebbero consentire l'accesso a product-images.
  -- Devono essere controllate manualmente prima della pubblicazione.
  null;
 end loop;
end $$;
drop policy if exists "product_images_admin_insert" on storage.objects;
drop policy if exists "product_images_admin_update" on storage.objects;
drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
for insert to authenticated with check (bucket_id='product-images' and (select public.is_admin()));
create policy "product_images_admin_update" on storage.objects
for update to authenticated using (bucket_id='product-images' and (select public.is_admin())) with check (bucket_id='product-images' and (select public.is_admin()));
create policy "product_images_admin_delete" on storage.objects
for delete to authenticated using (bucket_id='product-images' and (select public.is_admin()));
-- Le immagini pubbliche sono servite dal bucket pubblico. Verificare che sia effettivamente pubblico.
commit;
