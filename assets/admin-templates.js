/*
 * LT Design — mode créateur : types de blocs et modèles de pages.
 * Les modèles reprennent la structure des pages projet d'origine
 * (identité de marque = Richol/Chearn/AFMBB, affiche = Flow State/
 * Fragments of Silence, sport design = Riat/Rogers, édition = Magazine
 * Los Angeles/Sérigraphie).
 */
(function(){
  var RATIOS = [ ['', 'Taille d\'origine'], ['1:1', 'Carré 1:1'], ['4:5', 'Portrait 4:5'], ['3:4', 'Portrait 3:4'], ['3:2', 'Paysage 3:2'], ['16:9', 'Large 16:9'] ];
  var FIT = [ ['cover', 'Remplir (recadrer)'], ['contain', 'Tout afficher'] ];
  var IMG = [
    { k:'url', type:'image', label:'Image' },
    { k:'caption', type:'text', label:'Légende (facultatif)' },
    { k:'ratio', type:'select', label:'Format', options:RATIOS },
    { k:'fit', type:'select', label:'Cadrage (si format choisi)', options:FIT }
  ];
  var IMG_LIGHT = [ { k:'url', type:'image', label:'Image' }, { k:'caption', type:'text', label:'Légende (facultatif)' } ];

  /* définition des blocs : champs éditables + valeur par défaut */
  var BLOCKS = {
    title: { label:'Titre de section', hint:'Ouvre une nouvelle section numérotée.', icon:'H',
      fields:[ { k:'eyebrow', type:'text', label:'Petit titre (ex. Le brief)' }, { k:'text', type:'text', label:'Titre (utilise *mot* pour le colorer)' } ],
      blank:function(){ return { t:'title', eyebrow:'', text:'' }; } },
    text: { label:'Texte', hint:'Un ou plusieurs paragraphes.', icon:'¶',
      fields:[ { k:'text', type:'textarea', label:'Texte (ligne vide = nouveau paragraphe ; **gras** ; [lien](https://…))' } ],
      blank:function(){ return { t:'text', text:'' }; } },
    statement: { label:'Grande phrase', hint:'Phrase d\'impact en grandes lettres.', icon:'“',
      fields:[ { k:'text', type:'textarea', label:'Phrase (*mot* en couleur d\'accent)' } ],
      blank:function(){ return { t:'statement', text:'' }; } },
    image: { label:'Image', hint:'Une image, pleine largeur.', icon:'▭',
      fields:IMG, blank:function(){ return { t:'image', url:'', caption:'', ratio:'', fit:'cover' }; } },
    images2: { label:'Deux images', hint:'Côte à côte, même sur téléphone (avant/après…).', icon:'▯▯',
      fields:[ { k:'a', type:'group', label:'Image de gauche', fields:IMG_LIGHT }, { k:'b', type:'group', label:'Image de droite', fields:IMG_LIGHT } ],
      blank:function(){ return { t:'images2', a:{ url:'', caption:'' }, b:{ url:'', caption:'' } }; } },
    gallery: { label:'Galerie', hint:'Grille de 2 à 4 colonnes.', icon:'▦',
      fields:[ { k:'cols', type:'select', label:'Colonnes', options:[ ['2','2 colonnes'], ['3','3 colonnes'], ['4','4 colonnes'] ] },
               { k:'items', type:'list', label:'Images', addLabel:'Ajouter une image', min:1, item:IMG_LIGHT, blank:function(){ return { url:'', caption:'' }; } } ],
      blank:function(){ return { t:'gallery', cols:'3', items:[ { url:'', caption:'' }, { url:'', caption:'' }, { url:'', caption:'' } ] }; } },
    split: { label:'Texte + image', hint:'Un texte à côté d\'une image.', icon:'▤▯',
      fields:[ { k:'side', type:'select', label:'Image à…', options:[ ['right','Droite'], ['left','Gauche'] ] },
               { k:'text', type:'textarea', label:'Texte' },
               { k:'image', type:'group', label:'Image', fields:IMG_LIGHT } ],
      blank:function(){ return { t:'split', side:'right', text:'', image:{ url:'', caption:'' } }; } },
    palette: { label:'Palette de couleurs', hint:'Pastilles de couleurs avec nom et code.', icon:'◐',
      fields:[ { k:'colors', type:'list', label:'Couleurs', addLabel:'Ajouter une couleur', min:1,
                 item:[ { k:'name', type:'text', label:'Nom' }, { k:'hex', type:'color', label:'Couleur' }, { k:'extra', type:'text', label:'Détail (ex. Pantone 179 C)' } ],
                 blank:function(){ return { name:'', hex:'#189CD8', extra:'' }; } } ],
      blank:function(){ return { t:'palette', colors:[ { name:'Couleur 1', hex:'#189CD8', extra:'' }, { name:'Couleur 2', hex:'#1d1d1b', extra:'' } ] }; } },
    facts: { label:'Fiche', hint:'Infos clés (client, durée, outils…).', icon:'☰',
      fields:[ { k:'items', type:'list', label:'Lignes', addLabel:'Ajouter une ligne', min:1,
                 item:[ { k:'k', type:'text', label:'Intitulé (ex. Durée)' }, { k:'v', type:'text', label:'Valeur' } ],
                 blank:function(){ return { k:'', v:'' }; } } ],
      blank:function(){ return { t:'facts', items:[ { k:'Client', v:'' }, { k:'Durée', v:'' }, { k:'Outils', v:'' } ] }; } },
    cards: { label:'Cartes (résultat)', hint:'Petites cartes de texte : ce que j\'ai appris, retour client…', icon:'▢',
      fields:[ { k:'items', type:'list', label:'Cartes', addLabel:'Ajouter une carte', min:1,
                 item:[ { k:'k', type:'text', label:'Titre de la carte' }, { k:'v', type:'textarea', label:'Texte' } ],
                 blank:function(){ return { k:'', v:'' }; } } ],
      blank:function(){ return { t:'cards', items:[ { k:'Ce que j\'ai appris', v:'' } ] }; } },
    video: { label:'Vidéo', hint:'Fichier vidéo (mp4, 50 Mo max).', icon:'▶',
      fields:[ { k:'url', type:'video', label:'Vidéo (mp4)' }, { k:'poster', type:'image', label:'Image d\'aperçu (facultatif)' },
               { k:'caption', type:'text', label:'Légende (facultatif)' }, { k:'loop', type:'bool', label:'Lecture en boucle, sans son, automatique' } ],
      blank:function(){ return { t:'video', url:'', poster:'', caption:'', loop:false }; } }
  };

  function B(t, over){ var b = BLOCKS[t].blank(); for (var k in (over || {})) b[k] = over[k]; return b; }
  var img = { url:'', caption:'' };

  var TEMPLATES = [
    { id:'blank', name:'Page vierge', desc:'Tu pars de zéro et ajoutes les blocs que tu veux.',
      theme:{ mode:'light', accent:'#189CD8', paper:'' }, meta:{ lede:'', hero_image:'' }, blocks:[] },
    { id:'identite', name:'Identité de marque', desc:'Comme Richol, Chearn ou AFMBB : brief, logo, couleurs, déclinaisons, résultat.',
      theme:{ mode:'light', accent:'#db6661', paper:'' }, meta:{ lede:'Décris le projet en deux phrases : pour qui, et ce que tu as créé.', hero_image:'' },
      blocks:[
        B('title', { eyebrow:'Le brief', text:'Ce que le client attendait' }),
        B('text', { text:'Explique le contexte, la demande et les contraintes du projet.' }),
        B('split', { side:'right', text:'Présente l\'idée de départ : pourquoi ce logo, ce nom, ce style.' }),
        B('title', { eyebrow:'Le logo', text:'Le logo et sa construction' }),
        B('image', { ratio:'', fit:'cover' }),
        B('gallery', { cols:'4', items:[ {url:'',caption:'Version 1'}, {url:'',caption:'Version 2'}, {url:'',caption:'Version 3'}, {url:'',caption:'Version 4'} ] }),
        B('title', { eyebrow:'Les couleurs', text:'La palette' }),
        B('palette', { colors:[ { name:'Couleur principale', hex:'#db6661', extra:'' }, { name:'Couleur sombre', hex:'#590300', extra:'' }, { name:'Couleur neutre', hex:'#262121', extra:'' } ] }),
        B('title', { eyebrow:'Les déclinaisons', text:'Le logo en situation' }),
        B('images2', { a:{ url:'', caption:'Support 1' }, b:{ url:'', caption:'Support 2' } }),
        B('title', { eyebrow:'Le résultat', text:'Ce que j\'en retiens' }),
        B('cards', { items:[ { k:'Retour client', v:'' }, { k:'Ce que j\'ai appris', v:'' } ] })
      ] },
    { id:'affiche', name:'Affiche', desc:'Comme Flow State ou Fragments of Silence : grande phrase, affiche, construction, avant/après.',
      theme:{ mode:'light', accent:'#b7260e', paper:'' }, meta:{ lede:'Une phrase pour présenter l\'affiche et son sujet.', hero_image:'' },
      blocks:[
        B('statement', { text:'Une grande phrase qui résume l\'idée de l\'*affiche*.' }),
        B('image', { ratio:'', fit:'cover' }),
        B('title', { eyebrow:'La construction', text:'De l\'idée à l\'affiche' }),
        B('split', { side:'left', text:'Raconte comment l\'affiche est construite : grille, typographie, couleurs.' }),
        B('title', { eyebrow:'Avant / après', text:'La retouche' }),
        B('images2', { a:{ url:'', caption:'Avant' }, b:{ url:'', caption:'Après' } }),
        B('video'),
        B('title', { eyebrow:'Le résultat', text:'Ce que j\'en retiens' }),
        B('cards', { items:[ { k:'Ce que j\'ai appris', v:'' } ] })
      ] },
    { id:'sport', name:'Sport design', desc:'Comme Damien Riat ou Morgan Rogers : fond sombre, affiche, avant/après, résultat.',
      theme:{ mode:'dark', accent:'#e02222', paper:'' }, meta:{ lede:'Le joueur, le club, l\'idée de l\'affiche.', hero_image:'' },
      blocks:[
        B('split', { side:'right', text:'Présente le sujet : qui, quel sport, pourquoi ce choix.' }),
        B('title', { eyebrow:'Le vrai travail', text:'Le détourage, c\'est bien. *La retouche, c\'est mieux.*' }),
        B('text', { text:'Explique le montage, l\'étalonnage et les choix de couleurs.' }),
        B('images2', { a:{ url:'', caption:'Montage brut' }, b:{ url:'', caption:'Affiche finale' } }),
        B('title', { eyebrow:'Le résultat', text:'' }),
        B('statement', { text:'Une phrase de conclusion *percutante*.' }),
        B('cards', { items:[ { k:'Temps passé', v:'' }, { k:'Ce que j\'ai appris', v:'' } ] })
      ] },
    { id:'edition', name:'Édition & print', desc:'Comme Magazine Los Angeles ou Sérigraphie : mise en page, doubles-pages, fiche technique.',
      theme:{ mode:'light', accent:'#16A085', paper:'' }, meta:{ lede:'Le support, le format, le sujet traité.', hero_image:'' },
      blocks:[
        B('title', { eyebrow:'Le projet', text:'Le brief' }),
        B('text', { text:'Présente le projet d\'édition : format, nombre de pages, public visé.' }),
        B('facts', { items:[ { k:'Format', v:'' }, { k:'Pages', v:'' }, { k:'Outils', v:'InDesign, Illustrator' } ] }),
        B('title', { eyebrow:'La grille', text:'Les pages' }),
        B('gallery', { cols:'3', items:[ {url:'',caption:''}, {url:'',caption:''}, {url:'',caption:''}, {url:'',caption:''}, {url:'',caption:''}, {url:'',caption:''} ] }),
        B('images2', { a:{ url:'', caption:'Le livre ouvert' }, b:{ url:'', caption:'Le livre imprimé' } }),
        B('title', { eyebrow:'Le résultat', text:'Ce que j\'en retiens' }),
        B('cards', { items:[ { k:'Ce que j\'ai appris', v:'' } ] })
      ] }
  ];

  window.LT_TEMPLATES = { BLOCKS: BLOCKS, TEMPLATES: TEMPLATES, RATIOS: RATIOS };
})();
