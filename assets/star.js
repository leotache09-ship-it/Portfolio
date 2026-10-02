/*
 * LT Design — étoile bleue du mode administrateur (en haut à droite).
 * Clic : fenêtre "nom + mot de passe" ; une fois connecté on est envoyé
 * vers admin.html. Si une session existe déjà, l'étoile mène directement
 * au mode administrateur.
 * Dépend de assets/config.js et assets/lt-auth.js (inclus avant).
 */
(function(){
  var header = document.querySelector('header.nav') || document.querySelector('header');
  if (!header || !window.LT_AUTH) return;

  var css = document.createElement('style');
  css.textContent =
    '.admin-star{ flex:none; width:30px; height:30px; border:none; border-radius:4px; background:#189CD8; color:#fff; cursor:pointer; padding:0; display:flex; align-items:center; justify-content:center; margin-left:14px; position:relative; z-index:501; transition: transform .25s cubic-bezier(.2,.7,.2,1), box-shadow .25s; }' +
    '.admin-star:hover{ transform: rotate(12deg) scale(1.08); box-shadow:0 0 18px rgba(24,156,216,.6); }' +
    '.admin-star:focus-visible{ outline:2px solid #fff; outline-offset:2px; }' +
    '.admin-star svg{ width:16px; height:16px; display:block; }' +
    '.lt-login-back{ position:fixed; inset:0; z-index:10000; background:rgba(5,5,7,.72); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:16px; }' +
    '.lt-login-back[hidden]{ display:none; }' +
    '.lt-login{ width:100%; max-width:380px; background:#18181b; color:#f2f2f2; border:1px solid rgba(242,242,242,.16); border-radius:6px; padding:28px 24px 24px; font-family:Roboto,-apple-system,"Segoe UI",sans-serif; position:relative; }' +
    '.lt-login h2{ font-family:"Archivo Black",Roboto,sans-serif; text-transform:uppercase; font-weight:400; font-size:1.35rem; margin:0 0 6px; }' +
    '.lt-login h2 span{ color:#189CD8; }' +
    '.lt-login p{ margin:0 0 18px; font-size:.88rem; color:rgba(242,242,242,.6); }' +
    '.lt-login label{ display:block; font-family:"Roboto Mono",monospace; font-size:.66rem; letter-spacing:.12em; text-transform:uppercase; color:rgba(242,242,242,.5); margin:0 0 6px; }' +
    '.lt-login input{ width:100%; background:#0d0d0f; border:1px solid rgba(242,242,242,.16); border-radius:3px; color:#f2f2f2; font:inherit; font-size:1rem; padding:11px 12px; margin:0 0 14px; }' +
    '.lt-login input:focus{ outline:none; border-color:#189CD8; }' +
    '.lt-login button.go{ width:100%; background:#189CD8; color:#0d0d0f; border:none; border-radius:3px; padding:12px; font-family:"Roboto Mono",monospace; font-size:.8rem; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; font-weight:500; }' +
    '.lt-login button.go[disabled]{ opacity:.6; cursor:progress; }' +
    '.lt-login .x{ position:absolute; top:10px; right:10px; width:32px; height:32px; background:none; border:none; color:rgba(242,242,242,.6); font-size:1.4rem; cursor:pointer; line-height:1; }' +
    '.lt-login .x:hover{ color:#fff; }' +
    '.lt-login .err{ min-height:1.2em; margin:12px 0 0; font-size:.86rem; color:#ff7a59; }';
  document.head.appendChild(css);

  var star = document.createElement('button');
  star.type = 'button';
  star.className = 'admin-star';
  star.setAttribute('aria-label', 'Mode administrateur');
  star.title = 'Mode administrateur';
  star.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2l2.9 6.5 7.1.7-5.3 4.8 1.5 7-6.2-3.6-6.2 3.6 1.5-7L2 9.4l7.1-.7z"/></svg>';
  (header.querySelector('.right') || header).appendChild(star);

  var back = null, form, errEl, btn, nameEl, passEl, lastFocus;

  function build(){
    back = document.createElement('div');
    back.className = 'lt-login-back';
    back.hidden = true;
    back.innerHTML =
      '<form class="lt-login" role="dialog" aria-modal="true" aria-labelledby="ltLoginTitle" autocomplete="on">' +
        '<button type="button" class="x" aria-label="Fermer">&times;</button>' +
        '<h2 id="ltLoginTitle">Mode <span>admin</span></h2>' +
        '<p>Accès réservé au propriétaire du site.</p>' +
        '<label for="ltName">Nom</label><input id="ltName" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required>' +
        '<label for="ltPass">Mot de passe</label><input id="ltPass" name="password" type="password" autocomplete="current-password" required>' +
        '<button class="go" type="submit">Se connecter</button>' +
        '<p class="err" role="alert"></p>' +
      '</form>';
    document.body.appendChild(back);
    form = back.querySelector('form'); errEl = back.querySelector('.err'); btn = back.querySelector('.go');
    nameEl = back.querySelector('#ltName'); passEl = back.querySelector('#ltPass');
    back.querySelector('.x').addEventListener('click', close);
    back.addEventListener('mousedown', function(e){ if (e.target === back) close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !back.hidden) close(); });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (!window.LT_AUTH.configured()){ errEl.textContent = "Le mode administrateur n'est pas encore activé sur ce site."; return; }
      btn.disabled = true; errEl.textContent = '';
      window.LT_AUTH.signIn(nameEl.value, passEl.value).then(function(){
        location.href = 'admin.html';
      }).catch(function(err){
        errEl.textContent = err && err.message === 'NOT_CONFIGURED' ? "Le mode administrateur n'est pas encore activé sur ce site." : (err && err.message) || 'Connexion impossible.';
        btn.disabled = false; passEl.value = ''; passEl.focus();
      });
    });
  }
  function open(){
    if (!back) build();
    lastFocus = document.activeElement;
    back.hidden = false; errEl.textContent = '';
    nameEl.focus();
  }
  function close(){
    back.hidden = true; btn.disabled = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  star.addEventListener('click', function(){
    if (window.LT_AUTH.looksLoggedIn()) { location.href = 'admin.html'; return; }
    open();
  });
})();
