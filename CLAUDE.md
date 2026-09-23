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
- À chaque changement validé : commit + push direct sur `main` (pas de
  branche, pas de PR — le propriétaire du repo travaille seul avec Claude).
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
- `assets/loader.js` — écran de chargement partagé (logo qui s'assemble +
  compteur %), inclus sur les 12 pages.
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

### Portrait du hero (`.cover-portrait-link`)
Photo détourée (fond transparent, vérifié) en flux normal entre le rôle
et le carré "Mes travaux" — **pas en position absolue plein-hero** : un
essai précédent la centrait en fond derrière le nom, ça le chevauchait
directement (voir capture ratée). Une lueur bleue (`.cover-portrait-glow`)
suit la distance souris↔portrait en continu (pas un simple survol),
pilotée par rAF avec sa propre custom property `--glow`. Cliquable, mène
à `apropos.html`.

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

## Changelog

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
