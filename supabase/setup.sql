-- ============================================================================
-- LT Design — installation de la base pour le mode administrateur
-- À coller UNE FOIS dans Supabase : menu "SQL Editor" > "New query" > Run.
-- Sans danger si on le relance (les règles sont recréées proprement).
-- ============================================================================

-- 1) Projets créés dans le mode administrateur ------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  category    text not null check (category in ('clients','fictives','affiches','sport','edition')),
  date_label  text not null default '',
  cover_url   text,
  hover_url   text,
  meta        jsonb not null default '{}'::jsonb,
  theme       jsonb not null default '{}'::jsonb,
  blocks      jsonb not null default '[]'::jsonb,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2) Réglages du site (composition de la page principale, clé "home") -------
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- 3) Sécurité : lecture publique, écriture réservée à l'administrateur ------
alter table public.projects      enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "projets_lecture_publique" on public.projects;
create policy "projets_lecture_publique" on public.projects
  for select using (published = true or auth.role() = 'authenticated');

drop policy if exists "projets_ecriture_admin" on public.projects;
create policy "projets_ecriture_admin" on public.projects
  for all to authenticated using (true) with check (true);

drop policy if exists "reglages_lecture_publique" on public.site_settings;
create policy "reglages_lecture_publique" on public.site_settings
  for select using (true);

drop policy if exists "reglages_ecriture_admin" on public.site_settings;
create policy "reglages_ecriture_admin" on public.site_settings
  for all to authenticated using (true) with check (true);

-- 4) Images / vidéos des projets (bucket public en lecture) -----------------
insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do update set public = true;

drop policy if exists "medias_lecture_publique" on storage.objects;
create policy "medias_lecture_publique" on storage.objects
  for select using (bucket_id = 'project-media');

drop policy if exists "medias_envoi_admin" on storage.objects;
create policy "medias_envoi_admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'project-media');

drop policy if exists "medias_modif_admin" on storage.objects;
create policy "medias_modif_admin" on storage.objects
  for update to authenticated using (bucket_id = 'project-media');

drop policy if exists "medias_suppression_admin" on storage.objects;
create policy "medias_suppression_admin" on storage.objects
  for delete to authenticated using (bucket_id = 'project-media');
