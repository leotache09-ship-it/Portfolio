/*
 * LT Design — mode créateur (mini-CMS).
 * Vues : connexion · Projets · éditeur de projet (avec aperçu en direct) ·
 * Page principale (choisir / échanger / ordonner les projets de l'accueil).
 * Données : Supabase (tables projects / site_settings, bucket project-media).
 */
(function(){
  'use strict';
  var D = window.LT_DATA, A = window.LT_AUTH, T = window.LT_TEMPLATES, R = window.LT_RENDER;
  var root = document.getElementById('admin');
  var sb = null;
  var MONTHS = ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];
  var state = { project:null, dirty:false, previewReady:false, others:[], sideTab:'left' };
  var previewTimer = null;

  /* ---------- utilitaires DOM ---------- */
  function h(tag, attrs){
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function(k){
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') el.setAttribute('style', v);
      else if (k.slice(0,2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c){
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function(x){ add(el, x); });
    else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  function clear(el){ while (el.firstChild) el.removeChild(el.firstChild); }
  function toast(msg, kind){
    var t = h('div', { class:'toast ' + (kind || ''), text:msg });
    document.getElementById('toasts').appendChild(t);
    setTimeout(function(){ t.remove(); }, kind === 'err' ? 7000 : 3500);
  }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function slugify(s){
    return String(s || '').replace(/\*/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/&/g, ' et ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'projet';
  }
  function catColor(id){ return D.catOf(id).color; }
  function errMsg(e){ return (e && (e.message || e.error_description)) || 'Erreur inconnue.'; }

  /* ---------- connexion / garde ---------- */
  function boot(){
    if (!A.configured()) return viewNotConfigured();
    A.client().then(function(c){
      sb = c;
      return A.session();
    }).then(function(s){
      if (!s) return viewLogin();
      start();
    }).catch(function(e){ viewFatal(errMsg(e)); });
  }

  function viewFatal(msg){
    clear(root);
    root.appendChild(h('div', { class:'center' }, h('div', { class:'panel narrow' },
      h('h2', {}, 'Connexion ', h('span', { text:'impossible' })),
      h('p', { class:'sub', text:msg }),
      h('a', { class:'btn', href:'index.html', text:'← Retour au site' }))));
  }

  function viewNotConfigured(){
    clear(root);
    root.appendChild(h('div', { class:'center' }, h('div', { class:'panel', style:'max-width:640px' },
      h('h2', {}, 'Mode créateur ', h('span', { text:'à activer' })),
      h('p', { class:'sub', text:"Le mode administrateur a besoin d'une petite base de données gratuite (Supabase). Elle n'est pas encore branchée à ce site." }),
      h('ol', { class:'steps' },
        h('li', {}, 'Suis le guide ', h('b', { text:'supabase/INSTALLATION.md' }), ' (10 minutes, une seule fois).'),
        h('li', {}, 'Colle l\'adresse et la clé publique du projet dans ', h('b', { text:'assets/config.js' }), '.'),
        h('li', {}, 'Mets le site à jour chez Infomaniak, puis reviens ici.')),
      h('a', { class:'btn', href:'index.html', text:'← Retour au site' }))));
  }

  function viewLogin(){
    clear(root);
    var name = h('input', { type:'text', id:'ln', autocomplete:'username', autocapitalize:'none', spellcheck:'false', required:true });
    var pass = h('input', { type:'password', id:'lp', autocomplete:'current-password', required:true });
    var err = h('p', { class:'err', role:'alert' });
    var go = h('button', { class:'btn primary', type:'submit', text:'Se connecter', style:'width:100%;justify-content:center' });
    var form = h('form', { onsubmit:function(e){
      e.preventDefault(); go.disabled = true; err.textContent = '';
      A.signIn(name.value, pass.value).then(function(){ start(); })
        .catch(function(ex){ err.textContent = errMsg(ex); go.disabled = false; pass.value = ''; pass.focus(); });
    } },
      h('label', { class:'f' }, h('span', { class:'l', text:'Nom' }), name),
      h('label', { class:'f' }, h('span', { class:'l', text:'Mot de passe' }), pass), go, err);
    root.appendChild(h('div', { class:'center' }, h('div', { class:'panel narrow' },
      h('h2', {}, 'Mode ', h('span', { text:'créateur' })),
      h('p', { class:'sub', text:'Accès réservé au propriétaire du site.' }), form,
      h('p', { style:'margin:16px 0 0' }, h('a', { href:'index.html', class:'hint', text:'← Retour au site' })))));
    name.focus();
  }

  function logout(){
    A.signOut().catch(function(){}).then(function(){ location.href = 'index.html'; });
  }

  /* ---------- coque + routage ---------- */
  var shellMain = null;
  function shell(tab){
    clear(root);
    root.appendChild(h('header', { class:'top' },
      h('a', { class:'logo', href:'index.html', 'aria-label':'Retour au site' }, h('img', { src:'assets/logo-black.png', alt:'LT Design' })),
      h('span', { class:'ttl' }, 'Mode ', h('span', { text:'créateur' })),
      h('nav', { class:'tabs' },
        h('a', { href:'#/projets', class: tab === 'projets' ? 'on' : '', text:'Projets', onclick:guard }),
        h('a', { href:'#/accueil', class: tab === 'accueil' ? 'on' : '', text:'Page principale', onclick:guard })),
      h('span', { class:'sp' }),
      h('a', { class:'btn sm ghost', href:'index.html', target:'_blank', rel:'noopener', text:'Voir le site' }),
      h('button', { class:'btn sm ghost', type:'button', onclick:logout, text:'Déconnexion' })));
    shellMain = h('div', { id:'view' });
    root.appendChild(shellMain);
    return shellMain;
  }
  function guard(e){
    if (state.dirty && !confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?')) { e.preventDefault(); return; }
    state.dirty = false;
  }
  window.addEventListener('beforeunload', function(e){ if (state.dirty){ e.preventDefault(); e.returnValue = ''; } });

  function start(){ window.addEventListener('hashchange', route); route(); }
  function route(){
    var hash = location.hash.replace(/^#\/?/, '');
    var p = hash.split('/');
    if (p[0] === 'projet' && p[1]) return viewEditor(p[1]);
    if (p[0] === 'accueil') return viewHome();
    return viewProjects();
  }

  /* ---------- liste des projets ---------- */
  function viewProjects(){
    state.dirty = false;
    var main = shell('projets');
    var box = h('main', {}, h('h1', { text:'Mes projets' }),
      h('p', { class:'sub', text:'Crée une page projet à partir d\'un modèle, publie-la, puis choisis si elle apparaît sur la page principale.' }));
    main.appendChild(box);
    var grid = h('div', { class:'grid' });
    box.appendChild(grid);
    grid.appendChild(h('button', { class:'pcard new', type:'button', onclick:pickTemplate }, h('span', {}, h('span', { class:'plus', text:'+' }), 'Nouveau projet')));
    sb.from('projects').select('id,slug,title,category,date_label,cover_url,published,updated_at').order('updated_at', { ascending:false })
      .then(function(res){
        if (res.error) throw res.error;
        (res.data || []).forEach(function(p){ grid.appendChild(projectCard(p)); });
        if (!(res.data || []).length) box.appendChild(h('p', { class:'hint', text:'Aucun projet créé pour l\'instant. Clique sur « Nouveau projet ».' }));
      }).catch(function(e){ toast('Impossible de charger les projets : ' + errMsg(e), 'err'); });
  }

  function projectCard(p){
    var cat = D.catOf(p.category);
    return h('div', { class:'pcard' },
      h('div', { class:'th', style: p.cover_url ? 'background-image:url("' + p.cover_url.replace(/"/g, '%22') + '")' : '' }, p.cover_url ? '' : 'Pas de cover'),
      h('div', { class:'bd' },
        h('div', { class:'nm', text:String(p.title || '').replace(/\*/g, '') }),
        h('div', { class:'mt' }, h('i', { class:'dot', style:'--c:' + cat.color }), cat.title, ' · ', p.date_label || '—',
          h('span', { class: 'pill' + (p.published ? ' live' : ''), text:p.published ? 'Publié' : 'Brouillon' })),
        h('div', { class:'ac' },
          h('a', { class:'btn sm primary', href:'#/projet/' + p.id, text:'Modifier' }),
          p.published ? h('a', { class:'btn sm', href:'projet.html?p=' + encodeURIComponent(p.slug), target:'_blank', rel:'noopener', text:'Voir' }) : null,
          h('button', { class:'btn sm danger', type:'button', text:'Supprimer', onclick:function(){ removeProject(p); } }))));
  }

  function removeProject(p){
    if (!confirm('Supprimer définitivement « ' + String(p.title).replace(/\*/g, '') + ' » ? Cette action est irréversible.')) return;
    sb.from('projects').delete().eq('id', p.id).then(function(res){
      if (res.error) throw res.error;
      toast('Projet supprimé.', 'ok');
      /* le retirer aussi de la page principale s'il y figurait */
      return loadHomeConfig().then(function(cfg){
        if (!cfg) return;
        var changed = false;
        Object.keys(cfg.categories).forEach(function(c){
          var n = cfg.categories[c].filter(function(s){ return s !== p.slug; });
          if (n.length !== cfg.categories[c].length){ cfg.categories[c] = n; changed = true; }
        });
        if (changed) return saveHomeConfig(cfg);
      });
    }).then(viewProjects).catch(function(e){ toast('Suppression impossible : ' + errMsg(e), 'err'); });
  }

  /* ---------- choix du modèle ---------- */
  function pickTemplate(){
    var back = h('div', { class:'mback', onmousedown:function(e){ if (e.target === back) back.remove(); } });
    var grid = h('div', { class:'tgrid' });
    T.TEMPLATES.forEach(function(t){
      grid.appendChild(h('button', { class:'tpl', type:'button', onclick:function(){ back.remove(); createFrom(t); } },
        h('b', { text:t.name }), h('span', { text:t.desc }), h('i', { style:'background:' + t.theme.accent })));
    });
    back.appendChild(h('div', { class:'modal', role:'dialog', 'aria-modal':'true' },
      h('h2', { text:'Choisis un modèle' }),
      h('p', { class:'sub', style:'margin:0', text:'Un point de départ repris des pages projet existantes. Tu pourras tout modifier, ajouter ou supprimer ensuite.' }),
      grid, h('p', { style:'margin:18px 0 0' }, h('button', { class:'btn ghost', type:'button', text:'Annuler', onclick:function(){ back.remove(); } }))));
    document.body.appendChild(back);
  }

  function createFrom(t){
    var now = new Date();
    var p = {
      id:null, slug:'', title:'', category:'clients',
      date_label: MONTHS[now.getMonth()] + ' ' + now.getFullYear(),
      cover_url:'', hover_url:'', meta:clone(t.meta), theme:clone(t.theme), blocks:clone(t.blocks), published:false
    };
    state.project = p; state.dirty = true;
    openEditor(p, true);
  }

  /* ---------- éditeur ---------- */
  function viewEditor(id){
    if (id === 'new'){ shell('projets'); return pickTemplate(); }
    if (state.project && state.project.id === id){ return openEditor(state.project, false); }
    state.dirty = false;
    var main = shell('projets');
    main.appendChild(h('main', {}, h('p', { class:'hint', text:'Chargement du projet…' })));
    sb.from('projects').select('*').eq('id', id).single().then(function(res){
      if (res.error || !res.data) throw (res.error || new Error('Projet introuvable.'));
      var p = res.data;
      p.meta = p.meta || {}; p.theme = p.theme || {}; p.blocks = p.blocks || [];
      state.project = p; state.dirty = false;
      openEditor(p, false);
    }).catch(function(e){ toast('Projet introuvable : ' + errMsg(e), 'err'); location.hash = '#/projets'; });
  }

  function touch(){
    state.dirty = true;
    var d = document.getElementById('dirty');
    if (d){ d.textContent = 'Modifications non enregistrées'; d.className = 'dirty on'; }
    var nm = document.getElementById('edname');
    if (nm) nm.textContent = String(state.project.title || 'Nouveau projet').replace(/\*/g, '');
    schedulePreview();
  }

  function openEditor(p, isNew){
    var main = shell('projets');
    var ed = h('div', { class:'ed show-left', id:'ed' });
    var left = h('div', { class:'ed-left' });
    var right = h('div', { class:'ed-right' });
    var iframe = h('iframe', { id:'pv', title:'Aperçu de la page', src:'projet.html?preview=1' });
    var frame = h('div', { class:'pv-frame', id:'pvframe' }, iframe);
    state.previewReady = false;

    var bar = h('div', { class:'ed-bar' },
      h('a', { class:'btn sm ghost', href:'#/projets', text:'← Projets', onclick:guard }),
      h('span', { class:'nm', id:'edname', text:String(p.title || 'Nouveau projet').replace(/\*/g, '') }),
      h('span', { class:'dirty' + (isNew ? ' on' : ''), id:'dirty', text: isNew ? 'Pas encore enregistré' : 'Enregistré' }),
      h('span', { class:'sp' }),
      h('a', { class:'btn sm', id:'viewlive', href:'projet.html?p=' + encodeURIComponent(p.slug || ''), target:'_blank', rel:'noopener', text:'Voir la page', hidden:!(p.id && p.published) }),
      h('button', { class:'btn sm', type:'button', text:'Sur la page principale…', onclick:function(){ placeOnHome(); } }),
      h('button', { class:'btn sm primary', type:'button', id:'savebtn', text:'Enregistrer', onclick:saveProject }));
    var mobtabs = h('div', { class:'mobtabs' },
      h('div', { class:'seg' },
        h('button', { type:'button', class:'on', text:'Éditer', onclick:function(e){ setSide('left', e.target); } }),
        h('button', { type:'button', text:'Aperçu', onclick:function(e){ setSide('right', e.target); } })));
    function setSide(s, btn){
      ed.className = 'ed show-' + s;
      Array.prototype.forEach.call(btn.parentNode.children, function(b){ b.className = b === btn ? 'on' : ''; });
      if (s === 'right') sendPreview();
    }

    left.appendChild(secInfos(p));
    left.appendChild(secCover(p));
    left.appendChild(secStyle(p));
    left.appendChild(secBlocks(p));

    right.appendChild(h('div', { class:'pv-head' }, h('span', { class:'mono', style:'font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)', text:'Aperçu en direct' }), h('span', { class:'sp' }),
      h('div', { class:'seg' },
        h('button', { type:'button', class:'on', text:'Ordinateur', onclick:function(e){ frame.classList.remove('mob'); tog(e.target); } }),
        h('button', { type:'button', text:'Téléphone', onclick:function(e){ frame.classList.add('mob'); tog(e.target); } }))));
    function tog(btn){ Array.prototype.forEach.call(btn.parentNode.children, function(b){ b.className = b === btn ? 'on' : ''; }); }
    right.appendChild(frame);

    ed.appendChild(left); ed.appendChild(right);
    main.appendChild(bar); main.appendChild(mobtabs); main.appendChild(ed);

    window.removeEventListener('message', onPreviewMsg);
    window.addEventListener('message', onPreviewMsg);
    D.loadAll().then(function(all){ state.all = all; schedulePreview(); });
  }

  function onPreviewMsg(e){
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === 'lt-preview-ready'){ state.previewReady = true; sendPreview(); }
  }
  function schedulePreview(){ clearTimeout(previewTimer); previewTimer = setTimeout(sendPreview, 250); }
  function sendPreview(){
    var f = document.getElementById('pv');
    if (!f || !f.contentWindow || !state.previewReady || !state.project) return;
    var p = clone(state.project);
    if (!p.slug) p.slug = slugify(p.title);
    f.contentWindow.postMessage({ type:'lt-preview', project:p, others:R.pickOthers(state.all || [], p.slug) }, location.origin);
  }

  /* ----- champs génériques ----- */
  function field(label, node, hint){
    return h('label', { class:'f' }, h('span', { class:'l', text:label }), node, hint ? h('p', { class:'hint', text:hint }) : null);
  }
  function textIn(obj, key, opts){
    opts = opts || {};
    var i = h('input', { type:'text', value:obj[key] || '', placeholder:opts.placeholder || '', maxlength:opts.max || 300,
      oninput:function(){ obj[key] = i.value; touch(); } });
    return i;
  }
  function areaIn(obj, key, rows){
    var a = h('textarea', { rows: rows || 5, oninput:function(){ obj[key] = a.value; touch(); } });
    a.value = obj[key] || '';
    return a;
  }
  function selectIn(obj, key, options, onchange){
    var s = h('select', { onchange:function(){ obj[key] = s.value; touch(); if (onchange) onchange(s.value); } });
    options.forEach(function(o){ var op = h('option', { value:o[0], text:o[1] }); if (String(obj[key] == null ? '' : obj[key]) === String(o[0])) op.selected = true; s.appendChild(op); });
    return s;
  }
  function colorIn(obj, key, fallback){
    var val = R.hexOk(obj[key]) ? obj[key] : fallback;
    var c = h('input', { type:'color', value:val, oninput:function(){ obj[key] = c.value; t.value = c.value; touch(); } });
    var t = h('input', { type:'text', value:val, maxlength:7, style:'max-width:110px', oninput:function(){ if (R.hexOk(t.value)){ obj[key] = t.value; c.value = t.value; touch(); } } });
    if (!R.hexOk(obj[key])) obj[key] = val;
    return h('div', { class:'row', style:'align-items:center;gap:8px' }, c, t);
  }
  function boolIn(obj, key, label){
    var c = h('input', { type:'checkbox', checked:!!obj[key], style:'width:auto', onchange:function(){ obj[key] = c.checked; touch(); } });
    return h('label', { class:'radio' }, c, h('span', { text:label }));
  }

  /* ----- envoi de médias ----- */
  function loadImage(file){
    return new Promise(function(resolve, reject){
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function(){ URL.revokeObjectURL(url); resolve(im); };
      im.onerror = function(){ URL.revokeObjectURL(url); reject(new Error("Ce fichier n'est pas une image lisible.")); };
      im.src = url;
    });
  }
  function prepareImage(file){
    if (!/^image\//.test(file.type)) return Promise.reject(new Error('Choisis un fichier image (jpg, png, webp…).'));
    if (/gif|svg/.test(file.type)) return Promise.resolve({ blob:file, ext:file.type.indexOf('gif') > -1 ? 'gif' : 'svg', type:file.type });
    return loadImage(file).then(function(im){
      var max = 2200, w = im.naturalWidth, hh = im.naturalHeight, k = Math.min(1, max / Math.max(w, hh));
      var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(hh * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      return new Promise(function(resolve){
        cv.toBlob(function(b){
          if (b && b.type === 'image/webp') return resolve({ blob:b, ext:'webp', type:'image/webp' });
          cv.toBlob(function(j){ resolve({ blob:j, ext:'jpg', type:'image/jpeg' }); }, 'image/jpeg', 0.88);
        }, 'image/webp', 0.88);
      });
    });
  }
  function upload(blob, ext, type){
    var path = 'p/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    return sb.storage.from('project-media').upload(path, blob, { contentType:type, cacheControl:'31536000', upsert:false })
      .then(function(res){
        if (res.error) throw res.error;
        return sb.storage.from('project-media').getPublicUrl(path).data.publicUrl;
      });
  }
  function imageField(obj, key, label, onDone){
    var pv = h('div', { class:'pv' });
    var st = h('span', { class:'st' });
    var file = h('input', { type:'file', accept:'image/*', hidden:true });
    function paint(){
      pv.style.backgroundImage = obj[key] ? 'url("' + String(obj[key]).replace(/"/g, '%22') + '")' : '';
      pv.textContent = obj[key] ? '' : 'Aucune';
      rm.hidden = !obj[key];
    }
    var rm = h('button', { class:'btn sm danger', type:'button', text:'Retirer', onclick:function(){ obj[key] = ''; paint(); touch(); if (onDone) onDone(); } });
    var pick = h('button', { class:'btn sm', type:'button', text:'Choisir une image', onclick:function(){ file.click(); } });
    file.addEventListener('change', function(){
      var f = file.files && file.files[0]; if (!f) return;
      st.textContent = 'Envoi en cours…'; pick.disabled = true;
      prepareImage(f).then(function(r){ return upload(r.blob, r.ext, r.type); }).then(function(url){
        obj[key] = url; paint(); st.textContent = ''; touch(); if (onDone) onDone();
      }).catch(function(e){ st.textContent = ''; toast('Envoi impossible : ' + errMsg(e), 'err'); })
        .then(function(){ pick.disabled = false; file.value = ''; });
    });
    paint();
    var wrap = h('div', { class:'imgf' }, pv, h('div', {}, h('div', { style:'display:flex;gap:6px;flex-wrap:wrap' }, pick, rm), st), file);
    return label ? field(label, wrap) : wrap;
  }
  function videoField(obj, key, label){
    var st = h('span', { class:'st', text: obj[key] ? 'Vidéo ajoutée.' : 'Aucune vidéo.' });
    var file = h('input', { type:'file', accept:'video/mp4,video/*', hidden:true });
    var pick = h('button', { class:'btn sm', type:'button', text:'Choisir une vidéo', onclick:function(){ file.click(); } });
    var rm = h('button', { class:'btn sm danger', type:'button', text:'Retirer', hidden:!obj[key], onclick:function(){ obj[key] = ''; st.textContent = 'Aucune vidéo.'; rm.hidden = true; touch(); } });
    file.addEventListener('change', function(){
      var f = file.files && file.files[0]; if (!f) return;
      if (f.size > 50 * 1024 * 1024){ toast('Vidéo trop lourde (50 Mo max). Compresse-la d\'abord.', 'err'); file.value = ''; return; }
      st.textContent = 'Envoi en cours…'; pick.disabled = true;
      upload(f, (f.name.split('.').pop() || 'mp4').toLowerCase(), f.type || 'video/mp4').then(function(url){
        obj[key] = url; st.textContent = 'Vidéo ajoutée.'; rm.hidden = false; touch();
      }).catch(function(e){ st.textContent = 'Aucune vidéo.'; toast('Envoi impossible : ' + errMsg(e), 'err'); })
        .then(function(){ pick.disabled = false; file.value = ''; });
    });
    return field(label, h('div', { class:'imgf' }, h('div', { style:'display:flex;gap:6px;flex-wrap:wrap' }, pick, rm), st, file));
  }

  /* rendu générique d'une liste de définitions de champs */
  function fieldsNode(defs, obj, afterChange){
    var frag = document.createDocumentFragment();
    defs.forEach(function(d){
      if (d.type === 'text') frag.appendChild(field(d.label, textIn(obj, d.k)));
      else if (d.type === 'textarea') frag.appendChild(field(d.label, areaIn(obj, d.k, d.rows)));
      else if (d.type === 'select') frag.appendChild(field(d.label, selectIn(obj, d.k, d.options)));
      else if (d.type === 'color') frag.appendChild(field(d.label, colorIn(obj, d.k, '#189CD8')));
      else if (d.type === 'bool') frag.appendChild(boolIn(obj, d.k, d.label));
      else if (d.type === 'image') frag.appendChild(imageField(obj, d.k, d.label));
      else if (d.type === 'video') frag.appendChild(videoField(obj, d.k, d.label));
      else if (d.type === 'group'){
        obj[d.k] = obj[d.k] || {};
        var g = h('div', { class:'grp' }, h('span', { class:'l', text:d.label }));
        g.appendChild(fieldsNode(d.fields, obj[d.k]));
        frag.appendChild(g);
      } else if (d.type === 'list'){
        obj[d.k] = obj[d.k] || [];
        frag.appendChild(listNode(d, obj[d.k]));
      }
    });
    return frag;
  }
  function listNode(d, arr){
    var box = h('div', { class:'grp' }, h('span', { class:'l', text:d.label }));
    var items = h('div', {});
    function paint(){
      clear(items);
      arr.forEach(function(it, i){
        var li = h('div', { class:'li' },
          h('div', { class:'lh' },
            h('button', { class:'btn sm ico-btn ghost', type:'button', title:'Monter', text:'↑', disabled:i === 0, onclick:function(){ move(arr, i, -1); paint(); touch(); } }),
            h('button', { class:'btn sm ico-btn ghost', type:'button', title:'Descendre', text:'↓', disabled:i === arr.length - 1, style:'margin-left:4px', onclick:function(){ move(arr, i, 1); paint(); touch(); } }),
            h('button', { class:'btn sm ico-btn danger', type:'button', title:'Supprimer', text:'✕', disabled:arr.length <= (d.min || 0), style:'margin-left:4px', onclick:function(){ arr.splice(i, 1); paint(); touch(); } })));
        li.appendChild(fieldsNode(d.item, it));
        items.appendChild(li);
      });
    }
    box.appendChild(items);
    box.appendChild(h('button', { class:'btn sm', type:'button', text:'+ ' + (d.addLabel || 'Ajouter'), onclick:function(){ arr.push(d.blank()); paint(); touch(); } }));
    paint();
    return box;
  }
  function move(arr, i, dir){ var j = i + dir; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }

  /* ----- sections de l'éditeur ----- */
  function secInfos(p){
    var cat = selectIn(p, 'category', D.cats.map(function(c){ return [c.id, c.title]; }), function(){ if (state.coverPaint) state.coverPaint(); });
    var parts = String(p.date_label || '').toLowerCase().split(/\s+/);
    var mIdx = MONTHS.map(function(m){ return m.toLowerCase(); }).indexOf(parts[0]);
    var month = h('select', {}), year = h('input', { type:'number', min:2000, max:2100, value:parseInt(parts[1], 10) || new Date().getFullYear() });
    MONTHS.forEach(function(m, i){ var o = h('option', { value:m, text:m }); if (i === mIdx) o.selected = true; month.appendChild(o); });
    function setDate(){ p.date_label = month.value + ' ' + year.value; touch(); if (state.coverPaint) state.coverPaint(); }
    month.addEventListener('change', setDate); year.addEventListener('input', setDate);
    if (mIdx < 0){ month.selectedIndex = new Date().getMonth(); }
    var title = textIn(p, 'title', { placeholder:'Ex. Ri*ch*ol' });
    title.addEventListener('input', function(){ if (state.coverPaint) state.coverPaint(); });
    return h('section', { class:'sec' }, h('h3', { text:'Infos du projet' }),
      field('Titre', title, 'Mets un mot entre *étoiles* pour le colorer sur la page (ex. Ri*ch*ol).'),
      h('div', { class:'row' }, field('Catégorie', cat), field('Date', h('div', { class:'row', style:'gap:8px' }, month, year))),
      p.slug ? field('Adresse de la page', h('input', { type:'text', value:'projet.html?p=' + p.slug, disabled:true }), 'Fixée après le premier enregistrement pour ne jamais casser un lien.') : null,
      field('Introduction (sous le titre)', areaIn(p.meta, 'lede', 3)),
      imageField(p.meta, 'hero_image', 'Image d\'en-tête de la page (à droite du titre)'),
      h('label', { class:'f' }, h('span', { class:'l', text:'Statut' }),
        selectIn(p, 'published', [ ['false', 'Brouillon (invisible)'], ['true', 'Publié (visible)'] ])));
  }

  function secCover(p){
    var wrap = h('div', { class:'miniwrap' });
    var mini = h('div', { class:'mini' });
    var cov = h('img', { alt:'' }), pk = h('img', { class:'pk', alt:'' }), vl = h('div', { class:'vl' }, h('span', { text:'Voir plus' })), em = h('div', { class:'em', text:'Cover' });
    mini.appendChild(cov); mini.appendChild(pk); mini.appendChild(vl); mini.appendChild(em);
    var name = h('div', { style:'margin-top:8px;font-family:"Archivo Black";text-transform:uppercase;font-size:.85rem;max-width:170px' });
    var date = h('div', { class:'mono', style:'font-size:.62rem;letter-spacing:.06em;color:var(--faint);text-transform:uppercase;margin-top:4px' });
    function paint(){
      if (p.cover_url) cov.setAttribute('src', p.cover_url); else cov.removeAttribute('src');
      cov.style.display = p.cover_url ? '' : 'none';
      if (p.hover_url) pk.setAttribute('src', p.hover_url); else pk.removeAttribute('src');
      pk.style.display = p.hover_url ? '' : 'none';
      em.style.display = p.cover_url ? 'none' : '';
      mini.style.setProperty('--mc', catColor(p.category));
      name.textContent = String(p.title || 'Titre du projet').replace(/\*/g, '');
      date.textContent = p.date_label || '';
    }
    paint();
    var sec = h('section', { class:'sec' }, h('h3', { text:'Cover (page principale et répertoire)' }),
      h('p', { class:'hint', style:'margin:0 0 14px', text:'La cover est l\'image de la carte du projet. L\'image « au survol » apparaît quand on passe dessus (comme sur la page principale).' }),
      wrap);
    wrap.appendChild(h('div', {}, mini, name, date, h('p', { class:'hint', text:'Passe la souris pour voir l\'effet.' })));
    wrap.appendChild(h('div', { style:'flex:1 1 220px;min-width:0' },
      imageField(p, 'cover_url', 'Image de cover', paint),
      imageField(p, 'hover_url', 'Image au survol', paint)));
    state.coverPaint = paint; /* la carte se met à jour quand le titre, la date ou la catégorie changent */
    return sec;
  }

  function secStyle(p){
    p.theme = p.theme || {};
    if (!p.theme.mode) p.theme.mode = 'light';
    var seg = h('div', { class:'seg' });
    [['light', 'Clair'], ['dark', 'Sombre']].forEach(function(m){
      var b = h('button', { type:'button', class:p.theme.mode === m[0] ? 'on' : '', text:m[1], onclick:function(){
        p.theme.mode = m[0]; Array.prototype.forEach.call(seg.children, function(x){ x.className = x === b ? 'on' : ''; }); touch();
      } });
      seg.appendChild(b);
    });
    var autoPaper = !p.theme.paper;
    var paperWrap = h('div', {});
    var auto = h('input', { type:'checkbox', checked:autoPaper, style:'width:auto', onchange:function(){
      autoPaper = auto.checked; paperRow.hidden = autoPaper; if (autoPaper) p.theme.paper = ''; else p.theme.paper = p.theme.paper || (p.theme.mode === 'dark' ? '#0d0d0f' : '#f4f8fb'); paperInputs(); touch();
    } });
    var paperRow = h('div', { hidden:autoPaper });
    function paperInputs(){ clear(paperRow); if (!autoPaper) paperRow.appendChild(colorIn(p.theme, 'paper', '#f4f8fb')); }
    paperInputs();
    return h('section', { class:'sec' }, h('h3', { text:'Style de la page' }),
      field('Ambiance', seg),
      field('Couleur d\'accent', colorIn(p.theme, 'accent', '#189CD8'), 'Utilisée pour les mots colorés, les étiquettes et les détails.'),
      paperWrap, h('label', { class:'radio' }, auto, h('span', { text:'Couleur de fond automatique (selon l\'accent)' })), paperRow);
  }

  function secBlocks(p){
    var sec = h('section', { class:'sec' }, h('h3', { text:'Contenu de la page' }));
    var list = h('div', { style:'display:flex;flex-direction:column;gap:12px;margin:0 0 16px' });
    var palette = h('div', { class:'addgrid' });
    function paint(){
      clear(list);
      if (!p.blocks.length) list.appendChild(h('p', { class:'hint', text:'Page vide : ajoute ton premier bloc ci-dessous.' }));
      p.blocks.forEach(function(b, i){
        var def = T.BLOCKS[b.t]; if (!def) return;
        var card = h('div', { class:'blk' },
          h('div', { class:'hd' }, h('span', { class:'ty' }, h('span', { text:def.icon }), def.label),
            h('button', { class:'btn sm ico-btn ghost', type:'button', title:'Monter', text:'↑', disabled:i === 0, onclick:function(){ move(p.blocks, i, -1); paint(); touch(); } }),
            h('button', { class:'btn sm ico-btn ghost', type:'button', title:'Descendre', text:'↓', disabled:i === p.blocks.length - 1, onclick:function(){ move(p.blocks, i, 1); paint(); touch(); } }),
            h('button', { class:'btn sm ico-btn ghost', type:'button', title:'Dupliquer', text:'⧉', onclick:function(){ p.blocks.splice(i + 1, 0, clone(b)); paint(); touch(); } }),
            h('button', { class:'btn sm ico-btn danger', type:'button', title:'Supprimer', text:'✕', onclick:function(){ if (confirm('Supprimer ce bloc ?')){ p.blocks.splice(i, 1); paint(); touch(); } } })));
        card.appendChild(fieldsNode(def.fields, b));
        list.appendChild(card);
      });
    }
    Object.keys(T.BLOCKS).forEach(function(t){
      var d = T.BLOCKS[t];
      palette.appendChild(h('button', { type:'button', onclick:function(){ p.blocks.push(d.blank()); paint(); touch();
        setTimeout(function(){ var last = list.lastElementChild; if (last) last.scrollIntoView({ behavior:'smooth', block:'center' }); }, 30); } },
        h('b', { text:d.icon + '  ' + d.label }), h('span', { text:d.hint })));
    });
    sec.appendChild(list);
    sec.appendChild(h('div', { class:'hint', style:'margin:0 0 8px', text:'Ajouter un bloc :' }));
    sec.appendChild(palette);
    paint();
    return sec;
  }

  /* ----- enregistrement ----- */
  function uniqueSlug(base, ownId){
    var legacy = D.legacy.map(function(x){ return x.slug; });
    return sb.from('projects').select('id,slug').like('slug', base + '%').then(function(res){
      var taken = (res.data || []).filter(function(r){ return r.id !== ownId; }).map(function(r){ return r.slug; }).concat(legacy);
      if (taken.indexOf(base) < 0) return base;
      for (var i = 2; i < 200; i++) if (taken.indexOf(base + '-' + i) < 0) return base + '-' + i;
      return base + '-' + Date.now();
    });
  }

  function saveProject(){
    var p = state.project;
    if (!String(p.title || '').trim()){ toast('Donne un titre au projet avant d\'enregistrer.', 'err'); return Promise.resolve(false); }
    var btn = document.getElementById('savebtn'); if (btn){ btn.disabled = true; btn.textContent = 'Enregistrement…'; }
    p.published = p.published === true || p.published === 'true';
    var step = p.slug ? Promise.resolve(p.slug) : uniqueSlug(slugify(p.title), p.id);
    return step.then(function(slug){
      p.slug = slug;
      var row = { slug:p.slug, title:p.title, category:p.category, date_label:p.date_label, cover_url:p.cover_url || null, hover_url:p.hover_url || null,
        meta:p.meta, theme:p.theme, blocks:p.blocks, published:p.published, updated_at:new Date().toISOString() };
      return p.id ? sb.from('projects').update(row).eq('id', p.id).select().single() : sb.from('projects').insert(row).select().single();
    }).then(function(res){
      if (res.error) throw res.error;
      var wasNew = !p.id;
      p.id = res.data.id;
      state.dirty = false;
      var d = document.getElementById('dirty'); if (d){ d.textContent = 'Enregistré'; d.className = 'dirty'; }
      var v = document.getElementById('viewlive'); if (v){ v.hidden = !p.published; v.href = 'projet.html?p=' + encodeURIComponent(p.slug); }
      if (wasNew) history.replaceState(null, '', '#/projet/' + p.id);
      toast(p.published ? 'Enregistré et publié.' : 'Brouillon enregistré.', 'ok');
      return true;
    }).catch(function(e){
      toast('Enregistrement impossible : ' + errMsg(e), 'err'); return false;
    }).then(function(ok){
      if (btn){ btn.disabled = false; btn.textContent = 'Enregistrer'; }
      return ok;
    });
  }

  /* ---------- page principale : configuration ---------- */
  function defaultCategories(){
    var out = {};
    D.cats.forEach(function(c){ out[c.id] = D.legacy.filter(function(p){ return p.cat === c.id; }).map(function(p){ return p.slug; }); });
    return out;
  }
  function loadHomeConfig(){
    return sb.from('site_settings').select('value').eq('key', 'home').maybeSingle().then(function(res){
      if (res.error) throw res.error;
      var cats = defaultCategories();
      var saved = res.data && res.data.value && res.data.value.categories;
      if (saved) Object.keys(cats).forEach(function(k){ if (Array.isArray(saved[k])) cats[k] = saved[k].slice(); });
      return { categories:cats, custom:!!saved };
    });
  }
  function saveHomeConfig(cfg){
    return sb.from('site_settings').upsert({ key:'home', value:{ categories:cfg.categories }, updated_at:new Date().toISOString() }).then(function(res){
      if (res.error) throw res.error;
    });
  }
  function resetHomeConfig(){
    return sb.from('site_settings').delete().eq('key', 'home').then(function(res){ if (res.error) throw res.error; });
  }

  /* tous les projets connus (origine + base), indexés par slug */
  function loadCatalog(){
    return sb.from('projects').select('id,slug,title,category,date_label,cover_url,published').then(function(res){
      if (res.error) throw res.error;
      var map = {}, list = [];
      D.legacy.forEach(function(p){ var o = { slug:p.slug, cat:p.cat, name:D.plain(p.name), date:p.date, img:p.img, legacy:true, published:true }; map[o.slug] = o; list.push(o); });
      (res.data || []).forEach(function(r){ var o = { slug:r.slug, cat:r.category, name:String(r.title).replace(/\*/g, ''), date:r.date_label, img:r.cover_url, legacy:false, published:!!r.published, id:r.id }; map[o.slug] = o; list.push(o); });
      return { map:map, list:list };
    });
  }

  function viewHome(){
    state.dirty = false;
    var main = shell('accueil');
    var box = h('main', {}, h('h1', { text:'Page principale' }),
      h('p', { class:'sub', text:'Choisis quels projets apparaissent sur la page d\'accueil, dans quel ordre, et remplace-en un par un autre. Seuls les projets publiés peuvent y figurer. Une catégorie sans projet disparaît de la page.' }));
    main.appendChild(box);
    var holder = h('div', {}); box.appendChild(holder);
    Promise.all([ loadHomeConfig(), loadCatalog() ]).then(function(r){
      var cfg = r[0], cat = r[1];
      function save(btn){
        btn.disabled = true;
        saveHomeConfig(cfg).then(function(){ cfg.custom = true; toast('Page principale mise à jour. Elle est visible tout de suite.', 'ok'); })
          .catch(function(e){ toast('Enregistrement impossible : ' + errMsg(e), 'err'); }).then(function(){ btn.disabled = false; });
      }
      function paint(){
        clear(holder);
        D.cats.forEach(function(c){
          var slugs = cfg.categories[c.id];
          var card = h('div', { class:'cat', style:'--c:' + c.color }, h('div', { class:'ch' }, c.title, h('small', { text:slugs.length + ' sur la page' })));
          slugs.forEach(function(s, i){
            var p = cat.map[s];
            var others = cat.list.filter(function(x){ return x.cat === c.id && x.published && slugs.indexOf(x.slug) < 0; });
            var rep = h('select', { 'aria-label':'Remplacer par', onchange:function(){ if (!rep.value) return; slugs[i] = rep.value; paint(); } },
              h('option', { value:'', text:'Remplacer par…' }), others.map(function(o){ return h('option', { value:o.slug, text:o.name }); }));
            card.appendChild(h('div', { class:'hrow' },
              h('div', { class:'th', style: p && p.img ? 'background-image:url("' + String(p.img).replace(/"/g, '%22') + '")' : '' }),
              h('div', { class:'tx' }, h('b', { text: p ? p.name : s + ' (introuvable)' }), h('small', { text: p ? (p.date + (p.legacy ? ' · page d\'origine' : '') + (p.published ? '' : ' · brouillon')) : 'Ce projet n\'existe plus' })),
              others.length ? rep : null,
              h('button', { class:'btn sm ico-btn ghost', type:'button', title:'Monter', text:'↑', disabled:i === 0, onclick:function(){ move(slugs, i, -1); paint(); } }),
              h('button', { class:'btn sm ico-btn ghost', type:'button', title:'Descendre', text:'↓', disabled:i === slugs.length - 1, onclick:function(){ move(slugs, i, 1); paint(); } }),
              h('button', { class:'btn sm ico-btn danger', type:'button', title:'Retirer de la page principale', text:'✕', onclick:function(){ slugs.splice(i, 1); paint(); } })));
          });
          var avail = cat.list.filter(function(x){ return x.cat === c.id && x.published && slugs.indexOf(x.slug) < 0; });
          if (avail.length){
            var sel = h('select', {}, h('option', { value:'', text:'Ajouter un projet…' }), avail.map(function(o){ return h('option', { value:o.slug, text:o.name }); }));
            card.appendChild(h('div', { class:'addrow' }, sel, h('button', { class:'btn sm', type:'button', text:'+ Ajouter', onclick:function(){ if (sel.value){ slugs.push(sel.value); paint(); } } })));
          }
          if (!slugs.length) card.appendChild(h('div', { class:'warn', text:'Aucun projet : cette catégorie n\'apparaîtra pas sur la page principale.' }));
          holder.appendChild(card);
        });
        var saveB = h('button', { class:'btn primary', type:'button', text:'Enregistrer la page principale', onclick:function(){ save(saveB); } });
        holder.appendChild(h('div', { style:'display:flex;gap:10px;flex-wrap:wrap;margin-top:20px' }, saveB,
          h('button', { class:'btn danger', type:'button', text:'Revenir à la composition d\'origine', onclick:function(){
            if (!confirm('Revenir à la page principale d\'origine (les 11 projets de départ) ?')) return;
            resetHomeConfig().then(function(){ cfg.categories = defaultCategories(); cfg.custom = false; paint(); toast('Composition d\'origine rétablie.', 'ok'); })
              .catch(function(e){ toast('Impossible : ' + errMsg(e), 'err'); });
          } }),
          h('a', { class:'btn ghost', href:'index.html', target:'_blank', rel:'noopener', text:'Voir la page principale' })));
      }
      paint();
    }).catch(function(e){ toast('Chargement impossible : ' + errMsg(e), 'err'); });
  }

  /* depuis l'éditeur : mettre ce projet sur la page principale (ajouter ou remplacer) */
  function placeOnHome(){
    var p = state.project;
    if (!String(p.title || '').trim()){ toast('Donne un titre au projet d\'abord.', 'err'); return; }
    var go = function(){
      if (!p.published){
        if (!confirm('Ce projet est un brouillon. Pour apparaître sur la page principale, il doit être publié. Le publier maintenant ?')) return;
        p.published = true;
      }
      saveProject().then(function(ok){
        if (!ok) return;
        Promise.all([ loadHomeConfig(), loadCatalog() ]).then(function(r){ openPlaceModal(r[0], r[1]); });
      });
    };
    go();
  }
  function openPlaceModal(cfg, cat){
    var p = state.project, c = D.catOf(p.category);
    var slugs = cfg.categories[p.category] || [];
    var already = slugs.indexOf(p.slug) > -1;
    var back = h('div', { class:'mback', onmousedown:function(e){ if (e.target === back) back.remove(); } });
    var mode = already ? 'keep' : 'add', repl = '';
    var box = h('div', { class:'modal', style:'max-width:520px', role:'dialog', 'aria-modal':'true' });
    box.appendChild(h('h2', { text:'Page principale' }));
    if (already){
      box.appendChild(h('p', { class:'sub', text:'Ce projet est déjà sur la page principale, dans « ' + c.title + ' ».' }));
      box.appendChild(h('button', { class:'btn', type:'button', text:'Fermer', onclick:function(){ back.remove(); } }));
    } else {
      box.appendChild(h('p', { class:'sub', text:'Catégorie « ' + c.title + ' » : ' + slugs.length + ' projet(s) affiché(s). Que veux-tu faire ?' }));
      var sel = h('select', { disabled:true }, slugs.map(function(s){ var x = cat.map[s]; return h('option', { value:s, text:x ? x.name : s }); }));
      sel.addEventListener('change', function(){ repl = sel.value; });
      repl = slugs[0] || '';
      var r1 = h('input', { type:'radio', name:'pm', checked:true, onchange:function(){ mode = 'add'; sel.disabled = true; } });
      var r2 = h('input', { type:'radio', name:'pm', disabled:!slugs.length, onchange:function(){ mode = 'replace'; sel.disabled = false; } });
      box.appendChild(h('label', { class:'radio' }, r1, h('span', { text:'L\'ajouter en dernier' })));
      box.appendChild(h('label', { class:'radio' }, r2, h('span', { text:'Remplacer un projet existant :' })));
      box.appendChild(h('div', { style:'margin:0 0 16px 28px' }, sel));
      var ok = h('button', { class:'btn primary', type:'button', text:'Valider', onclick:function(){
        ok.disabled = true;
        if (mode === 'replace'){ var i = slugs.indexOf(repl); if (i > -1) slugs[i] = p.slug; else slugs.push(p.slug); } else slugs.push(p.slug);
        saveHomeConfig(cfg).then(function(){ toast('Projet placé sur la page principale.', 'ok'); back.remove(); })
          .catch(function(e){ toast('Impossible : ' + errMsg(e), 'err'); ok.disabled = false; });
      } });
      box.appendChild(h('div', { style:'display:flex;gap:8px' }, ok, h('button', { class:'btn ghost', type:'button', text:'Annuler', onclick:function(){ back.remove(); } })));
    }
    back.appendChild(box);
    document.body.appendChild(back);
  }

  window.LT_ADMIN = { boot:boot, _state:state };
  boot();
})();
