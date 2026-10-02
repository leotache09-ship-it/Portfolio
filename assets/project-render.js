/*
 * LT Design — rendu d'une page projet à partir de son contenu (JSON).
 * Utilisé par projet.html (visiteurs) ET par l'aperçu en direct du mode
 * administrateur : ce que tu vois dans l'éditeur est exactement ce que
 * verront les visiteurs.
 *
 * Format d'un projet :
 *   { slug, title, category, date_label, cover_url, hover_url,
 *     meta:  { lede, hero_image },
 *     theme: { mode:'light'|'dark', accent:'#rrggbb', paper:'#rrggbb'|'' },
 *     blocks:[ { t:'title'|'text'|'image'|'images2'|'gallery'|'split'|
 *                 'statement'|'palette'|'facts'|'cards'|'video', … } ] }
 * Dans les titres/textes : **gras**, *mot en couleur d'accent* (titres et
 * énoncés) et [lien](https://…).
 */
(function(){
  var D = window.LT_DATA || { esc: function(s){ return String(s); }, catOf: function(){ return { title:'' }; } };
  var esc = D.esc;

  /* ---------- couleurs ---------- */
  function hexOk(h){ return /^#[0-9a-f]{6}$/i.test(h || ''); }
  function rgb(h){ var n = parseInt(h.slice(1), 16); return [(n>>16)&255, (n>>8)&255, n&255]; }
  function toHex(a){ return '#' + a.map(function(v){ return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  function mix(h1, h2, t){ var a = rgb(h1), b = rgb(h2); return toHex([0,1,2].map(function(i){ return a[i] + (b[i]-a[i]) * t; })); }
  function lum(h){ var c = rgb(h).map(function(v){ v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }); return .2126*c[0] + .7152*c[1] + .0722*c[2]; }
  function onColor(h){ return lum(h) > .42 ? '#111111' : '#ffffff'; }

  function themeVars(theme){
    theme = theme || {};
    var accent = hexOk(theme.accent) ? theme.accent : '#189CD8';
    var v = { '--accent': accent, '--on-accent': onColor(accent) };
    if (theme.mode === 'dark'){
      v['--paper'] = hexOk(theme.paper) ? theme.paper : '#0d0d0f';
      v['--card'] = mix(v['--paper'], '#ffffff', .06);
      v['--ink'] = '#f2f2f2'; v['--ink-soft'] = 'rgba(242,242,242,.68)';
      v['--ink-faint'] = 'rgba(242,242,242,.4)'; v['--line'] = 'rgba(242,242,242,.16)';
    } else {
      v['--paper'] = hexOk(theme.paper) ? theme.paper : mix('#ffffff', accent, .09);
      v['--card'] = '#ffffff';
      v['--ink'] = '#1d1d1b'; v['--ink-soft'] = 'rgba(29,29,27,.66)';
      v['--ink-faint'] = 'rgba(29,29,27,.4)'; v['--line'] = 'rgba(29,29,27,.15)';
    }
    return v;
  }
  function applyTheme(theme){
    var v = themeVars(theme), root = document.documentElement;
    Object.keys(v).forEach(function(k){ root.style.setProperty(k, v[k]); });
    root.style.colorScheme = theme && theme.mode === 'dark' ? 'dark' : 'light';
  }

  /* ---------- texte ---------- */
  function safeUrl(u){ u = String(u || '').trim(); return /^(https?:\/\/|mailto:|\/|[a-z0-9_.-]+\.html)/i.test(u) ? u : '#'; }
  function inline(s, withAccent){
    var t = esc(s);
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(_, label, url){
      return '<a href="' + esc(safeUrl(url.replace(/&amp;/g, '&'))) + '" target="_blank" rel="noopener">' + label + '</a>';
    });
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    if (withAccent) t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return t;
  }
  function paragraphs(s, cls){
    return String(s || '').split(/\n{2,}/).map(function(p){ return p.trim(); }).filter(Boolean)
      .map(function(p){ return '<p class="' + cls + '">' + inline(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  /* ---------- images ---------- */
  function img(url, alt){ return url ? '<img src="' + esc(url) + '" alt="' + esc(alt || '') + '" loading="lazy">' : ''; }
  function ratioCss(r){ return { '1:1':'1/1', '4:5':'4/5', '3:4':'3/4', '3:2':'3/2', '16:9':'16/9' }[r] || ''; }
  function frame(o){
    o = o || {};
    if (!o.url) return '<div class="frame" style="aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;color:var(--ink-faint);font-family:\'Roboto Mono\',monospace;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase">Image à ajouter</div>';
    var rc = ratioCss(o.ratio);
    var cls = 'frame' + (rc ? ' fixed' : '') + (rc && o.fit === 'contain' ? ' contain' : '');
    return '<div class="' + cls + '"' + (rc ? ' style="aspect-ratio:' + rc + '"' : '') + '>' + img(o.url, o.caption) + '</div>';
  }
  function figure(o){
    o = o || {};
    return '<figure>' + frame(o) + (o.caption ? '<figcaption>' + esc(o.caption) + '</figcaption>' : '') + '</figure>';
  }

  /* ---------- blocs ---------- */
  var R = {
    text: function(b){ return '<div class="blk">' + paragraphs(b.text, 'body-text') + '</div>'; },
    statement: function(b){ return '<p class="statement balance blk">' + inline(b.text, true) + '</p>'; },
    image: function(b){ return '<div class="blk">' + figure(b) + '</div>'; },
    images2: function(b){ return '<div class="blk duo">' + figure(b.a) + figure(b.b) + '</div>'; },
    gallery: function(b){
      var c = [2,3,4].indexOf(+b.cols) > -1 ? +b.cols : 3;
      var items = (b.items && b.items.length) ? b.items : [{},{},{}];
      return '<div class="blk gal c' + c + '">' + items.map(figure).join('') + '</div>';
    },
    split: function(b){
      return '<div class="blk split' + (b.side === 'left' ? ' rev' : '') + '"><div>' + paragraphs(b.text, 'body-text') + '</div>' + figure(b.image) + '</div>';
    },
    palette: function(b){
      return '<div class="blk palette">' + (b.colors || []).map(function(c){
        var h = hexOk(c.hex) ? c.hex : '#cccccc', fg = onColor(h);
        return '<div class="swatch" style="background:' + h + ';color:' + fg + ';border-color:' + h + '"><div class="name">' + esc(c.name || '') + '</div><div class="hex">' + esc(h.toUpperCase()) + '</div>' + (c.extra ? '<div class="pant">' + esc(c.extra) + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    },
    facts: function(b){
      return '<div class="blk facts">' + (b.items || []).map(function(f){
        return '<div class="fact"><span class="k">' + esc(f.k || '') + '</span><span class="v">' + esc(f.v || '') + '</span></div>';
      }).join('') + '</div>';
    },
    cards: function(b){
      return '<div class="blk outcome">' + (b.items || []).map(function(c){
        return '<div class="card"><span class="k">' + esc(c.k || '') + '</span><p>' + inline(c.v || '') + '</p></div>';
      }).join('') + '</div>';
    },
    video: function(b){
      if (!b.url) return '<div class="blk">' + frame({}) + '</div>';
      return '<div class="blk film"><video src="' + esc(b.url) + '"' + (b.poster ? ' poster="' + esc(b.poster) + '"' : '') + ' controls playsinline preload="metadata"' + (b.loop ? ' loop muted autoplay' : '') + '></video>' + (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') + '</div>';
    }
  };

  function num(n){ return ('0' + n).slice(-2); }

  function renderBody(project, others){
    var meta = project.meta || {}, cat = D.catOf(project.category);
    var title = inline(project.title || 'Sans titre', true);
    var out = '';

    /* hero */
    var hasShot = !!meta.hero_image;
    out += '<section class="block first"><div class="case-hero' + (hasShot ? '' : ' no-image') + '"><div>' +
      '<p class="eyebrow"><span class="num">01</span> ' + esc(cat.title) + '</p>' +
      '<h1 class="proj-name balance">' + title + '</h1>' +
      '<div class="hero-tags"><span class="tag accent">' + esc(cat.title) + '</span>' + (project.date_label ? '<span class="tag">' + esc(project.date_label) + '</span>' : '') + '</div>' +
      (meta.lede ? '<p class="hero-lede">' + inline(meta.lede) + '</p>' : '') +
      '</div>' + (hasShot ? '<div class="hero-shot">' + img(meta.hero_image, project.title) + '</div>' : '') + '</div></section>';

    /* sections : chaque bloc "title" ouvre une nouvelle section numérotée */
    var n = 1, open = false, firstSection = true;
    function openSection(eyebrow, heading){
      if (open) out += '</section>';
      n++; open = true;
      out += '<section class="block"><p class="eyebrow"><span class="num">' + num(n) + '</span> ' + esc(eyebrow || '') + '</p>' +
        (heading ? '<h2 class="section-title balance">' + inline(heading, true) + '</h2>' : '');
    }
    (project.blocks || []).forEach(function(b){
      if (!b || !b.t) return;
      if (b.t === 'title'){ openSection(b.eyebrow, b.text); return; }
      if (!R[b.t]) return;
      if (!open){ n++; open = true; out += '<section class="block">'; }
      out += R[b.t](b);
    });
    if (open) out += '</section>';

    /* autres projets */
    if (others && others.length){
      out += '<section class="block"><div class="more-grid">' + others.map(function(p){
        return '<a class="more-card" href="' + esc(p.href) + '"><span class="more-media">' + (p.img ? '<img src="' + esc(p.img) + '" alt="' + esc(D.plain(p.name)) + '" loading="lazy">' : '') +
          '<span class="more-veil"></span><span class="more-cta"><span>Voir plus</span></span></span><span class="more-name">' + p.name + '</span></a>';
      }).join('') + '</div></section>';
    }
    return out;
  }

  /* deux autres projets : les suivants dans l'ordre du portfolio */
  function pickOthers(all, slug){
    var i = -1, k;
    for (k = 0; k < all.length; k++) if (all[k].slug === slug){ i = k; break; }
    var res = [];
    for (k = 1; k <= all.length && res.length < 2; k++){
      var p = all[((i < 0 ? -1 : i) + k + all.length) % all.length];
      if (p && p.slug !== slug && res.indexOf(p) < 0) res.push(p);
    }
    return res;
  }

  window.LT_RENDER = { applyTheme: applyTheme, themeVars: themeVars, renderBody: renderBody, pickOthers: pickOthers, inline: inline, hexOk: hexOk };
})();
