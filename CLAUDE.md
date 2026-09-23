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
