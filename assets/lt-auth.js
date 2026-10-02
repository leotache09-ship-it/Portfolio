/*
 * LT Design — connexion administrateur (Supabase Auth).
 * La bibliothèque supabase-js n'est chargée QUE quand on se connecte ou
 * qu'on ouvre le mode administrateur, jamais pour un simple visiteur.
 *
 * "Nom" : si le champ ne contient pas de "@", on lui ajoute le domaine
 * technique @admin.leotache.ch (le compte est créé à la main dans Supabase,
 * voir supabase/INSTALLATION.md ; ce n'est pas une vraie boîte mail).
 */
(function(){
  var CFG = window.LT_CONFIG || {};
  var LIB_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  var DOMAIN = '@admin.leotache.ch';
  var clientPromise = null;

  function configured(){ return !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY); }

  function loadLib(){
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = LIB_URL; s.async = true;
      s.onload = resolve;
      s.onerror = function(){ reject(new Error('Impossible de charger la bibliothèque de connexion.')); };
      document.head.appendChild(s);
    });
  }

  function client(){
    if (!configured()) return Promise.reject(new Error('NOT_CONFIGURED'));
    if (!clientPromise){
      clientPromise = loadLib().then(function(){
        return window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
          /* sessionStorage : la session ne survit que dans l'onglet en cours
             (elle disparaît à la fermeture de l'onglet/du navigateur) —
             il faut donc se reconnecter à chaque nouvelle visite du mode
             créateur, voulu par le propriétaire. */
          auth: { persistSession: true, autoRefreshToken: true, storage: window.sessionStorage }
        });
      }).catch(function(e){ clientPromise = null; throw e; });
    }
    return clientPromise;
  }

  function emailFrom(name){
    name = String(name || '').trim().toLowerCase();
    return name.indexOf('@') > -1 ? name : name + DOMAIN;
  }

  function signIn(name, password){
    return client().then(function(c){
      return c.auth.signInWithPassword({ email: emailFrom(name), password: password });
    }).then(function(res){
      if (res.error) throw new Error('Nom ou mot de passe incorrect.');
      return res.data;
    });
  }
  function signOut(){ return client().then(function(c){ return c.auth.signOut(); }); }
  function session(){ return client().then(function(c){ return c.auth.getSession(); }).then(function(r){ return r.data && r.data.session || null; }); }

  /* Détection rapide, sans bibliothèque : une session Supabase est stockée
     par supabase-js (ici dans sessionStorage) sous la clé sb-<ref>-auth-token. Sert seulement à
     adapter l'interface (étoile qui mène directement au mode créateur,
     bouton "Modifier") ; la vraie vérification reste celle de Supabase. */
  function looksLoggedIn(){
    if (!configured()) return false;
    try {
      var ref = new URL(CFG.SUPABASE_URL).hostname.split('.')[0];
      return !!sessionStorage.getItem('sb-' + ref + '-auth-token');
    } catch (e) { return false; }
  }

  window.LT_AUTH = { configured: configured, client: client, signIn: signIn, signOut: signOut, session: session, looksLoggedIn: looksLoggedIn, emailFrom: emailFrom };
})();
