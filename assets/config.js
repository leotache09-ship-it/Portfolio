/*
 * Configuration Supabase du mode administrateur.
 * Ces deux valeurs sont PUBLIQUES par conception (la sécurité vient des
 * règles RLS de supabase/setup.sql, pas du secret de la clé) : tu peux les
 * coller ici et les publier.
 *
 * À remplir après avoir suivi supabase/INSTALLATION.md :
 *   SUPABASE_URL      -> Project Settings > API > Project URL
 *   SUPABASE_ANON_KEY -> Project Settings > API Keys > clé "anon" (eyJ…) ou "publishable" (sb_publishable_…)
 *
 * Tant que c'est vide, le site fonctionne normalement avec les 11 projets
 * d'origine et le mode administrateur indique "pas encore configuré".
 */
window.LT_CONFIG = {
  SUPABASE_URL: 'https://ljwgtguirnatdbgxfyuh.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_8EcBjQiLBSSnlbor9EHqog_hU4VlDiE'
};
