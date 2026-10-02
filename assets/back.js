/*
 * Bouton "Retour" en haut à gauche des pages projet : revient à la page
 * précédente (comme le bouton retour du navigateur). Si on est arrivé
 * directement sur la page (lien partagé, nouvel onglet), le lien normal
 * vers l'accueil reste le repli.
 */
(function(){
  var a = document.querySelector('header.nav a.back');
  if (!a) return;
  a.addEventListener('click', function(e){
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    var sameSite = false;
    try { sameSite = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (x) {}
    if (sameSite && history.length > 1){ e.preventDefault(); history.back(); }
  });
})();
