-- Eseguire in Supabase SQL Editor con accesso autorizzato; sola lettura.
select schemaname,tablename,rowsecurity,forcerowsecurity from pg_tables
where schemaname='public' and tablename in
('products','featured_products','mancolista','visual_editor_published','visual_editor_drafts')
order by tablename;

select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies
where schemaname='public' and tablename in
('products','featured_products','mancolista','visual_editor_published','visual_editor_drafts')
order by tablename,policyname;

select n.nspname, p.proname, p.prosecdef, pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='is_admin';

select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies where schemaname='storage' and tablename='objects';

select id,name,public,file_size_limit,allowed_mime_types
from storage.buckets where id='product-images';

select grantee,table_name,privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name in
('products','featured_products','mancolista','visual_editor_published','visual_editor_drafts')
order by table_name,grantee;
