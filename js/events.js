// events.js — accès à l'API (sessions + authentification)
// L'identité de l'utilisateur est portée par un cookie HttpOnly posé par le serveur.

let utilisateur = null; // { id, pseudo } si connecté, sinon null
let monId = null;       // raccourci : id de l'utilisateur connecté
let evenements = [];

// Appel générique : retourne toujours { ok, status, data }
async function appel(url, methode = 'GET', corps) {
  const options = { method: methode, headers: {} };
  if (corps !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(corps);
  }
  const r = await fetch(url, options);
  let data = null;
  try { data = await r.json(); } catch { /* réponse sans JSON */ }
  return { ok: r.ok, status: r.status, data };
}

function definirUtilisateur(u) {
  utilisateur = u || null;
  monId = utilisateur ? utilisateur.id : null;
}

// ----- Authentification -----
async function chargerUtilisateur() {
  const r = await appel('/api/moi');
  definirUtilisateur(r.ok && r.data ? r.data.utilisateur : null);
}

async function inscription(pseudo, email, motDePasse) {
  const r = await appel('/api/inscription', 'POST', { pseudo, email, motDePasse });
  if (r.ok) definirUtilisateur(r.data.utilisateur);
  return r;
}

async function connexion(email, motDePasse) {
  const r = await appel('/api/connexion', 'POST', { email, motDePasse });
  if (r.ok) definirUtilisateur(r.data.utilisateur);
  return r;
}

async function deconnexion() {
  await appel('/api/deconnexion', 'POST');
  definirUtilisateur(null);
}

// ----- Sessions -----
async function chargerEvenements() {
  const r = await appel('/api/sessions');
  evenements = r.ok && Array.isArray(r.data) ? r.data : [];
}

const creerEvenement = (data) => appel('/api/sessions', 'POST', data);
const modifierEvenement = (id, data) => appel('/api/sessions/' + id, 'PUT', data);
const supprimerEvenement = (id) => appel('/api/sessions/' + id, 'DELETE');
const rejoindreSession = (id) => appel('/api/sessions/' + id + '/participation', 'POST');
const quitterSession = (id) => appel('/api/sessions/' + id + '/participation', 'DELETE');