// Tests statiques : syntaxe JS (fichiers + scripts inline), JSON, références locales, sitemap
const fs = require('fs'), path = require('path'), cp = require('child_process');
process.chdir(__dirname);
const tmp = path.join(process.env.TEMP || '.', 'lt_inline.js');
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('ECHEC:', msg); } };

// 1. syntaxe des fichiers JS
for (const f of fs.readdirSync('assets').filter(f => f.endsWith('.js'))) {
  const r = cp.spawnSync('node', ['--check', 'assets/' + f]);
  ok(r.status === 0, 'syntaxe assets/' + f + ' ' + (r.stderr || '').toString().slice(0, 200));
}
// 2. scripts inline des pages
const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'));
for (const f of pages) {
  const s = fs.readFileSync(f, 'utf8');
  const re = /<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g;
  let m, i = 0;
  while ((m = re.exec(s))) {
    i++;
    fs.writeFileSync(tmp, m[1]);
    const r = cp.spawnSync('node', ['--check', tmp]);
    ok(r.status === 0, 'script inline #' + i + ' de ' + f + ' ' + (r.stderr || '').toString().slice(0, 200));
  }
  // JSON-LD valide
  const ld = s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ld) { try { JSON.parse(ld[1]); ok(true); } catch (e) { ok(false, 'JSON-LD invalide dans ' + f); } }
  // structure de tête : charset avant le titre, lang
  ok(/<html lang="fr">/.test(s), f + ' sans <html lang="fr">');
  ok(s.indexOf('<meta charset') > -1 && s.indexOf('<meta charset') < 1024, f + ' : charset hors des 1024 premiers octets');
  ok(!/MOCK|mock\.supabase/.test(s), f + ' contient une trace de mock');
}
// 3. références locales (src/href/url()) existantes
const missing = new Set();
for (const f of pages.concat(fs.readdirSync('assets').filter(f => /\.(js|css)$/.test(f)).map(f => 'assets/' + f))) {
  const s = fs.readFileSync(f, 'utf8');
  const refs = [...s.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)].map(m => m[1]);
  for (let r of refs) {
    if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(r)) continue;
    if (r.startsWith('/')) r = r.slice(1);
    const base = f.includes('/') ? path.dirname(f) : '.';
    const p1 = path.join('.', r), p2 = path.join(base, r);
    if (!fs.existsSync(p1) && !fs.existsSync(p2) && !/\$\{|'\s*\+|\+\s*'/.test(r)) missing.add(f + ' -> ' + r);
  }
}
for (const m of missing) ok(false, 'référence introuvable : ' + m);
// 4. sitemap
const sm = fs.readFileSync('sitemap.xml', 'utf8');
for (const m of sm.matchAll(/<loc>https:\/\/leotache\.ch\/([^<]*)<\/loc>/g)) ok(m[1] === '' || fs.existsSync(m[1]), 'sitemap : page absente ' + m[1]);
// 5. config réelle (pas de mock) et clé publique uniquement
const cfg = fs.readFileSync('assets/config.js', 'utf8');
ok(!/MOCK/.test(cfg), 'config.js contient le mock');
ok(/sb_publishable_/.test(cfg) && !/service_role|sb_secret_/.test(cfg), 'config.js : clé inattendue');
// 6. secrets dans le dépôt
for (const f of fs.readdirSync('.', { recursive: true }).filter(f => /\.(js|html|json|md|sql|txt|py)$/.test(f) && !/node_modules|\.git[\\/]/.test(f))) {
  let s; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  if (/service_role\s*[:=]\s*['"]ey|sb_secret_[A-Za-z0-9]{10,}|-----BEGIN (RSA |EC )?PRIVATE KEY/.test(s)) ok(false, 'secret possible dans ' + f);
}
console.log(checks + ' vérifications, ' + fails + ' échec(s)');
process.exit(fails ? 1 : 0);
