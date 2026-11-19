/*
 * LT Design — réseaux sociaux : UNE seule liste pour tout le site.
 * Pour ajouter / modifier un réseau : changer NETS ci-dessous (un réseau sans adresse n'est pas affiché).
 *
 * - [data-lt-socials="footer"] : pastilles (icône + nom) du pied de page de l'accueil.
 * - [data-lt-follow]          : bloc « Un projet en tête ? » + bouton Contact + icônes rondes,
 *                               en bas de chaque page projet et de « Tous les projets ».
 * Les couleurs viennent des variables de la page (--ink, --line, --accent, --paper) : le bloc
 * prend automatiquement le thème de chaque projet (clair, sombre, couleur d'accent).
 */
(function(){
  var NETS = [
    { id:'instagram', label:'Instagram', handle:'@lt_design_09', url:'https://instagram.com/lt_design_09' },
    { id:'linkedin',  label:'LinkedIn',  handle:'Léo Tâche',     url:'https://www.linkedin.com/in/l%C3%A9o-t%C3%A2che-a55606406/' },
    { id:'facebook',  label:'Facebook',  handle:'LT Design',     url:'' /* À COMPLÉTER : adresse de la page Facebook */ }
  ].filter(function(n){ return !!n.url; });

  var SVG = ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICONS = {
    instagram: '<svg' + SVG + '><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    linkedin:  '<svg' + SVG + '><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    facebook:  '<svg' + SVG + '><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>'
  };
  window.LT_SOCIALS = NETS;

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; });
  }
  function link(n, cls, inner){
    return '<a class="' + cls + '" href="' + esc(n.url) + '" target="_blank" rel="noopener me" aria-label="' + esc(n.label) + ' (nouvel onglet)">' + inner + '</a>';
  }

  /* pied de page de l'accueil : remplace les liens écrits dans la page (Instagram, LinkedIn) par la liste complète */
  Array.prototype.forEach.call(document.querySelectorAll('[data-lt-socials="footer"]'), function(el){
    el.innerHTML = NETS.map(function(n){
      return link(n, 'ft-net', '<span>' + ICONS[n.id] + '</span>' + esc(n.label));
    }).join('');
  });

  /* bas des pages projet : « Un projet en tête ? » + Contact + réseaux */
  var follow = document.querySelectorAll('[data-lt-follow]');
  if (!follow.length) return;
  if (!document.getElementById('lt-follow-css')){
    var st = document.createElement('style');
    st.id = 'lt-follow-css';
    st.textContent =
      '.lt-follow{ max-width:calc(64px*18 + clamp(20px,5vw,64px)*2); margin:0 auto; padding:clamp(48px,8vw,88px) clamp(20px,5vw,64px) clamp(36px,6vw,64px); border-top:1px solid var(--line, rgba(127,127,127,.2)); text-align:center; color:var(--ink, #1d1d1b); }' +
      '.lt-follow-k{ margin:0 0 10px; font-family:"Roboto Mono",monospace; font-size:.72rem; letter-spacing:.14em; text-transform:uppercase; opacity:.6; }' +
      '.lt-follow-t{ margin:0 0 22px; font-family:"Archivo Black",sans-serif; font-weight:400; text-transform:uppercase; font-size:clamp(1.9rem,5.4vw,3.2rem); line-height:1; letter-spacing:-.01em; }' +
      '.lt-follow-cta{ display:inline-flex; align-items:center; gap:12px; padding:13px 14px 13px 26px; border-radius:999px; text-decoration:none; background:var(--accent, #189CD8); color:var(--on-accent, #fff); font-family:"Roboto Mono",monospace; font-size:.76rem; letter-spacing:.12em; text-transform:uppercase; box-shadow:0 10px 26px rgba(0,0,0,.18); transition:transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s; }' +
      '.lt-follow-cta:hover{ transform:translateY(-2px); box-shadow:0 16px 34px rgba(0,0,0,.24); }' +
      '.lt-follow-cta i{ width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.22); font-style:normal; }' +
      '.lt-follow-cta svg{ width:15px; height:15px; }' +
      '.lt-follow-nets{ display:flex; justify-content:center; flex-wrap:wrap; gap:12px; margin-top:26px; }' +
      '.lt-follow-net{ display:inline-flex; align-items:center; gap:9px; padding:7px 16px 7px 7px; border-radius:999px; text-decoration:none; color:inherit; border:1px solid var(--line, rgba(127,127,127,.25)); font-family:"Roboto Mono",monospace; font-size:.7rem; letter-spacing:.08em; text-transform:uppercase; transition:border-color .3s, color .3s, transform .3s cubic-bezier(.2,.7,.2,1); }' +
      '.lt-follow-net span{ width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid var(--line, rgba(127,127,127,.25)); }' +
      '.lt-follow-net svg{ width:16px; height:16px; }' +
      '.lt-follow-net:hover, .lt-follow-net:focus-visible{ border-color:var(--accent, #189CD8); color:var(--accent, #189CD8); transform:translateY(-2px); }' +
      '.lt-follow + footer{ border-top:none; }';
    document.head.appendChild(st);
  }
  var arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  Array.prototype.forEach.call(follow, function(el){
    el.classList.add('lt-follow');
    el.innerHTML =
      '<p class="lt-follow-k">Un projet en tête ?</p>' +
      '<p class="lt-follow-t">Parlons-en</p>' +
      '<a class="lt-follow-cta" href="index.html#contact">Me contacter <i>' + arrow + '</i></a>' +
      '<div class="lt-follow-nets">' + NETS.map(function(n){
        return link(n, 'lt-follow-net', '<span>' + ICONS[n.id] + '</span>' + esc(n.label));
      }).join('') + '</div>';
  });
})();
