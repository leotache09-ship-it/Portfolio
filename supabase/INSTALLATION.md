# Installer le mode administrateur (Supabase) — 10 minutes, une seule fois

Le mode administrateur enregistre tes projets et tes images dans **Supabase**
(gratuit). Le site reste un simple site statique chez Infomaniak ; seules les
données (projets, images, composition de la page principale) sont stockées
chez Supabase.

## 1. Créer le projet Supabase

1. Va sur https://supabase.com → **Start your project** → connecte-toi
   (avec GitHub ou un e-mail).
2. **New project** :
   - *Name* : `lt-design`
   - *Database password* : génère-en un et **garde-le dans ton gestionnaire de
     mots de passe** (tu n'en auras normalement plus besoin).
   - *Region* : **Europe** (par exemple *Central EU (Frankfurt)* ou
     *West EU (Zurich/Paris)* selon ce qui est proposé) — important pour la
     protection des données.
3. Attends 1–2 minutes que le projet soit prêt.

## 2. Créer les tables et les règles de sécurité

1. Menu de gauche → **SQL Editor** → **New query**.
2. Ouvre le fichier `supabase/setup.sql` de ce dépôt, copie **tout** son
   contenu, colle-le dans l'éditeur, clique **Run**. Tu dois voir
   *Success. No rows returned*.

## 3. Créer ton compte administrateur

1. Menu de gauche → **Authentication** → **Users** → **Add user** →
   **Create new user**.
2. *Email* : `leo@admin.leotache.ch` (ce n'est pas une vraie adresse : le
   site ajoute automatiquement `@admin.leotache.ch` à ce que tu tapes dans le
   champ **Nom** — tu te connecteras donc avec le nom `leo`).
   Tu peux choisir un autre nom (`leotache@admin.leotache.ch` → nom `leotache`).
3. *Password* : choisis un **mot de passe long et unique** (12 caractères ou
   plus). Coche **Auto Confirm User**. **Create user**.
4. **Très important — empêcher quiconque de s'inscrire** :
   **Authentication** → **Sign In / Providers** (ou *Providers* → *Email*) →
   décoche **Allow new users to sign up** (« Enable sign ups ») → **Save**.
   Ainsi, ton compte est le seul qui existe : seul lui peut modifier le site.

## 4. Brancher le site

1. **Project Settings** (roue dentée) → **API** :
   - copie **Project URL** (ex. `https://abcdxyz.supabase.co`)
   - copie la clé **anon public** (longue, commence par `eyJ…`).
   Ces deux valeurs sont **publiques par conception** : la sécurité vient des
   règles de l'étape 2, pas du secret de cette clé. **Ne copie jamais** la clé
   `service_role`.
2. Ouvre `assets/config.js` et colle-les :

   ```js
   window.LT_CONFIG = {
     SUPABASE_URL: 'https://abcdxyz.supabase.co',
     SUPABASE_ANON_KEY: 'eyJ…'
   };
   ```
3. Envoie le site mis à jour chez Infomaniak (comme d'habitude).

## 5. Utiliser le mode administrateur

- Ajoute `_mode-createur` à la fin du lien du site (ex. `leotache.ch/_mode-createur`) → entre ton **nom**
  (`leo`) et ton **mot de passe**.
- **Projets** : créer / modifier / publier / supprimer des pages projet
  (modèles prêts à l'emploi, zones de texte, images, titres, image de
  couverture et image au survol).
- **Page principale** : choisir quels projets apparaissent sur la page
  d'accueil, les remplacer, changer leur ordre.

## Bon à savoir

- Les 11 projets d'origine restent des pages « faites main » ; tu peux les
  retirer / remplacer sur la page principale, mais pas les éditer dans
  l'éditeur.
- Si Supabase est injoignable, le site affiche automatiquement les 11 projets
  d'origine : il ne « casse » jamais.
- Plan gratuit : 500 Mo de base, 1 Go de fichiers. Les images sont
  automatiquement réduites (2200 px max) avant l'envoi pour économiser de la
  place. Un projet gratuit Supabase se met en pause après 7 jours sans aucune
  activité : un simple clic sur « Restore » dans le tableau de bord le
  réveille.
- Mot de passe oublié : Supabase → Authentication → Users → ton compte →
  *Send password recovery* ou *Reset password*.
- Mets à jour la page de confidentialité si tu changes de région/fournisseur.
