# Portfolio de Léo Tâche — notes de projet

Site portfolio statique (HTML/CSS/JS vanilla, sans build) pour Léo Tâche,
étudiant en communication visuelle au CPNV Sainte-Croix. Dépôt GitHub :
`leotache09-ship-it/Portfolio` (privé).

## Workflow standard

- Aperçu local : `python -m http.server 8000 --bind 127.0.0.1` depuis la
  racine du projet, puis ouvrir `http://127.0.0.1:8000`.
- **Le navigateur cache agressivement les pages déjà visitées.** Après une
  modification, toujours recharger avec un paramètre anti-cache
  (`?cb=xxx`) ou un rechargement forcé (Ctrl+Maj+R), sinon on teste une
  version obsolète sans s'en rendre compte (piège rencontré plusieurs fois).
- À chaque changement validé : **commit en local seulement**. Le `git push`
  sur `main` (pas de branche, pas de PR) ne se fait QUE quand Léo dit de
  publier : chaque push déclenche un déploiement Netlify qui consomme des
  crédits. Un seul push regroupe alors tous les commits en attente.
- **Ce fichier (`CLAUDE.md`) doit être mis à jour à chaque commit** : ajouter
  une ligne au Changelog ci-dessous résumant le changement.

## Structure

- `index.html` — la page d'accueil (one-page : hero, travaux, parcours,
  contact). Tout le CSS et le JS de cette page sont inline dans ce fichier.
- 11 pages projet (`chearn.html`, `afmbb.html`, `partie-ailleurs.html`,
  `richol.html`, `meublon.html`, `cervin.html`, `fragments.html`,
  `riat.html`, `rogers.html`, `serigraphie.html`, `losangeles.html`) —
  chacune une étude de cas, structure similaire (header + hero + sections
  `.row`/`.shots`/`.plate` + footer), CSS inline propre à chaque page.
- ~~`assets/loader.js`~~ — écran de chargement, SUPPRIMÉ le 2026-10-05.
- `assets/lightbox.js` — visionneuse plein écran au clic sur une image,
  incluse seulement sur les 11 pages projet (pas sur `index.html`).
- `assets/<projet>/` — images/vidéos de chaque étude de cas.
- `assets/logo-black.png` — logo, utilisé aussi comme favicon.
- `assets/leo-portrait.webp` — portrait détouré (fond transparent) de Léo,
  utilisé dans le hero de `index.html` et sur `apropos.html`.
- `apropos.html` — page "à propos" (parcours, ce qu'il fait, contact),
  accessible en cliquant sur le portrait dans le hero.

## Design system

- Couleurs de base : fond `#0D0D0F` (`--paper`), texte `#F2F2F2` (`--ink`),
  cartes `#18181B` (`--card`), lignes `rgba(242,242,242,.14)` (`--line`).
- Bleu d'accent : `#189CD8` (`--blue`).
- Couleurs des catégories travaux : Des vrais clients `#189CD8` (bleu),
  Marques fictives `#A855F7` (violet), Affiches `#E5B800` (jaune),
  Sport design `#FF5A1F` (orange), Édition & print `#16A085` (sarcelle).
- Polices (Google Fonts) : **Archivo Black** (gros titres, majuscules),
  **Roboto** (texte courant, poids 400/500/700/900), **Roboto Mono**
  (labels/dates/petits éléments techniques). Caveat est chargée mais non
  utilisée sur `index.html`.
- Unités d'espacement : `--unit` (16px) et `--gutter` (clamp responsive)
  utilisés partout via `calc()` plutôt que des valeurs fixes.

## Mécanismes clés de `index.html`

### Travaux (`#travaux`, `#tvCats`)
Chaque catégorie (`TRAVAUX_FAMILIES`) est une bande `.tv-cat` générée en
JS. Le défilement horizontal des projets est piloté par le scroll
vertical de la page (pas de swipe séparé), via une boucle
`requestAnimationFrame`. Points importants, acquis après plusieurs
essais/erreurs :

- **Ne jamais utiliser `position:sticky`/épinglage pour ce système.** Un
  essai (`8736014`) a épinglé chaque catégorie à l'écran pendant son
  défilement pour que les projets aient le temps de glisser hors du
  cadre — visuellement correct, mais **explicitement rejeté** par le
  client car "la caméra se bloque" (le scroll semblait figé). Annulé et
  remplacé (`3f50b51`) par un système qui reste sur le scroll natif
  continu : seule la répartition du trajet change (le titre reste
  immobile un moment avant de glisser, puis les projets glissent au-delà
  du plein écran pour vraiment sortir du cadre), mais la page bouge
  toujours en continu, jamais de gel.
- Catégories paires/impaires en miroir (`reversed`) : titre à droite,
  cartes image-à-gauche/texte-à-droite. Le trajet de `translateX` est
  inversé en conséquence (voir commentaires dans le JS).
- `.tv-strip` (le masque `overflow:hidden`) est en pleine largeur de
  viewport (`100vw` + marge négative), pas limité à la colonne de texte
  centrée — sinon sur un grand écran le découpage se faisait ~200px avant
  le bord réel (`b2ee58d`).
- Un script séparé plafonne la vitesse de scroll (molette/trackpad) pour
  laisser le temps de voir ces animations, sans jamais bloquer le
  scroll (lissage + plafond de vitesse via `wheel` + rAF, respecte
  `prefers-reduced-motion`).
- Le fond de la page entière (`document.body.style.backgroundColor`)
  dégrade en continu d'une couleur de catégorie à l'autre, calé sur les
  mêmes positions de scroll.

### Hero (`#cover`, `.cover-hint`)
Le carré bleu "Mes travaux." grandit au scroll (jamais de transition CSS,
tout est piloté image par image pour rester synchronisé). `z-index:-1`
pour rester toujours derrière le contenu. Le texte est dans un enfant
séparé qui n'est jamais mis à l'échelle ni fondu, contrairement au fond
du carré — il reste donc toujours lisible.

### Écran de chargement (`assets/loader.js`)
Anime l'assemblage du logo (3 pièces SVG) + un compteur %. **Attend que
le logo ait fini un cycle complet de dessin avant de disparaître**
(sinon il se coupe en pleine formation si la page charge très vite) —
mais avec un garde-fou de 2s max pour ne jamais rester bloqué si l'onglet
perd le focus pendant le chargement.

### Hero (`#cover`) — refonte "énorme nom + portrait"
Plus de logo, plus d'eyebrow "Portfolio", plus de rôle "Étudiant en
communication visuelle..." — juste `h1.cover-name` énorme (clamp jusqu'à
~9.5rem) en haut à gauche, `.cover-mark` ("LT Design") en petit dessous,
et le portrait ancré en position absolue en bas à droite (`.cover-portrait-link`,
`z-index:2`, au-dessus du texte : il le chevauche volontairement, comme
demandé). `.cover-hint` ("Mes travaux") est ancré à gauche (`left:var(--gutter)`)
au lieu d'être centré, pour ne pas se retrouver sous le portrait.

Sur petit écran, le portrait (hauteur ~62vh) devient presque aussi large
que le viewport et chevauche le carré "Mes travaux" — réduit et remonté
via `@media (max-width:640px)`.

**La custom property `--glow` doit être posée sur le conteneur commun
(`.cover-portrait-link`), pas sur `.cover-portrait-glow` seul** : les
custom properties n'héritent que vers les descendants, pas entre frères
(`.cover-portrait-glow` et `.cover-portrait` sont deux enfants séparés du
lien) — posée sur le mauvais élément, la photo ne grossissait jamais
malgré une lueur qui fonctionnait très bien (bug réel, corrigé).
`filter: drop-shadow(...)` n'accepte PAS de 4e valeur "spread" comme
`box-shadow` — `drop-shadow(0 0 0 3px var(--blue))` est invalide et fait
tomber tout le filtre à `none` sans erreur console.

La lueur suit la distance souris↔portrait en continu (pas un simple
survol), pilotée par rAF. Au survol direct, un contour bleu net
(`drop-shadow` supplémentaire) s'ajoute en CSS pur. Cliquable, mène à
`apropos.html`.

### Navigation "Portfolio" / "Retour au portfolio" (bug corrigé)
Chaque page projet a un lien retour vers `index.html#<slug>` (ex.
`index.html#richol`), censé scroller jusqu'à la carte du projet dans
`#travaux`. **Ce lien ne marchait pas de façon fiable** car les cartes
(`.tv-card`) sont générées en JS (`TRAVAUX_FAMILIES`) sans aucun `id` — le
navigateur ne trouvait donc jamais la cible et retombait simplement en
haut de la page d'accueil. Corrigé en ajoutant `id="<slug>"` sur chaque
`.tv-card` (dérivé de `p.href` dans le script des travaux) + un
`scroll-margin-top` sur `.tv-card` pour que le header fixe ne masque pas
la carte une fois atteinte.

### Section "Autres projets" (bas de chaque page projet)
Les 11 pages projet ont désormais, juste avant le footer, une section
"Autres projets" qui reprend le format des cartes "cover" de la page
d'accueil (image + nom + date), avec au survol un voile gris semi-
transparent et un texte "Voir plus" — mêmes classes `.more-card` /
`.more-media` / `.more-veil` / `.more-cta` sur toutes les pages, stylées
avec les variables CSS déjà définies par chaque page (`--card`, `--line`,
`--ink-faint`) donc sans dépendance à un thème particulier. Chaque page
suggère les deux projets suivants dans l'ordre canonique du portfolio
(même ordre que `TRAVAUX_FAMILIES` dans `index.html`, en boucle), pour
que les 11 pages se renvoient les unes aux autres sans jamais suggérer le
projet déjà affiché.

### Formulaire de contact
Envoi via [FormSubmit](https://formsubmit.co) vers `leo.tache.09@gmail.com`
(pas de backend à héberger). **La toute première soumission déclenche un
email de confirmation qu'il faut valider une fois** pour activer la
réception des messages suivants — à faire par Léo dès que le site est en
ligne.

## Pièges connus de l'environnement de test

En testant via le navigateur intégré de Claude Code, les boucles
`requestAnimationFrame` du site peuvent s'arrêter silencieusement si
l'onglet/le panneau perd le focus (pas de scroll, transforms figés,
`window.scrollTo`/`scrollIntoView` sans effet). Ce n'est **pas** un bug
du site — ça n'affecte pas un vrai utilisateur avec son onglet actif.
Solution : recharger, cliquer réellement sur la page pour forcer le
focus, revérifier. Ne jamais conclure à un bug sur la seule foi d'un test
automatisé sans avoir revérifié après un clic réel.

**Le panneau de prévisualisation ne descend pas sous ~425px de large**,
même en demandant explicitement 375px (préréglage "mobile") : `window.
innerWidth` y vaut ~425 (voire plus, de façon instable d'un appel à
l'autre) et la capture d'écran, elle, est forcée à 375px de large — donc
du texte qui tient très bien dans les 425px réels peut apparaître coupé
net sur le bord droit de la capture, alors qu'il n'y a **aucun**
débordement CSS réel (vérifié via `getBoundingClientRect()` : le texte
s'arrête bien avant `innerWidth`). Ne jamais conclure à un bug de mise en
page mobile sur la seule foi d'une capture d'écran ici en dessous de
~480px ; vérifier plutôt les valeurs calculées (`getComputedStyle`,
`getBoundingClientRect`) et, en cas de doute, faire confiance au CSS
plutôt qu'au rendu visuel de cet outil précis.

**Quand deux `@media (max-width: …)` différents visent le même sélecteur
avec la même spécificité** (ex. un correctif ajouté près du haut du
fichier vs une règle existante plus bas, toutes deux déclenchées en
dessous d'un certain seuil), **c'est l'ordre d'apparition dans le fichier
qui tranche, pas la largeur du breakpoint** : une règle `max-width:480px`
placée *avant* une règle `max-width:760px` sur le même sélecteur perd
face à elle dès que les deux s'appliquent en même temps (en dessous de
480px). Toujours ajouter un correctif ciblé *après* la dernière règle
existante qui touche le même sélecteur, jamais en tête de fichier par
réflexe.

**Les fichiers `.js` référencés par `<script src="assets/xxx.js">` restent
en cache même quand la page HTML est rechargée avec `?cb=`.** Un `?cb=`
sur l'URL de la page ne rafraîchit QUE le document HTML, pas les scripts
externes qu'il référence — un `assets/loader.js` modifié peut donc
continuer à s'exécuter avec l'ancien code pendant toute la session de
test, même après plusieurs "rechargements". Repéré via
`performance.getEntriesByType('resource')` : `transferSize:0` = servi
depuis le cache. Pour tester un changement dans un fichier `assets/*.js`
avec certitude, soit ajouter un paramètre anti-cache directement sur le
`src` du script (temporairement, pour le test), soit injecter le script
dynamiquement avec un `?fresh=<timestamp>`.

## Mode administrateur / mini-CMS (Supabase)

Hébergement prévu : Infomaniak (leotache.ch), site statique. Les données
dynamiques vivent dans **Supabase** (guide : `supabase/INSTALLATION.md`,
SQL : `supabase/setup.sql`, clés publiques dans `assets/config.js`, vide
tant que non configuré → le site se comporte exactement comme avant).

- **Accès caché** (`assets/star.js`, plus d'étoile visible) : ajouter `_mode-createur` à la fin du lien (`#_mode-createur`, `?_mode-createur` ou dossier `_mode-createur/` qui redirige vers `admin.html`) → fenêtre nom + mot de passe → `admin.html`.
  Le "nom" devient `<nom>@admin.leotache.ch` (compte créé à la main dans
  Supabase, inscriptions désactivées). Auth via `assets/lt-auth.js`
  (supabase-js chargé à la demande depuis jsdelivr, jamais pour un visiteur).
- **`admin.html` + `assets/admin.js`** : Projets (liste, modèles, éditeur à
  blocs avec aperçu en direct dans un iframe `projet.html?preview=1` par
  `postMessage`), Page principale (ajouter / retirer / remplacer / ordonner
  les projets par catégorie). Types de blocs et modèles (identité, affiche,
  sport, édition, vierge) : `assets/admin-templates.js`.
- **`projet.html` + `assets/project-render.js` + `assets/project-page.css`** :
  page publique d'un projet créé (`projet.html?p=<slug>`), thème clair/sombre
  + couleur d'accent par projet. Cover et image au survol = `cover_url` /
  `hover_url`.
- **`assets/lt-data.js`** : données partagées (copie des 11 projets
  d'origine `LEGACY` + lecture publique REST de Supabase, sans bibliothèque).
  `projets.html` s'en sert ; `index.html` garde sa liste inline
  `TRAVAUX_FAMILIES` (sécurité : l'accueil ne dépend d'aucun fichier
  externe) → **un projet d'origine ajouté à la main doit l'être dans
  `index.html` ET `lt-data.js`**.
- **Accueil** : `build(families)` du script des travaux est ré-appelable
  (`window.LT_rebuildTravaux`). Si une composition existe dans
  `site_settings` (clé `home`, `{categories:{clients:[slug…]}}`), elle
  remplace la liste d'origine après chargement ; sinon / en cas d'erreur
  réseau, rien ne bouge. Ancre `#slug` réappliquée après reconstruction.
- Sécurité : la clé `anon` est publique par conception ; les règles RLS
  (lecture publique des projets publiés, écriture réservée aux
  utilisateurs authentifiés) font la sécurité. **Désactiver les
  inscriptions dans Supabase** (sinon n'importe qui pourrait créer un
  compte "authentifié").
- Testé avec un faux Supabase en mémoire (connexion, création depuis un
  modèle, envoi d'images, aperçu, publication, placement/remplacement sur
  l'accueil, répertoire) ; **jamais testé contre un vrai Supabase** — à
  valider après l'installation.

## Changelog

- 2026-10-07 — Mode créateur : les options des images sont rangées dans un menu déroulant « Options de l'image » (flèche ▸, fermé par défaut ; idem « Options de l'image d'en-tête »). Mécanisme générique : tout champ d'une définition avec `adv:true` est regroupé par `fieldsNode` dans un `<details class="adv">` (`advLabel` sur le 1er champ = titre) ; l'état ouvert/fermé est mémorisé par objet édité (`WeakMap openAdv`) pour survivre aux repaints. Restent visibles : image et légende. **Pas publié (commit local).**

- 2026-10-07 — Mode créateur : option **Contour** sur les images (`bd` : défaut / aucun / 1-3-6-10 px, + `bdColor` palette, visible seulement si une épaisseur est choisie) et sur l'image d'en-tête (`hero_bd`, `hero_bdColor`). `showIf.v` de `fieldsNode` accepte maintenant une LISTE de valeurs. Appliqué APRÈS le fond (donc « Aucun contour » l'emporte sur le contour transparent du fond « sans cadre »). **Pas publié (commit local).**

- 2026-10-07 — Aperçu de l'éditeur : plus de lueur bleue sur l'élément cliqué dans l'aperçu (demande de Léo) ; le clic envoie toujours `lt-select` et seul le bloc côté ÉDITEUR (`.glow`) s'illumine. La classe `.lt-sel` reste posée mais sans style.

- 2026-10-07 — Mode créateur : **hauteur du cadre** des images (`h` : 120→600 px, `hero_h` pour l'en-tête). Elle remplace le format (`aspect-ratio` retiré) ; l'image est centrée, jamais déformée ni coupée (`object-fit:contain`, `max-width/max-height`), combinable avec « taille dans le cadre » (`inner`) et le fond ; plafonnée à `80vh` pour ne pas dépasser un écran de téléphone. **Pas publié (commit local).**

- 2026-10-07 — Mode créateur, 4 retours : (1) **la page ne remonte plus en haut** quand on ajoute/supprime/déplace un bloc ou un élément de liste : `keepScroll(el, fn)` fige la hauteur de la zone (`min-height`) pendant le repaint de `secBlocks`/`listNode` (le vide momentané faisait clamper le scroll à 0) ; (2) **clic dans l'aperçu = saut au bloc** : `renderBody(project, others, {edit:true})` (aperçu seulement) pose `data-bi="<index du bloc>"` (ou `info` pour l'en-tête) ; `projet.html` en aperçu intercepte le clic, met une lueur bleue (`.lt-sel`) et envoie `postMessage {type:'lt-select', index}` ; `admin.js` `selectBlock()` fait défiler jusqu'à la carte `.blk[data-bi]` (ou `#secInfos`) et lui applique `.glow` (2,6 s), en repassant sur l'onglet « Éditer » en mobile ; (3) **taille de l'image DANS le cadre** (logos PNG) : champ `inner` (85/70/55/40/30 %) sur les images de blocs et `hero_inner` pour l'en-tête → image réduite et centrée (`object-fit:contain`, cadre en flex avec padding), le fond choisi reste visible autour ; (4) **bouton « Publier / Dépublier »** dans la barre de l'éditeur (avant, il fallait penser à changer le menu « Statut » tout en bas de « Infos » : un projet importé comme AFMBB restait en brouillon, d'où « Brouillon enregistré » sans pouvoir le publier) ; il met à jour le menu Statut, enregistre, et le toast dit désormais que le brouillon est invisible. Vérifié sur l'aperçu simulé (marqueurs `data-bi`, clic → `lt-select` + `.lt-sel`, styles `inner`) ; l'éditeur (scroll, glow, bouton Publier) n'a pas pu être testé : connexion requise, syntaxe vérifiée seulement. **Pas publié (commit local).**

- 2026-10-07 — Mode créateur : l'**image d'en-tête** du projet (`meta.hero_image`, à droite du titre) a maintenant les mêmes réglages que les images de blocs : taille, alignement, fond transparent / couleur (champs `meta.hero_size`, `hero_align`, `hero_bgMode`, `hero_bg`, définis dans `HERO_STYLE` de `admin-templates.js`, affichés sous le champ image dans « Infos du projet » ; rendu via `heroStyle()` de `project-render.js`). Vérifié avec `projet.html?preview=1` + `postMessage` (50 %, droite, fond jaune) ; l'éditeur n'a pas été testé (connexion requise). **Pas publié (commit local).**

- 2026-10-07 — Mode créateur : chaque image (blocs image, 2 images, galerie, texte+image) gagne 4 réglages dans `assets/admin-templates.js` (`IMG`) : **Taille sur le site** (`size` : pleine largeur / 75 / 60 / 50 / 33 / 25 %), **Alignement** (`align` : centré / gauche / droite, utile si taille réduite), **Fond de l'image** (`bgMode` : défaut / `none` = transparent sans cadre pour PNG détourés / `color`) et **Couleur du fond** (`bg`, palette multicolore, visible seulement si « Couleur personnalisée », nouveau mécanisme `showIf:{k,v}` dans `fieldsNode` + `def` pour la couleur par défaut). Rendu dans `project-render.js` (`frame()` pour le fond, `figStyle()` pour largeur/marges de la `<figure>`). Ne concerne pas la couverture ni l'image d'en-tête. Vérifié avec `projet.html?preview=1` + `postMessage` (fond rouge, transparent, taille 50 %/25 %, alignement droite/gauche) ; l'éditeur lui-même n'a pas été testé en navigateur (connexion requise) : syntaxe vérifiée seulement. **Pas publié (commit local).**

- 2026-10-06 — **SEO + favicon Google + positionnement « Graphic designer ».** (1) Favicon pour Google : carré 48/96/192px + `apple-touch-icon` (180) + `/favicon.ico` à la racine (16/32/48), logo BLANC sur fond `#0D0D0F` (générés avec Pillow depuis `assets/logo-black.png` ; l'ancien PNG noir transparent était illisible sur fond sombre) ; balises `<link rel="icon">` identiques sur TOUTES les pages (y compris `projet.html`, `admin.html`). Google met plusieurs jours/semaines à rafraîchir l'icône après un nouveau crawl. (2) Hero : « LT Design » (`.cover-mark`) devient « Graphic designer ». (3) `<head>` de toutes les pages réécrit par script : `<html lang="fr">` (manquait), `<meta charset>` placé EN PREMIER (doit rester dans les 1024 premiers octets — ne pas le repousser derrière du JSON-LD), titres du type « Nom | Léo Tâche, graphic designer à Lausanne » (accueil : « Léo Tâche | Graphic designer freelance à Lausanne »), `meta description`, `canonical`, Open Graph/Twitter (image `assets/og-image.jpg` 1200×630 générée : portrait + nom), et JSON-LD sur `index.html` (WebSite « LT Design », ProfessionalService zone Lausanne SANS adresse postale précise, Person Léo Tâche, `sameAs` Instagram/LinkedIn). Description de l'accueil = formulation de Léo : « Je suis graphic designer en freelance et j'opère à Lausanne. Je fais des identités visuelles, du rebranding, des affiches, du sport design et du print. » Le texte « Ma vitrine. Mon parcours. De l'école obligatoire… » vu sur Google venait du contenu de la page faute de meta description au moment du crawl : Google utilise la description s'il la juge pertinente, sans garantie ; relancer l'indexation dans Search Console. **Pas publié (commit local).**

- 2026-10-05 — Favicon (`assets/logo-black.png`) ajouté aux 11 pages projet d'origine (il n'était que sur index, apropos, projets, confidentialité, admin, projet.html).

- 2026-10-05 — Galerie des travaux : plus de point final dans les noms de catégorie (« Des vrais clients », « Projets fictifs », « Affiches », « Sport design », « Édition & print ») dans `TRAVAUX_FAMILIES` (`index.html`) et `homeTitle` de `assets/lt-data.js` (utilisé quand la composition vient de Supabase). Le titre « Ma vitrine. » du hero garde son point.

- 2026-10-05 — **Supprime l'écran de chargement (logo qui s'assemble + compteur %)** sur les 13 pages qui l'avaient (index, apropos, 11 projets) : bloc CSS `#lt-loader`, markup et `<script src="assets/loader.js">` retirés, `assets/loader.js` supprimé. Raison : mauvais pour le référencement (contenu masqué derrière un écran plein page, chargement ralenti). Les autres animations (hero, travaux, etc.) sont conservées. Les mentions « Écran de chargement » plus haut dans ce fichier sont désormais historiques.

- 2026-10-05 — Nouveau mode de publication : commits locaux, push uniquement sur demande de Léo (économie de crédits Netlify).

- 2026-10-05 — Préparation Google Search Console : `sitemap.xml` (15 pages publiques, domaine `https://leotache.ch/`), `robots.txt` (bloque `/admin.html` et `/_mode-createur/`, pointe vers le sitemap) et `<meta name="description">` sur `index.html`, `projets.html`, `apropos.html`. Les projets créés dans le mode créateur (`projet.html?p=…`) ne sont PAS dans le sitemap (il est statique) ; un sitemap dynamique demanderait un script/une fonction.

- 2026-10-02 — Mobile : la dernière bande (« Édition & print », vert) se fond jusqu'au NOIR PUR en bas (plus de saut brutal) et le bouton « Plus de travaux » est remonté dessus (`margin-top:-3.5 unités`, `.tv-cat:last-child` avec plus de `padding-bottom` pour ne pas chevaucher le titre). Vérifié sur capture en émulation.

- 2026-10-02 — Mobile : le bleu du bandeau « Ma vitrine. » se prolonge jusqu'au MILIEU de la 1re bande « Des vrais clients. » (la 1re bande est bleu uni de 0 à 50 % au lieu de fondre depuis le noir), puis le dégradé continue vers la suivante. Mesuré : bas du bandeau = haut de la bande (1172px), pas d'écart.

- 2026-10-02 — Mobile : dégradé STATIQUE entre les bandes de travaux (le plat unie « faisait bizarre »). Dans `build()` (si `mobileLayout`), chaque `.tv-cat` reçoit un `linear-gradient` CSS : moitié de mélange avec la couleur voisine en haut (0%), sa couleur de 30% à 70%, mélange avec la suivante en bas (100%) ; noir de la page avant la 1re et après la dernière ; plus de trait blanc entre bandes. Aucun script au scroll (la leçon « pas de dégradé piloté au scroll sur mobile » reste valable). Les deux moitiés d'une jonction sont le même mélange 50/50 → pas de couture.

- 2026-10-02 — La flèche `.cover-point` passe à DROITE du portrait (miroir `scaleX(-1)`, oscillation vers lui) : `right:-9%` sur desktop, `left:73%;top:20.5%` sur mobile (espace libre à droite du cou, sous « TÂCHE »).

- 2026-10-02 — (1) Mobile : la page se laissait glisser en horizontal dans le noir (mon `touch-action: pan-x pan-y` sur `body` + le portrait/lueur du hero qui débordent de l'écran) → `body{touch-action:pan-y}` rétabli (seules les `.tv-strip` ont `pan-x pan-y`) et `html{overflow-x:hidden}` sous 760px. (2) Petite flèche blanche (`.cover-point`, SVG) qui pointe le portrait pour montrer qu'il est cliquable (oscillation douce, coupée en mouvement réduit) ; sur mobile elle est dans l'espace libre à gauche du cou (le portrait déborde l'écran). (3) « Mon parcours » : nouvelle étape « Lancement en freelance — Dès mars 2026 » (LT Design) ajoutée en `data-reach="4"` comme CPNV, donc le point/le tracé de la carte ne bougent pas (vérifié : marqueur toujours en 270,143, timeline tient dans l'écran).

- 2026-10-02 — **Mobile (≤760px) : travaux en swipe NATIF, plus de script de scroll.** Retours client : « version téléphone horrible, bugs, ça bouge même pas » (vitrine, dégradé, swipes). Sur mobile, `mobileLayout` (matchMedia 760px) coupe tout le pilotage au scroll (translateX des cartes, dégradé de fond du body, croissance du carré « Ma vitrine. » du hero) ; CSS : chaque `.tv-strip` devient un conteneur `overflow-x:auto` avec `scroll-snap`, les bandes gardent leur couleur unie, plus de miroir (titre toujours à gauche), titre 58vw pour laisser dépasser le 1er projet, `touch-action:pan-x pan-y` (le `pan-y` du body bloquait le swipe horizontal). Desktop inchangé. Vérifié par mesure en émulation (scrollWidth>clientWidth, scrollLeft modifiable, couleurs unies, pas de transform) ; pas testé sur vrai téléphone.

- 2026-10-02 — Renommages : la catégorie « Marques fictives » devient « Projets fictifs » partout (`index.html`, `assets/lt-data.js` `CATS` → répertoire, éditeur, composeur de page principale) ; le titre « Mes travaux. » (carré du hero + titre `noscript`) devient « Ma vitrine. » (idée : vitrine = les meilleurs projets, mais pas tous). La phrase « Richol, marque fictive d'alcools suisses » (page Richol) est une description, laissée telle quelle. « La Partie d'Ailleurs » retirée de la liste d'origine de l'accueil (2 projets dans « Des vrais clients ») mais sa page et son entrée dans `LT_DATA.LEGACY`/répertoire restent. **ATTENTION : la base Supabase de Léo contient DÉJÀ une composition `home`** (clients: chearn, afmbb, partie-ailleurs…) qui prend le dessus sur `TRAVAUX_FAMILIES` : pour que l'accueil en ligne n'affiche plus La Partie d'Ailleurs, il faut la retirer via Mode créateur → Page principale (aucun accès en écriture à Supabase depuis le dépôt).

- 2026-10-02 — Travaux : écart titre de catégorie ↔ flèche réduit sans bouger la flèche. Cause : sur "Des vrais clients." et "Marques fictives." (titres sur 2 lignes) la boîte `.tv-title-card` fait 560px (max-width) alors que le texte n'en fait qu'environ 300 → ~280px de vide. Le texte se colle maintenant côté flèche (`justify-content:flex-end; text-align:right` en normal, `flex-start; left` en miroir) ; mesuré : écart de 19px partout, flèches inchangées. Contrepartie : les titres à 2 lignes sont alignés côté flèche (à droite en normal, à gauche en miroir).

- 2026-10-02 — Le bouton « Retour » des pages projet revient à la page précédente (`history.back()`, via `assets/back.js`) si on vient d'une page du même site ; sinon (lien direct, nouvel onglet) il garde son lien de repli `index.html#<slug>`. Les clics avec Ctrl/Cmd/Maj (nouvel onglet) ne sont pas interceptés.

- 2026-10-02 — En-tête de TOUTES les pages projet (11 d'origine + `projet.html`) : à gauche « Retour » (au lieu de « Portfolio », même lien `index.html#<slug>`), à droite le LOGO (`assets/logo-black.png`, 20px) cliquable vers `index.html`. Les 7 pages qui avaient du texte « LT Design » à droite ont maintenant l'image ; `riat` et `rogers` (thèmes sombres) l'inversent en blanc (`filter:invert(1)`), `projet.html` le fait selon `theme.mode`. Corrige au passage un `'` parasite dans l'aria-label du lien du logo (ajouté au commit précédent).

- 2026-10-02 — Bouton "Plus de travaux" remis en BAS de la section travaux (après la dernière catégorie), centré, style pilule (le placer en haut n'était pas voulu).

- 2026-10-02 — "Mon parcours" : le trait de la carte va maintenant simplement Mézières → Lausanne → Sainte-Croix (plus d'aller-retour dans Lausanne). Le chemin garde 4 segments pour rester synchronisé avec les 5 étapes de la timeline : les deux segments du milieu sont de longueur nulle (`C356,417 356,417 356,417`), le marqueur reste donc à Lausanne pendant ces étapes. Bouton "Plus de travaux" : déplacé EN HAUT et centré dans la section travaux, au même style pilule que "Tous les projets" des pages projet (icône grille seule, sans flèche).

- 2026-10-02 — Icônes du hero : portée réduite (~3-4 em au lieu de 5-6) et Photoshop passe à DROITE du portrait (Ai et Id restent à gauche). Pages projet d'origine : le logo/"LT Design" en haut à droite (`.mark`, qui était un `<span>` inerte) devient un lien vers `index.html` (`header.nav a.mark` sans soulignement).

- 2026-10-02 — Hero : au survol (même variable `--glow` que la lueur bleue), trois icônes Ps / Ai / Id sortent de derrière le portrait en s'éloignant, floues au début (blur qui diminue) avec chacune un halo flou coloré (`.cover-apps` / `.cover-app--ps|ai|id`, CSS pur piloté par `--glow` ; invisibles au repos, donc aussi sur tactile et avec `prefers-reduced-motion`). Ce sont des pastilles stylisées (texte + couleurs Adobe), pas les logos officiels. Pour tester sans souris : forcer `.cover-portrait-link{--glow:1 !important}`.

- 2026-10-02 — Palette de couleurs du mode créateur : retire le bouton `EyeDropper` natif du navigateur (il grisait tout l'écran, non stylable) ; la pipette est maintenant le panneau « prendre dans une image », compact (image max 300px, vignettes 44px) et placé AU-DESSUS du carré de couleur. Non testé en navigateur après coup (le test exige le faux Supabase) : syntaxe vérifiée seulement.

- 2026-10-02 — Le bouton "Tous les projets" reprend l'icône grille de "Plus de travaux" (même SVG) sur les pages d'origine et générées.

- 2026-10-02 — "Autres projets" : les 2 suggestions sont maintenant tirées au hasard à chaque chargement (jamais le projet affiché) et un bouton "Tous les projets" (→ `projets.html`) est ajouté dessous. Pages d'origine : nouveau `assets/more-projects.js` (+ `config.js`/`lt-data.js` inclus avant `lightbox.js`) remplace les 2 cartes statiques, qui restent le repli sans JS ; il pioche dans `LT_DATA.loadAll()` (donc aussi les projets créés). Pages générées : `pickOthers` de `project-render.js` + style du bouton dans `project-page.css`. L'ancienne règle "les deux suivants dans l'ordre canonique" est abandonnée.

- 2026-10-02 — Hero : interligne "Léo / Tâche" augmenté (desktop `.86`→`1.04`, mobile `1.08`→`1.2`). Le lien "Travaux" du header de `index.html` mène désormais à `projets.html` (répertoire de tous les projets) au lieu de scroller vers `#travaux`. Site publié via Netlify (auto-déploiement à chaque push sur `main`) sur leotache.ch.

- 2026-10-02 — Retire l'étoile bleue : le mode créateur s'ouvre en ajoutant `_mode-createur` au lien (`index.html#_mode-createur` ouvre la fenêtre de connexion ; `/_mode-createur/` redirige vers `admin.html`). Docs et page de confidentialité mises à jour.

- 2026-10-02 — Mode créateur : (1) session en `sessionStorage` (il faut se reconnecter à chaque nouvelle visite/onglet) ; (2) recadrage/zoom des images (`frame` {zoom,fx,fy}, appliqué via `D.frameCss`, nécessite un ratio fixe ; option « Agrandir au clic » = `noZoom`) y compris sur les couvertures/survols (`meta.cover_frame/hover_frame` -> `imgStyle/peekStyle`) ; (3) dossier automatique par projet dans le stockage Supabase (`projects/<meta.folder>/`, pas dans le dossier `assets/` du dépôt) ; (4) sélecteur de couleur multicolore (carré SV + teinte + hex + pipette sur image) ; (5) import des 11 projets existants : `assets/legacy-projects.json` (généré par un convertisseur BeautifulSoup depuis les pages HTML) -> bouton « Importer » dans l'admin, arrivent en brouillons, les pages d'origine restent en ligne ; une fois publié, le projet DB remplace l'entrée legacy (dédoublonnage par slug dans `LT_DATA.loadAll`). Limite : Meublon/Flow State perdent la vidéo de carte d'accueil une fois publiés (carte = image de couverture). Vérifié avec un Supabase simulé (jamais testé avec le vrai).

- 2026-10-02 — Supabase branché : projet `ljwgtguirnatdbgxfyuh`, clé
  publique (publishable) dans `assets/config.js`, tables et stockage créés
  via `supabase/setup.sql` (exécuté en 3 blocs depuis un téléphone).
  Vérifié depuis ici : lecture publique OK (tables vides), **écriture
  anonyme refusée par la RLS** (HTTP 401). Compte administrateur créé à la
  main par Léo dans Supabase (jamais testé ici : la connexion n'a pas été
  essayée avec le vrai mot de passe). Reste à tester la connexion + un
  premier projet une fois le site en ligne. Le mot de passe n'est stocké
  nulle part dans le dépôt.
- 2026-10-02 — **Mode administrateur (mini-CMS)** : voir la section dédiée
  ci-dessus. Ajoute `admin.html`, `projet.html`, `assets/{config,lt-data,
  lt-auth,star,admin,admin-templates,project-render}.js`,
  `assets/project-page.css`, `supabase/{setup.sql,INSTALLATION.md}`.
  Refactor de `index.html` : construction des bandes travaux dans
  `build()`, id de carte = slug, vidéos re-câblables, étoile + fusion avec
  la base. `projets.html` lit désormais `lt-data.js` et inclut les projets
  créés. Page de confidentialité mise à jour (Supabase, Infomaniak,
  session admin).
- 2026-10-02 — `projets.html` : menu "Trier" (ordre du portfolio, date du
  plus récent / du plus ancien, alphabétique A→Z / Z→A), combinable avec
  le filtre par catégorie. La date des projets ("Sept. 2026") est
  convertie en clé numérique par `dateKey()` (table `MONTHS`) : tout
  nouveau mois abrégé utilisé dans une date doit y figurer.
- 2026-10-02 — "Plus de travaux" (section travaux de `index.html`) ne mène
  plus à Instagram (le lien Instagram du bas de la section Contact reste) :
  il ouvre la nouvelle page `projets.html`, un répertoire en grille des
  11 projets, filtrable par catégorie (Tous / Des vrais clients / Marques
  fictives / Affiches / Sport design / Édition & print ; `#sport` etc. dans
  l'URL pré-filtre). Icône du lien : Instagram → grille. **La liste des
  projets est dupliquée** dans le script de `projets.html` (`FAMILIES`) et
  dans `TRAVAUX_FAMILIES` de `index.html` : pour ajouter un projet, le
  modifier aux deux endroits (+ les pages projet et "Autres projets").
- 2026-10-02 — (1) **Annule** le petit portrait à droite de "Léo" sur
  mobile (malentendu client) : retour exact au portrait grand, centré et
  coupé par le bandeau — la demande réelle ("petit à droite de mon prénom")
  reste à clarifier avec le client avant de retoucher. (2) Ajoute
  `confidentialite.html` : déclaration de protection des données (LPD
  suisse : responsable, données traitées, FormSubmit, Google Fonts,
  communication à l'étranger, conservation, droits, PFPDT, droit d'auteur,
  exclusion de responsabilité), liée depuis le pied de page de TOUTES les
  pages et sous le formulaire de contact. Aucun cookie/traceur sur le site
  (vérifié) ; si un outil de stats, une police locale ou un nouvel
  hébergeur change, mettre cette page à jour. Texte rédigé comme modèle,
  pas un avis juridique ; l'hébergeur n'y est pas nommé.
- 2026-10-02 — (1) Mobile : le portrait devient petit et se place à droite
  du prénom "Léo" (même hauteur qu'une ligne du nom, ratio 667/788 fixé sur
  le lien) — plus grand, centré ni coupé par le bandeau. (2) `apropos.html`
  : les boutons CV / Portfolio physique sont désactivés ("Pas encore
  disponible · en cours de finalisation") ; AUCUN PDF n'est dans le dépôt
  (le CV contient adresse/téléphone/date de naissance — un push avec ce
  fichier avait été bloqué, le client a préféré attendre). (3) Formulaire
  de contact : envoi via l'endpoint AJAX de FormSubmit
  (`https://formsubmit.co/ajax/leo.tache.09@gmail.com`, JSON) avec message
  de confirmation/erreur dans la page (`#cfStatus`), honeypot `_honey`,
  `_captcha=false`, champ `email` (devient automatiquement l'adresse de
  réponse). Sans JS : POST classique vers FormSubmit. **À faire une fois
  par Léo : le premier envoi déclenche un email d'activation de FormSubmit
  à valider dans la boîte `leo.tache.09@gmail.com`, sinon les messages ne
  sont pas livrés** (le formulaire affichera alors l'erreur). Testé avec un
  faux `fetch` uniquement (aucun vrai message envoyé).
- 2026-10-02 — `apropos.html` : ajoute en bas deux boutons de
  téléchargement (`assets/cv-leo-tache.pdf`, copie de `Bureau/cv.pdf`, et
  `assets/portfolio-physique-leo-tache.pdf`, copie de `Bureau/portfolio
  leo tahce.pdf`, 24 pages, 11 Mo) ; **le CV publié contient adresse,
  téléphone et date de naissance** (publication voulue par le client).
  Retire la section Loisirs, les tags "Communication visuelle" et "CPNV
  Sainte-Croix", et TOUTES les lignes horizontales de la page (bordures
  de sections, séparateurs des compétences, traits des eyebrows, bordure
  du header). Numérotation : 01 Expérience, 02 Compétences, 03 Ce que je
  fais. Pour mettre à jour un PDF : recopier le fichier au même chemin.
- 2026-10-02 — `apropos.html`, retours client : logo (`logo-black.png`,
  inversé) en haut à gauche du header (lien vers `index.html`), le lien
  "← Portfolio" passe à droite ; Expérience = un court texte ("lancé en
  freelance en parallèle des cours pour élargir mes connaissances…", avec
  liens AFMBB/Chearn) à la place de la liste datée ; section Parcours
  retirée (déjà dans la one-page) ; Compétences refaite en lignes
  "étiquette + pastilles" (`.skill-rows`/`.chip`) ; phrase "exercices
  personnels" retirée ; Loisirs (fitness 5×/semaine, football fan de
  Chelsea) en petite section à part. Numérotation : 01 Expérience, 02
  Compétences, 03 Loisirs, 04 Ce que je fais.
- 2026-10-02 — `apropos.html` mise à jour depuis le CV du client
  (`cv.pdf`) : accroche et bio réécrites (médiamaticien en formation et
  graphiste freelance LT Design), tag "Graphiste freelance", nouvelle
  section **Expérience** (LT Design depuis mars 2026, AFMBB, Chearn — les
  deux derniers liés à leurs études de cas), CFC détaillé (2024 — 2028),
  nouvelle section **Compétences** (design, logiciels, web, bureautique,
  langues, loisirs). **Volontairement NON publié** (données personnelles
  du CV) : adresse, téléphone, date de naissance, email de la personne de
  référence (tiers, sans son accord), email `@lt-design.ch` (le formulaire
  de contact envoie vers `leo.tache.09@gmail.com`, non modifié), et les
  champs encore vides du CV (`[nom de l'établissement]`, `[années]`,
  `[lien]`).
- 2026-10-02 — **Vraie cause du "tout se casse après plusieurs allers-
  retours"** (cartes qui ne défilent plus, dégradé qui n'apparaît plus) :
  les scripts de scroll (dégradé/cartes des travaux, croissance du carré
  hero) reposaient sur une chaîne `requestAnimationFrame` qui se
  re-planifie elle-même, puis (commit précédent) sur un drapeau `running`
  pour l'arrêter/relancer. Dans les deux cas, **UN SEUL callback rAF perdu**
  (les navigateurs mobiles en abandonnent pendant les gestes tactiles et
  les changements de barre d'adresse) tue la chaîne définitivement — ou
  laisse le drapeau bloqué sur "en cours" sans que rien ne la relance :
  d'où un site qui marche, puis se fige au bout de quelques allers-
  retours. Réécrit en **événementiel** : `scroll`/`touchstart`/
  `touchmove`/`touchend`/`resize`/`orientationchange` appellent
  `update()` DIRECTEMENT (synchrone, zéro dépendance à rAF → rien ne peut
  mourir), plus une courte boucle rAF de lissage (inertie du doigt) qui
  s'éteint seule 400 ms après le dernier évènement et que le prochain
  évènement relance via un chien de garde sur l'âge du dernier tour
  (`lastActivity - lastLoop > 150`). Plus aucun coût au repos. Même
  traitement pour le script du carré hero. **Règle à retenir : ne jamais
  piloter une animation au scroll avec une chaîne rAF auto-reprogrammée
  ou un drapeau d'état — toujours des évènements + garde-fou.** Vérifié :
  bas → haut → catégorie 3 enchaînés avec rendu forcé, couleur et
  position corrects, aucune erreur console.
- 2026-10-02 — Précision client : le souci apparaît en descendant jusqu'à
  Contact puis en remontant. Trouvé la vraie cause probable : la boucle
  `requestAnimationFrame` du dégradé de fond des travaux tournait en
  continu, 60×/seconde, **pour toute la durée de vie de la page** — y
  compris en restant immobile tout en bas sur Contact, à ne rien faire de
  visible (couleur déjà figée au noir). Tout ce travail de fond (5
  lectures de mise en page par image, indéfiniment) pouvait créer un
  à-coup juste au moment de reprendre le scroll vers le haut. La boucle
  s'arrête maintenant une fois largement repassé sous les travaux (marge
  d'un écran) et se relance via un simple listener `scroll`/`touchstart`
  (bien moins coûteux qu'une boucle perpétuelle) dès qu'on se rapproche à
  nouveau — `touchstart` en plus de `scroll` pour relancer dès que le
  doigt touche l'écran, avant même le premier pixel de défilement.
  Vérifié : après un arrêt (simulé en forçant le scroll tout en bas), la
  couleur et la position des cartes se remettent bien à jour correctement
  en remontant.
- 2026-10-02 — Retour client : toujours un souci en remontant dans les
  travaux malgré le cache de `maxTravel`. Trouvé une 2e source de travail
  redondant dans le même `tick()` : `getBoundingClientRect()` était
  appelé une seconde fois pour la première et la dernière bande (`first`/
  `last`, utilisées pour les bornes du dégradé), en plus de l'appel déjà
  fait pour elles dans la boucle `forEach` — un appel de mise en page en
  trop, par frame, pour rien. Réutilise maintenant le `rect` déjà calculé
  dans la boucle (tableau `rects`) au lieu de le relire. Vérifié par un
  test programmatique (position + couleur identiques en descendant vs. en
  remontant jusqu'au même point de scroll) : aucun bug de calcul, donc ce
  qui reste est bien une question de performance pendant le geste, pas de
  logique. Si ça persiste après ce commit, il faudra des précisions
  précises (ça saccade visuellement, ou le scroll s'arrête net ?) pour
  cibler la suite — toutes les pistes de calcul ont été vérifiées
  correctes.
- 2026-10-02 — Retour client : "presque", léger bug/saccade en remontant
  dans les travaux (défilement horizontal des cartes + dégradé de fond).
  Optimisation de perf trouvée dans `tick()` (#travaux) : `getComputedStyle`
  + lecture de `scrollWidth`/`clientWidth` pour calculer la distance de
  défilement horizontal de chaque bande (`maxTravel`) tournaient à CHAQUE
  frame, pour les 5 bandes, en continu, pour toute la durée de vie de la
  page — un gros travail de mise en page répété 60×/seconde qui pouvait
  saccader le scroll, surtout perceptible pendant un geste rapide (flick
  vers le haut) sur un CPU mobile plus faible. `maxTravel` ne dépend que de
  la largeur des cartes/de l'écran, jamais du scroll : calculé une seule
  fois (+ au resize, + une fois après le chargement complet par sécurité)
  au lieu de chaque frame. Vérifié : les cartes continuent de glisser
  normalement avec les valeurs mises en cache.
- 2026-10-02 — Confirmé : plus de blocage au scroll. Dernier réglage
  demandé : sur mobile, les cartes travaux sont plus petites qu'au
  desktop, donc chaque catégorie occupait moins de hauteur de page — le
  dégradé de fond (calé sur le centre de chaque catégorie) changeait de
  couleur trop vite par rapport au défilement et n'avait jamais vraiment
  le temps de se stabiliser sur une couleur pleine avant la suivante.
  Augmente l'espacement vertical entre catégories sur mobile
  (`.tv-cat{padding}` : `var(--unit)*4.5` → `*7`) pour laisser au dégradé
  le temps de suivre confortablement. Uniquement mobile, desktop
  inchangé.
- 2026-10-02 — Retour client persistant : "je ne peux pas remonter la
  page" (scroll vers le haut bloqué) malgré tous les correctifs
  précédents. Suspect principal identifié : le script qui plafonne la
  vitesse de scroll molette/trackpad (`addEventListener('wheel', ...,
  {passive:false})` + `preventDefault()`) est le SEUL endroit du site qui
  prend la main sur le scroll natif. En théorie les évènements `wheel` ne
  sont émis que par une souris/un trackpad, jamais par un doigt sur un
  écran tactile — mais par prudence, ce script est maintenant strictement
  réservé aux appareils à pointeur fin (`(hover: none), (pointer: coarse)`
  → ne s'exécute pas du tout). Vérifié : s'exécute toujours normalement
  sur un pointeur fin (desktop), donc aucun changement là où ça marchait.
- 2026-10-01 — Retour client (capture d'écran) : fond violet (couleur
  "Marques fictives") qui persistait derrière Parcours et le formulaire
  Contact sur téléphone, au lieu de redevenir noir. Cause : ces sections
  n'avaient jamais leur propre couleur de fond, elles affichaient
  simplement celle du `<body>`, pilotée en JS par le dégradé des travaux —
  si ce script reste "coincé" sur une couleur de catégorie au lieu de
  revenir au noir de base une fois les travaux dépassés, tout ce qui suit
  hérite de la mauvaise couleur. Corrigé en donnant à `#parcours`,
  `#contact` et `footer` leur propre `background-color: var(--paper)` —
  immunisés contre ce bug quelle qu'en soit la cause exacte côté JS.
  Vérifié : même en forçant le fond du body à rester violet, ces trois
  sections restent correctement noires. S'applique partout (pas
  seulement mobile), sans rien changer visuellement là où ça marchait
  déjà (la couleur de secours est identique à celle du body à cet
  endroit).
- 2026-10-01 — Retour client : descendre fonctionne, mais remonter se
  bloque en arrivant en bas (les couleurs qui s'activent — "dégradés" —
  semblent en cause). Sur demande explicite, retire en plus toutes les
  animations d'apparition de "Mon parcours" sur mobile (fondu des étapes
  de la timeline, halo des points sur la carte du canton) : tout est
  visible d'emblée, sans transition, en plus de ne plus être épinglé.
  Uniquement mobile, desktop inchangé (toujours animé).
- 2026-10-01 — Retour client : "toujours quelque chose qui bloque" après
  le correctif ci-dessous. Vérifié en profondeur : un `scrollTo`
  programmatique direct atteint bien le footer/contact sans accroc (donc
  la mise en page/la hauteur réelle du document n'est plus en cause), ce
  qui pointe plutôt vers le geste tactile lui-même. Aucun gestionnaire
  `touchmove`/`preventDefault` trouvé dans le code qui pourrait intercepter
  un swipe vertical. Durcit quand même par prudence : `touch-action:pan-y`
  sur `body` (garantit qu'aucun élément ne puisse jamais capturer le swipe
  vertical) et `overflow:visible` sur `.parcours-track`/`.parcours-stage`
  en mobile (`overflow:hidden` était un reliquat de la version épinglée,
  inutile maintenant que la section est en flux normal). **Si ça persiste
  malgré tout après ce commit, forte suspicion de cache navigateur** :
  contrairement à desktop (Ctrl+Maj+R), un téléphone doit être testé en
  fermant complètement l'onglet/l'appli et en le rouvrant, un simple
  "retour" ou "actualiser" ne suffit souvent pas sur mobile.
- 2026-10-01 — Le passage à `svh` ne suffisait pas : toujours impossible
  d'atteindre Contact sur téléphone ("bug vers Mon parcours"). Au lieu de
  continuer à ajuster l'épinglage, applique la leçon déjà tirée pour les
  travaux (voir CLAUDE.md, "la caméra se bloque") : **désactive
  complètement le `position:sticky` sous 760px**. `.parcours-track`
  (hauteur normale) et `.parcours-stage` (`position:static`) redeviennent
  un bloc de flux normal qui défile comme le reste de la page ; le script
  dédié saute directement à "tout est atteint" sans animation liée au
  scroll (même chemin que `prefers-reduced-motion`). Revert au passage
  l'ancienne mise en page mobile de la timeline (items empilés un par un
  en `position:absolute`, pensée pour l'épinglage) vers la mise en page de
  base (liste verticale normale), sinon seule la dernière étape restait
  visible. Piège rencontré en l'écrivant : avoir mis la règle de
  désactivation dans le mauvais bloc `@media` (plus haut dans le fichier
  que la règle de base qu'elle devait écraser) ne suffisait pas — voir
  "Pièges connus" plus haut, même cause que pour le header.
- 2026-10-01 — Deux bugs mobile trouvés et corrigés après nouveaux
  retours client :
  - **Header toujours invisible** malgré trois tentatives de rétrécir le
    texte (paliers fixes, puis fluide en `vw`) : abandon complet de cette
    approche. Sur mobile, le header devient un bouton **hamburger**
    (`#navToggle`) qui ouvre un panneau plein largeur avec les 3 liens
    empilés en grand (`#navLinks.is-open`) — un bouton de taille fixe
    (34×34px) ne peut pas déborder, quelle que soit la largeur du
    téléphone, contrairement à du texte qui doit toujours être rétréci
    "juste assez". Desktop inchangé (bouton caché par défaut, menu
    toujours affiché en ligne au-dessus de 640px).
  - **Impossible de scroller plus loin que "Mon parcours"** : la section
    utilise un `position:sticky` "bloqué" pendant `360vh` de scroll
    (`.parcours-track`/`.parcours-stage`, voir Mécanismes clés). Sur
    mobile, `100vh` inclut l'espace caché derrière la barre d'adresse qui
    se rétracte pendant le scroll, donc la zone collée devenait réellement
    plus haute que ce qui est visible à l'écran — il fallait faire
    défiler une portion invisible avant que la section se libère, ce qui
    donnait l'impression d'un blocage. Remplacé `100vh`/`360vh` par
    `100svh`/`360svh` (small viewport height, la valeur stable qui ne
    bouge pas avec la barre d'adresse) — vérifié : la hauteur de la zone
    collée passe de l'ancienne valeur instable à une valeur fixe et
    cohérente avec l'écran réellement visible.
- 2026-10-01 — Mobile, retours client après test sur téléphone réel :
  - Header `Travaux/Parcours/Contact` toujours invisible malgré le
    resserrement précédent : ajoute `-webkit-text-size-adjust:100%`
    (certains navigateurs mobiles agrandissent le texte tout seuls, ce qui
    ne se voit pas dans les outils de dev classiques) + `flex-wrap` en
    filet de sécurité sur le header (repasse sur 2 lignes plutôt que de
    déborder hors cadre si jamais ça ne suffit toujours pas) + police et
    gap encore réduits sous 480px.
  - Le bandeau "Mes travaux." revient à un bleu uni (le dégradé essayé
    juste avant faisait "bizarre" au retour client).
  - La croissance du bandeau au scroll ("transition pas nickel") : le
    calcul de l'échelle max (`computeScale` dans le script du carré hero)
    se basait sur la LARGEUR du pavé, ce qui marchait bien pour le petit
    pavé centré du desktop mais sous-estimait largement l'échelle
    nécessaire pour le bandeau mobile, déjà pleine largeur — la croissance
    n'atteignait jamais le haut de l'écran avant de s'effacer. Corrigé en
    basant le calcul sur la plus petite des deux dimensions (sa hauteur,
    sur mobile), mais uniquement sous 640px de large pour ne pas changer
    le calcul desktop déjà validé.
  - Signalé : la section "Autres projets" semblait absente sous
    `afmbb.html`. Vérifié dans le code et en rechargement forcé : elle est
    bien présente et bien formée (markup identique aux 10 autres pages,
    images valides) — probablement une page mise en cache côté téléphone
    (voir le piège de cache documenté plus haut) plutôt qu'un vrai bug ;
    à reconfirmer après un Ctrl+Maj+R / fermeture-réouverture de l'onglet.
- 2026-10-01 — Mobile : portrait encore agrandi (jusqu'à 520px) et
  volontairement coupé en bas par le bandeau "Mes travaux." (retour au
  même ordre d'empilement que le desktop : bandeau `z-index:3` au-dessus
  du portrait `z-index:2`, portrait ancré `bottom:0` comme le bandeau, au
  lieu de l'écart fixe au-dessus ajouté précédemment — changement de
  direction demandé par le client après avoir vu le rendu). Corrige au
  passage un vrai bug découvert à cette occasion : `.cover-portrait`
  utilisait `width:auto` + le `max-width:100%` global des `<img>`, qui se
  résolvait mal sur `.cover-portrait-link` en position absolue sans
  largeur propre — l'image rendait deux fois trop étroite et son bas
  n'atteignait jamais le bandeau quelle que soit la hauteur demandée.
  Fixé en donnant au lien un `aspect-ratio: 667/788` explicite (le ratio
  réel du fichier portrait) et `width:100%` sur l'image.
- 2026-10-01 — Mobile : portrait plus grand et centré (au lieu d'ancré à
  droite) ; nom "Léo Tâche" plus grand et plus aéré (`line-height:1.08`
  au lieu de `.86`) ; le bandeau "Mes travaux." passe d'un bleu plat à un
  dégradé (plus sombre en haut, bleu plein en bas) pour se raccorder en
  douceur avec le noir du hero juste au-dessus. Uniquement sur mobile.
- 2026-10-01 — Mobile : refonte du hero au repos sur maquette client.
  "Mes travaux." n'est plus un pavé flottant centré mais un bandeau pleine
  largeur collé en bas de l'écran (`left/right:0`, plus de `border-radius`
  ni de `transform:translateX`) ; le portrait est ancré juste au-dessus,
  avec le même écart fixe que pour le haut (`clamp(64px,9vh,96px)` du
  bandeau + marge), donc toujours bien dégagé des deux côtés, sans
  chevauchement possible. La version desktop n'est pas touchée (tout est
  dans `@media (max-width:640px)`). L'animation de croissance/disparition
  au scroll n'a pas été modifiée, elle s'adapte automatiquement à la
  nouvelle forme (le script calcule la mise à l'échelle dynamiquement à
  partir de la taille réelle de l'élément).
- 2026-10-01 — Mobile : le portrait passe devant le carré "Mes travaux."
  (`z-index:4` contre `2`) au lieu de derrière. Pendant le scroll, le
  carré grandit (jusqu'à prendre tout l'écran) pendant que le portrait
  s'efface, et comme le carré passait devant, il semblait "couper" le
  corps en pleine transition. Le portrait reste maintenant au premier
  plan et se fond proprement par-dessus, sans jamais être tranché par le
  bord du carré. Uniquement sur mobile — la version desktop garde l'ordre
  inverse (le carré doit passer devant le nom/portrait en grandissant,
  comportement voulu, voir "Hero" plus haut).
- 2026-10-01 — Mobile : le carré "Mes travaux." chevauchait la tête du
  portrait (son bord bas tombait 30px plus bas que le haut du portrait).
  Corrigé en calculant le bas du carré avec exactement la même expression
  `clamp(190px, 34vh, 300px)` que la hauteur du portrait + une marge fixe
  (`var(--unit)*1.5`) : les deux valeurs se neutralisent, donc l'écart
  reste constant quelle que soit la hauteur réelle de l'écran — plus
  jamais de chevauchement, sans avoir à retoucher ces chiffres par essai-
  erreur pour chaque taille de téléphone.
- 2026-10-01 — Corrections mobile uniquement (la version desktop n'est pas
  touchée) : (1) header `Travaux/Parcours/Contact` resserré sous 480px
  (gap, police, padding) pour qu'il tienne sur les téléphones étroits ;
  (2) le dégradé de fond des travaux mettait `vh` (= `window.innerHeight`)
  en cache plutôt que de le relire à chaque frame — sur mobile, la barre
  d'adresse qui se rétracte pendant le scroll fait varier cette valeur en
  continu, ce qui faisait sauter le dégradé de façon erratique ; `vh`
  n'est maintenant remis à jour que sur un vrai resize/changement
  d'orientation ; (3) les paires de 2 images (`.two-up`, `.rs`,
  `.gallery`, et la grille "Autres projets" `.more-grid`) restent
  côte à côte sous 480-760px au lieu de s'empiler verticalement.
- 2026-10-01 — Section "Autres projets" allégée : retire le numéro
  d'eyebrow, le libellé "Autres projets", le titre "À voir aussi" et la
  date sous chaque carte (ne reste que l'image + le nom). Ajoute une
  relance robuste de lecture pour les vidéos des cartes travaux (Meublon,
  Flow State) et pour la vidéo héros de `meublon.html` : `autoplay` seul
  ne suffit pas toujours selon le navigateur/les réglages, donc un
  `IntersectionObserver` relance `.play()` à l'entrée dans le viewport,
  avec une dernière tentative à la première interaction utilisateur.
- 2026-10-01 — Corrige la navigation "Portfolio"/"Retour au portfolio" :
  les cartes de `#travaux` n'avaient pas d'`id`, donc les liens
  `index.html#<slug>` retombaient en haut de page au lieu de scroller
  jusqu'au bon projet. Ajoute une section "Autres projets" (2 suggestions,
  format "cover" avec voile gris + "Voir plus" au survol) en bas des 11
  pages projet.
- 2026-09-24 — Remplace `assets/leo-portrait.webp` par la nouvelle photo
  fournie par le client (même chemin, donc hero et `apropos.html` se mettent
  à jour ; le navigateur peut garder l'ancienne image en cache : Ctrl+Maj+R).
- 2026-09-24 — `richol.html` : retire la carte "La liberté" (il ne reste que
  "Ce qu'il m'a appris" dans le bloc `.outcome`).
- 2026-09-23 — Retire le voile sombre derrière "À propos" au survol du
  portrait (ne reste que le texte, avec un `text-shadow` pour la
  lisibilité à la place).
- 2026-09-23 — `#travaux` passe en `z-index:4` (au-dessus du carré "Mes
  travaux", `z-index:3`) : les projets restent visibles par-dessus dès le
  début de la section. Nom du hero en blanc entier (plus de bleu sur
  "Tâche") et encore agrandi (jusqu'à ~13rem). Ajoute un texte "À propos"
  qui apparaît (voile + légende, même principe que "Voir plus" sur les
  cartes projet) au survol direct du portrait.
- 2026-09-23 — Descend le nom du hero (padding-top de #cover :
  `calc(var(--unit)*7)` fixe -> `clamp(112px,24vh,320px)`, il était trop
  haut).
- 2026-09-23 — Portrait décalé du bord droit (`right:0` -> `right:clamp(16px,9vw,160px)`)
  pour respirer davantage ; le nom était déjà centré sur la page (vérifié :
  écart de quelques px seulement, négligeable).
- 2026-09-23 — Nom du hero encore agrandi (jusqu'à ~11.5rem) ; "LT Design"
  aligné sur le bord gauche du nom via un wrapper `.cover-title` en
  `inline-block` (centré comme bloc, `text-align:left` dedans) plutôt que
  centré indépendamment. `.cover-hint` passe en `z-index:3` (au-dessus du
  portrait) : en grandissant il passe maintenant devant lui. Le portrait
  s'efface en fondu au même rythme que la croissance du carré (`growT`
  dans le script de `#coverHint`), invisible pile quand le carré a fini
  de grandir / que le fond est devenu bleu.
- 2026-09-23 — Nom et "Mes travaux" recentrés (`text-align:center` sur
  `#cover`, `.cover-hint` de nouveau centré) ; lueur et portrait agrandis.
  Ajuste le décalage mobile de `.cover-hint` pour qu'il ne chevauche plus
  le portrait maintenant plus gros.
- 2026-09-23 — Refonte du hero sur maquette client : nom énorme, portrait
  bas-droite qui chevauche le texte, plus de logo/eyebrow/rôle. Portrait
  et lueur grossissent ensemble à l'approche de la souris, contour bleu
  net au survol direct. Corrige un bug d'héritage de custom property CSS
  et un `drop-shadow` à la syntaxe invalide.
- 2026-09-23 — Portrait de Léo dans le hero (photo détourée fournie par le
  client), avec lueur bleue au survol proportionnelle à la distance de la
  souris, cliquable vers la nouvelle page `apropos.html`. Renforce aussi
  le garde-fou de l'écran de chargement (le `requestAnimationFrame` de
  secours pouvait lui-même rester bloqué si l'onglet perdait le focus —
  remplacé par un `setTimeout` indépendant).
- 2026-09-23 — Ajoute ce fichier `CLAUDE.md` (mis à jour à chaque commit).
- 2026-09-23 — Icône Instagram sur "Plus de travaux" ; remplace le bouton
  mailto par un formulaire de contact (Nom/Email/Message) via FormSubmit.
- 2026-09-23 — Favicon (logo noir), titre d'onglet "Léo Tâche, Portfolio",
  garde-fou 2s sur l'écran de chargement.
- 2026-09-22 — Plafonne la vitesse de scroll (molette/trackpad) ;
  resserre encore l'écart titre de catégorie ↔ projets.
- 2026-09-22 — Le masque horizontal des travaux atteint les bords réels
  de l'écran (plus limité à la colonne centrée de texte).
- 2026-09-22 — Rapproche les titres de catégorie des projets (boîte du
  titre en `max-width` au lieu de `width` fixe).
- 2026-09-22 — Retour à l'état du commit `d38eced` pour le défilement des
  travaux, après l'essai d'épinglage rejeté (voir section Travaux ci-dessus).
- 2026-09-21/22 — Logo du header cliquable (retour en haut), visionneuse
  plein écran sur les pages projet, écran de chargement fiabilisé, fond à
  croix du header, carré "Mes travaux" élargi (une seule ligne).
- 2026-09-21 — Mise à jour contact (délai 48h, nouvel email), refonte du
  bas de section (localisation + icônes Instagram/LinkedIn).
- 2026-09-20/21 — Nombreux réglages de la section Travaux (couleurs de
  catégories, carré hero, miroir Marques fictives/Sport design, aperçus
  au survol, vidéos Meublon/Flow State, dégradé de fond continu).
