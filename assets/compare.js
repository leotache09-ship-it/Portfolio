/*
 * Bloc « avant / après » des pages projet (.cmp, rendu par project-render.js) :
 * on glisse la barre (souris ou doigt) ou on la déplace au clavier (flèches).
 * Délégation sur le document : fonctionne aussi pour le contenu injecté après coup (projet.html, aperçu de l'éditeur).
 * Sur téléphone, un geste vertical fait défiler la page normalement (touch-action:pan-y) ; seul un geste horizontal déplace la barre.
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
    var c = bar.closest('.cmp'), cur = parseFloat(c.style.getPropertyValue('--pos')) || 50, step = e.shiftKey ? 10 : 2, k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowDown') setPos(c, cur - step);
    else if (k === 'ArrowRight' || k === 'ArrowUp') setPos(c, cur + step);
    else if (k === 'Home') setPos(c, 0);
    else if (k === 'End') setPos(c, 100);
    else return;
    e.preventDefault();
  });
})();
