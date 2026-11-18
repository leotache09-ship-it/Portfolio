/*
 * Bloc « avant / après » des pages projet (.cmp, rendu par project-render.js) :
 * on glisse la barre (souris ou doigt) ou on la déplace au clavier (flèches).
 * Délégation sur le document : fonctionne aussi pour le contenu injecté après coup (projet.html, aperçu de l'éditeur).
 * Sur téléphone, un geste vertical fait défiler la page normalement (touch-action:pan-y) ; seul un geste horizontal déplace la barre.
 * Animation d'appel : quand le bloc arrive à l'écran, la barre glisse un peu à gauche puis à droite et revient (une seule fois
 * par bloc, jamais si l'utilisateur l'a déjà touchée ni avec « mouvement réduit »), pour montrer qu'il y a quelque chose derrière.
 */
(function(){
  function setPos(c, p){
    p = Math.max(0, Math.min(100, p));
    c.style.setProperty('--pos', p + '%');
    var bar = c.querySelector('.cmp-bar'); if (bar) bar.setAttribute('aria-valuenow', Math.round(p));
  }
  function at(c, e){ var r = c.getBoundingClientRect(); return r.width ? (e.clientX - r.left) / r.width * 100 : 50; }

  document.addEventListener('pointerdown', function(e){
    var c = e.target.closest && e.target.closest('.cmp');
    if (!c || (e.pointerType === 'mouse' && e.button !== 0)) return;
    c._user = true;   /* l'utilisateur a pris la main : l'animation d'appel s'arrête */
    var id = e.pointerId, mouse = e.pointerType === 'mouse', moved = false;
    if (mouse){ e.preventDefault(); setPos(c, at(c, e)); }
    try { c.setPointerCapture(id); } catch (x){}
    c.classList.add('dragging');
    function move(ev){ if (ev.pointerId !== id) return; moved = true; setPos(c, at(c, ev)); }
    function end(ev){
      if (ev.pointerId !== id) return;
      if (ev.type === 'pointerup' && !mouse && !moved) setPos(c, at(c, ev));   /* simple toucher : la barre vient sous le doigt */
      c.classList.remove('dragging');
      c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', end); c.removeEventListener('pointercancel', end);
    }
    c.addEventListener('pointermove', move); c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  });

  document.addEventListener('keydown', function(e){
    var bar = e.target.closest && e.target.closest('.cmp-bar');
    if (!bar) return;
    var c = bar.closest('.cmp'); c._user = true;
    var cur = parseFloat(c.style.getPropertyValue('--pos')) || 50, step = e.shiftKey ? 10 : 2, k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowDown') setPos(c, cur - step);
    else if (k === 'ArrowRight' || k === 'ArrowUp') setPos(c, cur + step);
    else if (k === 'Home') setPos(c, 0);
    else if (k === 'End') setPos(c, 100);
    else return;
    e.preventDefault();
  });

  /* ---------- animation d'appel ---------- */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var done = {};   /* une seule fois par bloc (clé = les deux images), même si la page est redessinée (aperçu de l'éditeur) */
  function ease(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function tease(c){
    if (reduced || c._user) return;
    var ims = c.querySelectorAll('.cmp-over img'), key = Array.prototype.map.call(ims, function(i){ return i.getAttribute('src'); }).join('|');
    if (done[key]) return;
    done[key] = true;
    var p0 = parseFloat(c.getAttribute('data-start')) || 50, A = Math.min(16, p0 - 6, 94 - p0);
    var KEYS = [ [0, p0], [550, p0 - A], [1350, p0 + A], [1950, p0] ], END = 1950, t0 = null;
    function step(now){
      if (c._user) return;
      if (t0 === null) t0 = now;
      var t = now - t0, i = 1;
      if (t >= END){ setPos(c, p0); return; }
      while (KEYS[i][0] < t) i++;
      var a = KEYS[i - 1], b = KEYS[i];
      setPos(c, a[1] + (b[1] - a[1]) * ease((t - a[0]) / (b[0] - a[0])));
      requestAnimationFrame(step);
    }
    setTimeout(function(){ if (!c._user) requestAnimationFrame(step); }, 250);
    setTimeout(function(){ if (!c._user) setPos(c, p0); }, 250 + END + 400);   /* garde-fou : la barre revient toujours à sa place */
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if (en.isIntersecting){ io.unobserve(en.target); tease(en.target); } });
  }, { threshold: .6 }) : null;
  function scan(){
    if (!io) return;
    Array.prototype.forEach.call(document.querySelectorAll('.cmp'), function(c){ if (!c._watched){ c._watched = true; io.observe(c); } });
  }
  /* les blocs sont injectés après le chargement (projet.html, aperçu) : on surveille l'arrivée de nouveaux blocs */
  if ('MutationObserver' in window) new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
