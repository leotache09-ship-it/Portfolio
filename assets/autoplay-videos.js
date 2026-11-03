/*
 * Lance automatiquement les vidéos d'une page projet : en sourdine (obligatoire pour la lecture
 * automatique des navigateurs), dès qu'elles entrent à l'écran ; les commandes restent disponibles
 * pour remettre le son. Dernière tentative à la première interaction si le navigateur a refusé.
 * Pages statiques : s'exécute tout seul. Pages générées (projet.html) : appeler LT_autoplay(conteneur)
 * après avoir injecté le contenu.
 */
(function(){
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tryPlay(v){
    if (!v || !v.paused) return;
    var p = v.play(); if (p && p.catch) p.catch(function(){});
  }

  function autoplay(root){
    if (reduced) return;
    var vids = Array.prototype.slice.call((root || document).querySelectorAll('video'));
    if (!vids.length) return;
    vids.forEach(function(v){ v.muted = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); });
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if (e.isIntersecting) tryPlay(e.target); });
      }, { threshold: .25 });
      vids.forEach(function(v){ io.observe(v); });
    } else {
      vids.forEach(tryPlay);
    }
    var retry = function(){
      vids.forEach(function(v){
        var r = v.getBoundingClientRect();
        if (r.bottom > 0 && r.top < (window.innerHeight || 800)) tryPlay(v);
      });
      ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(function(t){ window.removeEventListener(t, retry); });
    };
    ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(function(t){ window.addEventListener(t, retry, { passive:true, once:true }); });
  }

  window.LT_autoplay = autoplay;
  if (!document.getElementById('app')){   /* page statique (pas projet.html) */
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ autoplay(document); });
    else autoplay(document);
  }
})();
