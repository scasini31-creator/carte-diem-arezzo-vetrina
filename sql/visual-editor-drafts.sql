-- Eseguire una sola volta nel SQL Editor di Supabase, dopo la revisione.
-- Le bozze non sono lette dal sito pubblico.
create table if not exists public.visual_editor_drafts (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"texts":{},"images":{}}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.visual_editor_drafts enable row level security;
revoke all on public.visual_editor_drafts from anon;
grant select,insert,update on public.visual_editor_drafts to authenticated;
drop policy if exists "visual_editor_drafts_admin_select" on public.visual_editor_drafts;
drop policy if exists "visual_editor_drafts_admin_insert" on public.visual_editor_drafts;
drop policy if exists "visual_editor_drafts_admin_update" on public.visual_editor_drafts;
create policy "visual_editor_drafts_admin_select" on public.visual_editor_drafts for select to authenticated using (owner_id=auth.uid() and (select public.is_admin()));
create policy "visual_editor_drafts_admin_insert" on public.visual_editor_drafts for insert to authenticated with check (owner_id=auth.uid() and (select public.is_admin()));
create policy "visual_editor_drafts_admin_update" on public.visual_editor_drafts for update to authenticated using (owner_id=auth.uid() and (select public.is_admin())) with check (owner_id=auth.uid() and (select public.is_admin()));
-- Nessuna policy DELETE: le bozze non possono essere cancellate via API.
-- La pubblicazione sarà implementata separatamente e richiederà conferma esplicita.
