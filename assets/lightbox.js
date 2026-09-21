/*
 * LT Design — visionneuse plein écran
 * Rend cliquables toutes les images des pages projet : un clic les affiche
 * en grand par-dessus la page (fond sombre, fermeture au clic à côté,
 * sur la croix ou avec Échap).
 */
(function () {
  function init() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('main img'));
    imgs = imgs.filter(function (im) { return !im.closest('a'); });
    if (!imgs.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var style = document.createElement('style');
    style.textContent =
      '.lt-lightbox{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;' +
      'padding:6vh 6vw;background:rgba(8,8,9,.92);opacity:0;visibility:hidden;transition:opacity .3s ease;}' +
      '.lt-lightbox.is-open{opacity:1;visibility:visible;}' +
      '.lt-lightbox img{max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 30px 80px rgba(0,0,0,.5);' +
      'transform:scale(.96);transition:transform .3s cubic-bezier(.2,.7,.2,1);}' +
      '.lt-lightbox.is-open img{transform:none;}' +
      '.lt-lightbox-close{position:fixed;top:20px;right:20px;width:44px;height:44px;border-radius:50%;' +
      'border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;transition:background .3s,border-color .3s;}' +
      '.lt-lightbox-close:hover{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.5);}' +
      'main img{cursor:zoom-in;}' +
      '@media (prefers-reduced-motion: reduce){.lt-lightbox,.lt-lightbox img{transition-duration:.01ms;}}';
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'lt-lightbox';
    overlay.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img');
    img.alt = '';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'lt-lightbox-close';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    var lastFocused = null;

    function open(src, alt) {
      lastFocused = document.activeElement;
      img.src = src;
      img.alt = alt || '';
      overlay.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
      closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
      window.setTimeout(function () { if (!overlay.classList.contains('is-open')) img.src = ''; }, reduced ? 0 : 300);
    }

    imgs.forEach(function (source) {
      source.addEventListener('click', function () {
        open(source.currentSrc || source.src, source.alt);
      });
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
