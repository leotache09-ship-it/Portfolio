/*
 * "Autres projets" en bas des pages projet d'origine : 2 projets tirés au
 * hasard (jamais celui affiché) + un bouton "Tous les projets".
 * Les cartes déjà présentes dans le HTML restent le repli si le script ne
 * peut pas s'exécuter. Dépend de assets/lt-data.js (inclus avant).
 */
(function(){
  var D = window.LT_DATA;
  var grid = document.querySelector('.more-grid');
  if (!D || !grid) return;
  var slug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');

  var css = document.createElement('style');
  css.textContent =
    '.more-all{ margin-top: calc(var(--unit,16px)*2); display:flex; justify-content:center; }' +
    '.more-all a{ display:inline-block; font-family:"Roboto Mono",monospace; font-size:.74rem; letter-spacing:.14em; text-transform:uppercase; text-decoration:none; color:var(--ink,#262121); border:1px solid currentColor; border-radius:999px; padding:13px 26px; transition:background .25s, color .25s; }' +
    '.more-all a svg{ width:1.15em; height:1.15em; margin:-3px 10px -3px 0; vertical-align:middle; }' +
    '.more-all a:hover{ background:var(--ink,#262121); color:var(--paper,#fff); }';
  document.head.appendChild(css);

  function addButton(){
    if (document.querySelector('.more-all')) return;
    var d = document.createElement('div');
    d.className = 'more-all';
    d.innerHTML = '<a href="projets.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>Tous les projets</a>';
    grid.parentNode.insertBefore(d, grid.nextSibling);
  }
  addButton();

  function shuffle(a){
    for (var i = a.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  D.loadAll().then(function(all){
    var pool = (all || []).filter(function(p){ return p && p.slug !== slug && p.img; });
    if (pool.length < 1) return;
    var picks = shuffle(pool.slice()).slice(0, 2);
    grid.innerHTML = picks.map(function(p){
      var name = D.plain(p.name);
      return '<a class="more-card" href="' + D.esc(p.href) + '"><span class="more-media">' +
        '<img src="' + D.esc(p.img) + '" alt="' + D.esc(name) + '" loading="lazy"' + (p.imgStyle ? ' style="' + D.esc(p.imgStyle) + '"' : '') + '>' +
        '<span class="more-veil"></span><span class="more-cta"><span>Voir plus</span></span></span>' +
        '<span class="more-info"><span class="more-name">' + D.esc(name) + '</span></span></a>';
    }).join('');
  }).catch(function(){});
})();
