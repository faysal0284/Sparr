// server.js — mini serveur Node sans dépendance
// Stockage CSV + authentification (mots de passe hachés, cookie signé) + participations
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const DATA = path.join(__dirname, 'data');
const F_SESSIONS = path.join(DATA, 'sessions.csv');
const F_USERS = path.join(DATA, 'utilisateurs.csv');
const F_PARTS = path.join(DATA, 'participations.csv');
const F_SECRET = path.join(DATA, 'secret.key');
const COLS_SESSIONS = ['id', 'titre', 'sport', 'lieu', 'localisation', 'date', 'places', 'joueursMin', 'joueursMax', 'niveau', 'distance', 'createurId'];
const COLS_USERS = ['id', 'pseudo', 'email', 'sel', 'hash'];
const COLS_PARTS = ['sessionId', 'userId'];

const NOM_COOKIE = 'sparr_token';
const DUREE_SESSION = 7 * 24 * 3600 * 1000; // 7 jours

// ---------- CSV ----------
function echapper(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function parseCsv(texte) {
  const lignes = [];
  let ligne = [], champ = '', guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"' && texte[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ',') { ligne.push(champ); champ = ''; }
    else if (c === '\n') { ligne.push(champ); lignes.push(ligne); ligne = []; champ = ''; }
    else if (c !== '\r') champ += c;
  }
  if (champ !== '' || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes;
}

function lire(fichier, colonnes) {
  if (!fs.existsSync(fichier)) return [];
  const [, ...rows] = parseCsv(fs.readFileSync(fichier, 'utf8')); // 1re ligne = en-têtes
  return rows
    .filter(r => r.length > 1)
    .map(r => Object.fromEntries(colonnes.map((c, i) => [c, r[i] ?? ''])));
}

function ecrire(fichier, colonnes, objets) {
  fs.mkdirSync(DATA, { recursive: true });
  const lignes = [colonnes.join(',')]
    .concat(objets.map(o => colonnes.map(c => echapper(o[c])).join(',')));
  fs.writeFileSync(fichier, lignes.join('\n') + '\n');
}

// ---------- Authentification ----------
// Clé secrète servant à signer les cookies, générée une fois puis conservée
function obtenirSecret() {
  fs.mkdirSync(DATA, { recursive: true });
  if (!fs.existsSync(F_SECRET)) {
    fs.writeFileSync(F_SECRET, crypto.randomBytes(32).toString('hex'));
  }
  return fs.readFileSync(F_SECRET, 'utf8').trim();
}
const SECRET = obtenirSecret();

// Hachage du mot de passe avec scrypt + sel aléatoire (jamais de mot de passe en clair)
function hacher(motDePasse, sel = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(motDePasse, sel, 64).toString('hex');
  return { sel, hash };
}

function verifierMotDePasse(motDePasse, sel, hashAttendu) {
  const calcule = crypto.scryptSync(motDePasse, sel, 64);
  const attendu = Buffer.from(hashAttendu, 'hex');
  return attendu.length === calcule.length && crypto.timingSafeEqual(calcule, attendu);
}

function signer(texte) {
  return crypto.createHmac('sha256', SECRET).update(texte).digest('hex');
}

// Jeton : idUtilisateur.expiration.signature
function creerToken(userId) {
  const corps = userId + '.' + (Date.now() + DUREE_SESSION);
  return corps + '.' + signer(corps);
}

function lireToken(token) {
  if (!token) return null;
  const parties = token.split('.');
  if (parties.length !== 3) return null;
  const [id, expiration, signature] = parties;
  const a = Buffer.from(signature);
  const b = Buffer.from(signer(id + '.' + expiration));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Number(expiration) < Date.now()) return null;
  return id;
}

function lireCookie(req, nom) {
  for (const morceau of (req.headers.cookie || '').split(';')) {
    const [cle, ...valeur] = morceau.trim().split('=');
    if (cle === nom) return decodeURIComponent(valeur.join('='));
  }
  return null;
}

function cookieSession(token) {
  return `${NOM_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${DUREE_SESSION / 1000}`;
}
const COOKIE_SUPPRIME = `${NOM_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;

// Retourne l'utilisateur connecté (d'après le cookie) ou null
function utilisateurCourant(req) {
  const id = lireToken(lireCookie(req, NOM_COOKIE));
  if (!id) return null;
  return lire(F_USERS, COLS_USERS).find(u => u.id === id) || null;
}

const publicUser = u => ({ id: u.id, pseudo: u.pseudo });

// ---------- Sessions ----------
// parts = liste des participations ; monId = id de l'utilisateur connecté (ou null)
function versSession(o, parts = [], monId = null) {
  const inscrits = parts.filter(p => Number(p.sessionId) === Number(o.id));
  return {
    ...o,
    id: Number(o.id),
    places: Number(o.places),
    joueursMin: Number(o.joueursMin),
    joueursMax: Number(o.joueursMax),
    distance: o.distance ? Number(o.distance) : null,
    inscrits: inscrits.length,
    participe: monId !== null && inscrits.some(p => p.userId === monId)
  };
}
const lireParts = () => lire(F_PARTS, COLS_PARTS);
const lireSessions = (monId = null) => {
  const parts = lireParts();
  return lire(F_SESSIONS, COLS_SESSIONS).map(o => versSession(o, parts, monId));
};

function validerSession(data) {
  if (!data.titre || !String(data.titre).trim()) return 'Le titre est obligatoire.';
  if (!data.sport) return 'Le sport est obligatoire.';
  if (!data.date) return 'La date est obligatoire.';
  return null;
}

// Données de départ si le fichier n'existe pas encore
if (!fs.existsSync(F_SESSIONS)) {
  ecrire(F_SESSIONS, COLS_SESSIONS, [
    { id: 1, titre: 'Footing du dimanche', sport: 'Running', lieu: 'Lyon', date: '2026-10-04', places: 3, createurId: 'seed' },
    { id: 2, titre: 'Match 5v5', sport: 'Football', lieu: 'Paris', date: '2026-10-02', places: 2, createurId: 'seed' },
    { id: 3, titre: 'Tournoi amical', sport: 'Tennis', lieu: 'Lyon', date: '2026-10-10', places: 4, createurId: 'seed' },
    { id: 4, titre: 'Sortie vélo côtière', sport: 'Cyclisme', lieu: 'Nice', date: '2026-10-06', places: 6, createurId: 'seed' }
  ]);
}
supprimerSessionsPassees();
setInterval(supprimerSessionsPassees, 60 * 60 * 1000); // toutes les heures
// ---------- HTTP ----------
function lireCorps(req) {
  return new Promise(resolve => {
    let corps = '';
    req.on('data', d => {
      corps += d;
      if (corps.length > 1e5) req.destroy(); // limite de taille
    });
    req.on('end', () => { try { resolve(JSON.parse(corps || '{}')); } catch { resolve({}); } });
  });
}

function repondre(res, code, obj, entetes = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json', ...entetes });
  res.end(JSON.stringify(obj));
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const serveur = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // --- Inscription (compte) ---
  if (url.pathname === '/api/inscription' && req.method === 'POST') {
    const { pseudo, email, motDePasse } = await lireCorps(req);
    const p = String(pseudo || '').trim();
    const e = String(email || '').trim().toLowerCase();

    if (p.length < 2 || p.length > 30) return repondre(res, 400, { erreur: 'Le pseudo doit contenir entre 2 et 30 caractères.' });
    if (!REGEX_EMAIL.test(e)) return repondre(res, 400, { erreur: 'Adresse email invalide.' });
    if (typeof motDePasse !== 'string' || motDePasse.length < 8 || motDePasse.length > 200) {
      return repondre(res, 400, { erreur: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    const users = lire(F_USERS, COLS_USERS);
    if (users.find(u => u.email === e)) return repondre(res, 409, { erreur: 'Un compte existe déjà avec cet email.' });

    const { sel, hash } = hacher(motDePasse);
    const user = { id: crypto.randomUUID(), pseudo: p, email: e, sel, hash };
    users.push(user);
    ecrire(F_USERS, COLS_USERS, users);
    return repondre(res, 201, { utilisateur: publicUser(user) }, { 'Set-Cookie': cookieSession(creerToken(user.id)) });
  }

  // --- Connexion ---
  if (url.pathname === '/api/connexion' && req.method === 'POST') {
    const { email, motDePasse } = await lireCorps(req);
    const e = String(email || '').trim().toLowerCase();
    const mdp = typeof motDePasse === 'string' ? motDePasse : '';
    const user = lire(F_USERS, COLS_USERS).find(u => u.email === e);

    // Message volontairement identique que l'email existe ou non
    const valide = user ? verifierMotDePasse(mdp, user.sel, user.hash) : (hacher(mdp), false);
    if (!valide) return repondre(res, 401, { erreur: 'Email ou mot de passe incorrect.' });
    return repondre(res, 200, { utilisateur: publicUser(user) }, { 'Set-Cookie': cookieSession(creerToken(user.id)) });
  }

  // --- Déconnexion ---
  if (url.pathname === '/api/deconnexion' && req.method === 'POST') {
    return repondre(res, 200, { ok: true }, { 'Set-Cookie': COOKIE_SUPPRIME });
  }

  // --- Utilisateur connecté (null si personne) ---
  if (url.pathname === '/api/sessions' && req.method === 'GET') {
  supprimerSessionsPassees();
  const user = utilisateurCourant(req);
  return repondre(res, 200, lireSessions(user ? user.id : null));
}
  // --- API sessions ---
  if (url.pathname === '/api/sessions' && req.method === 'GET') {
  supprimerSessionsPassees();
  const user = utilisateurCourant(req);
  return repondre(res, 200, lireSessions(user ? user.id : null));
}

  if (url.pathname === '/api/sessions' && req.method === 'POST') {
    const user = utilisateurCourant(req);
    if (!user) return repondre(res, 401, { erreur: 'Connexion requise.' });
    const data = await lireCorps(req);
    const erreur = validerSession(data);
    if (erreur) return repondre(res, 400, { erreur });

    const sessions = lire(F_SESSIONS, COLS_SESSIONS);
    const prochainId = sessions.reduce((m, s) => Math.max(m, Number(s.id)), 0) + 1;
    const nouvelle = {
      id: prochainId,
      titre: String(data.titre).trim(),
      sport: data.sport,
      lieu: String(data.lieu || '').trim(),
      localisation: String(data.localisation || '').trim(),
      date: data.date,
      places: data.places,
      joueursMin: data.joueursMin,
      joueursMax: data.joueursMax,
      niveau: data.niveau,
      distance: data.distance || '',
      createurId: user.id // vient de l'authentification, jamais du client
    };
    sessions.push(nouvelle);
    ecrire(F_SESSIONS, COLS_SESSIONS, sessions);
    return repondre(res, 201, versSession(nouvelle, [], user.id));
  }

  const m = url.pathname.match(/^\/api\/sessions\/(\d+)$/);
  if (m && (req.method === 'PUT' || req.method === 'DELETE')) {
    const user = utilisateurCourant(req);
    if (!user) return repondre(res, 401, { erreur: 'Connexion requise.' });

    const sessions = lire(F_SESSIONS, COLS_SESSIONS);
    const index = sessions.findIndex(s => Number(s.id) === Number(m[1]));
    if (index === -1) return repondre(res, 404, { erreur: 'Session introuvable.' });
    // Contrôle du propriétaire côté serveur
    if (sessions[index].createurId !== user.id) {
      return repondre(res, 403, { erreur: 'Action réservée au créateur de la session.' });
    }

    if (req.method === 'DELETE') {
      sessions.splice(index, 1);
      ecrire(F_SESSIONS, COLS_SESSIONS, sessions);
      // On supprime aussi les inscriptions liées à cette session
      ecrire(F_PARTS, COLS_PARTS, lireParts().filter(p => Number(p.sessionId) !== Number(m[1])));
      return repondre(res, 200, { ok: true });
    }

    const data = await lireCorps(req);
    const erreur = validerSession(data);
    if (erreur) return repondre(res, 400, { erreur });

    // Empêche de réduire les places en dessous du nombre d'inscrits
    const nbInscrits = lireParts().filter(p => Number(p.sessionId) === Number(sessions[index].id)).length;
    if (Number(data.places) < nbInscrits) {
      return repondre(res, 400, { erreur: `Il y a déjà ${nbInscrits} inscrit(s), les places ne peuvent pas être inférieures.` });
    }

    sessions[index] = {
      ...sessions[index],
      titre: String(data.titre).trim(),
      sport: data.sport,
      lieu: String(data.lieu || '').trim(),
      localisation: String(data.localisation || '').trim(),
      date: data.date,
      places: data.places,
      joueursMin: data.joueursMin,
      joueursMax: data.joueursMax,
      niveau: data.niveau,
      distance: data.distance || ''
    };
    ecrire(F_SESSIONS, COLS_SESSIONS, sessions);
    return repondre(res, 200, versSession(sessions[index], lireParts(), user.id));
  }

  // --- Participation à une session (rejoindre / quitter) ---
  const mp = url.pathname.match(/^\/api\/sessions\/(\d+)\/participation$/);
  if (mp && (req.method === 'POST' || req.method === 'DELETE')) {
    const user = utilisateurCourant(req);
    if (!user) return repondre(res, 401, { erreur: 'Connexion requise.' });

    const sessionId = Number(mp[1]);
    const session = lire(F_SESSIONS, COLS_SESSIONS).find(s => Number(s.id) === sessionId);
    if (!session) return repondre(res, 404, { erreur: 'Session introuvable.' });

    let parts = lireParts();
    const dejaInscrit = parts.some(p => Number(p.sessionId) === sessionId && p.userId === user.id);

    if (req.method === 'POST') {
      if (session.createurId === user.id) return repondre(res, 400, { erreur: 'Vous êtes le créateur de cette session.' });
      if (dejaInscrit) return repondre(res, 409, { erreur: 'Vous êtes déjà inscrit.' });
      if (session.date < new Date().toISOString().split('T')[0]) return repondre(res, 400, { erreur: 'Cette session est passée.' });
      const nb = parts.filter(p => Number(p.sessionId) === sessionId).length;
      if (nb >= Number(session.places)) return repondre(res, 409, { erreur: 'Session complète.' });
      parts.push({ sessionId, userId: user.id });
    } else {
      parts = parts.filter(p => !(Number(p.sessionId) === sessionId && p.userId === user.id));
    }

    ecrire(F_PARTS, COLS_PARTS, parts);
    return repondre(res, 200, versSession(session, parts, user.id));
  }

  // --- Fichiers statiques (index.html, css/, js/ uniquement) ---
  const chemin = url.pathname === '/' ? '/index.html' : url.pathname;
  const autorise = chemin === '/index.html' || chemin.startsWith('/css/') || chemin.startsWith('/js/');
  const complet = path.join(__dirname, chemin);
  if (!autorise || !complet.startsWith(__dirname) || !fs.existsSync(complet)) {
    res.writeHead(404);
    return res.end('Not found');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(complet)] || 'text/plain' });
  fs.createReadStream(complet).pipe(res);
});

serveur.listen(PORT, () => console.log(`Sparr sur http://localhost:${PORT}`));
function supprimerSessionsPassees() {
  const aujourdhui = new Date().toISOString().split('T')[0];
  const sessions = lire(F_SESSIONS, COLS_SESSIONS);
  const restantes = sessions.filter(s => s.date >= aujourdhui);
  if (restantes.length === sessions.length) return; // rien à supprimer

  ecrire(F_SESSIONS, COLS_SESSIONS, restantes);

  // On supprime aussi les inscriptions des sessions disparues
  const ids = new Set(restantes.map(s => Number(s.id)));
  ecrire(F_PARTS, COLS_PARTS, lireParts().filter(p => ids.has(Number(p.sessionId))));
}
