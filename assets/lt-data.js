/*
 * LT Design — données partagées (projets d'origine + projets créés dans le
 * mode administrateur) et accès en lecture publique à Supabase.
 *
 * - Les 11 projets d'origine sont décrits ici (copie de TRAVAUX_FAMILIES de
 *   index.html : si tu en ajoutes un à la main, modifie les deux).
 * - Les projets créés dans le mode administrateur vivent dans Supabase
 *   (table `projects`), la composition de la page principale dans la table
 *   `site_settings` (clé "home"). Lecture publique en simple `fetch` REST :
 *   aucune bibliothèque chargée pour les visiteurs.
 * - Si Supabase n'est pas configuré (assets/config.js vide) ou injoignable,
 *   tout continue de fonctionner avec les seuls projets d'origine.
 */
(function(){
  var CFG = window.LT_CONFIG || {};

  var CATS = [
    { id:'clients',  title:'Des vrais clients', homeTitle:'Des vrais clients.',  color:'#189CD8' },
    { id:'fictives', title:'Marques fictives',  homeTitle:'Marques fictives.',   color:'#A855F7' },
    { id:'affiches', title:'Affiches',          homeTitle:'Affiches.',           color:'#E5B800' },
    { id:'sport',    title:'Sport design',      homeTitle:'Sport design.',       color:'#FF5A1F' },
    { id:'edition',  title:'Édition & print',   homeTitle:'Édition &amp; print.', color:'#16A085' }
  ];

  /* projets d'origine, dans l'ordre d'affichage par défaut */
  var LEGACY = [
    { cat:'clients',  name:'Chearn', href:'chearn.html', img:'assets/chearn/cover.jpg', peek:'assets/chearn/flatlay.jpg', ar:'1080/1380', date:'Avril 2026' },
    { cat:'clients',  name:'AFMBB', href:'afmbb.html', img:'assets/afmbb/logo.jpg', peek:'assets/afmbb/flyer.jpg', ar:'900/1150', date:'Avril 2026' },
    { cat:'clients',  name:"La Partie<br>d'Ailleurs", href:'partie-ailleurs.html', img:'assets/partie-ailleurs/thumb.jpg', peek:'assets/partie-ailleurs/rollup-parmi.jpg', ar:'878/1122', date:'Mars 2026' },
    { cat:'fictives', name:'Richol', href:'richol.html', img:'assets/richol/fraise-can.jpg', peek:'assets/richol/limoncello-photo.jpg', ar:'1080/1380', date:'Avril 2026' },
    { cat:'fictives', name:'Meublon', href:'meublon.html', video:'assets/meublon/meublon.mp4', img:'assets/meublon/hover.jpg', peek:'assets/meublon/hover.jpg', ar:'1080/1380', date:'Sept. 2026' },
    { cat:'affiches', name:'Flow State', href:'cervin.html', video:'assets/cervin/cervin.mp4', img:'assets/cervin/poster.jpg', peek:'assets/cervin/poster.jpg', ar:'2480/3508', date:'Juin 2026' },
    { cat:'affiches', name:'Fragments<br>of Silence', href:'fragments.html', img:'assets/fragments/mockup.jpg', peek:'assets/fragments/construction.jpg', ar:'2480/3508', date:'Mars 2026' },
    { cat:'sport',    name:'Damien Riat', href:'riat.html', img:'assets/riat/poster.jpg', peek:'assets/riat/poster-brut.jpg', ar:'1417/1811', date:'Sept. 2026' },
    { cat:'sport',    name:'Morgan Rogers', href:'rogers.html', img:'assets/rogers/poster.jpg', peek:'assets/rogers/poster-brut.jpg', ar:'1134/1417', date:'Sept. 2026' },
    { cat:'edition',  name:'Sérigraphie &amp;<br>Tampographie', href:'serigraphie.html', img:'assets/serigraphie/cover-mockup.jpg', peek:'assets/serigraphie/dos-mockup.jpg', ar:'1500/1125', date:'Juin 2026', mw:'min(50vw,290px)' },
    { cat:'edition',  name:'Magazine<br>Los Angeles', href:'losangeles.html', img:'assets/losangeles/mockup-histoire.jpg', peek:'assets/losangeles/mockup-sommaire.jpg', ar:'1500/1125', date:'Mars 2026', mw:'min(50vw,290px)' }
  ];
  LEGACY.forEach(function(p){ p.slug = p.href.replace(/\.html$/, ''); p.legacy = true; });

  var MONTHS = { 'janv.':1, 'févr.':2, 'mars':3, 'avril':4, 'mai':5, 'juin':6, 'juil.':7, 'août':8, 'sept.':9, 'oct.':10, 'nov.':11, 'déc.':12 };
  function dateKey(label){
    var m = String(label || '').toLowerCase().trim().split(/\s+/);
    return (parseInt(m[1], 10) || 0) * 12 + (MONTHS[m[0]] || 0);
  }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function plain(html){
    return String(html || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }
  function catOf(id){ for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i]; return CATS[0]; }

  function configured(){ return !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY); }

  function rest(path, timeoutMs){
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function(){ ctrl.abort(); }, timeoutMs || 6000) : null;
    return fetch(CFG.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + path, {
      headers: { apikey: CFG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CFG.SUPABASE_ANON_KEY },
      signal: ctrl ? ctrl.signal : undefined
    }).then(function(r){
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }, function(e){ if (timer) clearTimeout(timer); throw e; });
  }

  /* projets publiés créés dans le mode administrateur (résumé pour les cartes) */
  function fetchProjects(){
    if (!configured()) return Promise.resolve([]);
    return rest('projects?select=slug,title,category,date_label,cover_url,hover_url&published=eq.true&order=created_at.desc');
  }
  function fetchProject(slug){
    return rest('projects?select=*&slug=eq.' + encodeURIComponent(slug) + '&published=eq.true').then(function(rows){ return rows[0] || null; });
  }
  function fetchHomeConfig(){
    if (!configured()) return Promise.resolve(null);
    return rest('site_settings?select=value&key=eq.home').then(function(rows){ return rows[0] ? rows[0].value : null; });
  }

  /* un projet de la base -> même forme qu'un projet d'origine (carte) */
  function fromRow(r){
    return {
      slug: r.slug, cat: r.category, name: esc(String(r.title || '').replace(/\*/g, '')), href: 'projet.html?p=' + encodeURIComponent(r.slug),
      img: r.cover_url || '', peek: r.hover_url || '', ar: '1080/1380', date: esc(r.date_label || ''), legacy: false
    };
  }

  /* tous les projets (origine + base), indexés par slug */
  function indexAll(rows){
    var map = {};
    LEGACY.forEach(function(p){ map[p.slug] = p; });
    (rows || []).forEach(function(r){ map[r.slug] = fromRow(r); });
    return map;
  }

  /* composition de la page principale : { clients:[slug…], … } -> "familles"
     au format de TRAVAUX_FAMILIES (une catégorie vide est omise). */
  function buildFamilies(config, rows){
    var map = indexAll(rows);
    var cats = (config && config.categories) || {};
    var out = [];
    CATS.forEach(function(c){
      var slugs = cats[c.id] || LEGACY.filter(function(p){ return p.cat === c.id; }).map(function(p){ return p.slug; });
      var projects = slugs.map(function(s){ return map[s]; }).filter(Boolean);
      if (projects.length) out.push({ title: c.homeTitle, color: c.color, projects: projects });
    });
    return out;
  }

  /* page principale : null si rien n'est configuré (on garde alors la
     liste d'origine déjà affichée, sans rien reconstruire). */
  function loadHome(){
    if (!configured()) return Promise.resolve(null);
    return Promise.all([ fetchHomeConfig(), fetchProjects() ]).then(function(res){
      if (!res[0]) return null;
      return buildFamilies(res[0], res[1]);
    });
  }

  /* tous les projets publiés, origine d'abord (ordre du portfolio) puis base */
  function loadAll(){
    return fetchProjects().catch(function(){ return []; }).then(function(rows){
      var list = LEGACY.slice();
      (rows || []).forEach(function(r){ list.push(fromRow(r)); });
      return list;
    });
  }

  window.LT_DATA = {
    cfg: CFG, cats: CATS, legacy: LEGACY, configured: configured, catOf: catOf,
    dateKey: dateKey, esc: esc, plain: plain, months: MONTHS,
    fetchProjects: fetchProjects, fetchProject: fetchProject, fetchHomeConfig: fetchHomeConfig,
    fromRow: fromRow, indexAll: indexAll, buildFamilies: buildFamilies, loadHome: loadHome, loadAll: loadAll
  };
})();
