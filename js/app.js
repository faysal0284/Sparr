// app.js — logique d'affichage et interactions

const liste = document.getElementById('liste-evenements');
const form = document.getElementById('form-evenement');
const btnAnnuler = document.getElementById('btn-annuler');
const formTitre = document.getElementById('form-titre');
const erreurs = document.getElementById('err-evenement');
const selectSport = document.getElementById('evt-sport');
const groupeDistance = document.getElementById('groupe-distance');
const champDistance = document.getElementById('evt-distance');

// Éléments liés à l'authentification
const sectionAuth = document.getElementById('section-auth');
const sectionCreation = document.getElementById('section-creation');
const zoneUtilisateur = document.getElementById('zone-utilisateur');
const nomUtilisateur = document.getElementById('nom-utilisateur');
const btnDeconnexion = document.getElementById('btn-deconnexion');
const authTitre = document.getElementById('auth-titre');
const formConnexion = document.getElementById('form-connexion');
const formInscription = document.getElementById('form-inscription');
const erreurConnexion = document.getElementById('err-connexion');
const erreurInscription = document.getElementById('err-inscription');

// Empêche de choisir une date passée dans le sélecteur
const champDate = document.getElementById('evt-date');
const aujourdhui = new Date().toISOString().split('T')[0]; // format YYYY-MM-DD
champDate.setAttribute('min', aujourdhui);

// Évite l'injection de HTML via les champs texte
function echapperHtml(texte) {
  return String(texte ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

selectSport.addEventListener('change', () => {
  if (selectSport.value === 'Running') {
    groupeDistance.classList.remove('hidden');
    champDistance.required = true;
  } else {
    groupeDistance.classList.add('hidden');
    champDistance.required = false;
    champDistance.value = '';
  }
});

function afficherEvenements() {
  liste.innerHTML = '';
  evenements.forEach(evt => {
    const estProprietaire = monId !== null && evt.createurId === monId;
    const inscrits = evt.inscrits || 0;
    const complet = inscrits >= evt.places;
    const passee = evt.date < aujourdhui;

    // Bouton d'inscription (le créateur n'en a pas)
    let action = '';
    if (!estProprietaire) {
      if (passee) {
        action = `<button class="btn-rejoindre" data-id="${evt.id}" disabled title="Session dépassée">Session dépassée</button>`;
      } else if (evt.participe) {
        action = `<button class="btn-quitter" data-id="${evt.id}">Se désinscrire</button>`;
      } else if (complet) {
        action = `<button class="btn-rejoindre" data-id="${evt.id}" disabled title="Session complète">Complet</button>`;
      } else {
        action = `<button class="btn-rejoindre" data-id="${evt.id}">Rejoindre</button>`;
      }
    }

    const carte = document.createElement('div');
    carte.className = 'card';
    carte.innerHTML = `
      <h3>${echapperHtml(evt.titre)}</h3>
      <p>${echapperHtml(evt.sport)} — ${echapperHtml(evt.lieu)}</p>
      <p>${echapperHtml(evt.date)}</p>
      <p class="compteur"><strong>${inscrits} / ${evt.places}</strong> joueurs inscrits</p>
      ${action}
      ${estProprietaire ? `<button class="btn-modifier" data-id="${evt.id}">Modifier</button>` : ''}
      ${estProprietaire ? `<button class="btn-supprimer" data-id="${evt.id}">Supprimer</button>` : ''}
    `;
    liste.appendChild(carte);
  });
}



// ===== Affichage selon l'état de connexion =====
function miseAJourInterface() {
  const connecte = utilisateur !== null;
  sectionAuth.classList.toggle('hidden', connecte);
  sectionCreation.classList.toggle('hidden', !connecte);
  zoneUtilisateur.classList.toggle('hidden', !connecte);
  if (connecte) nomUtilisateur.textContent = utilisateur.pseudo;
  afficherEvenements();
}

function reinitialiserFormulaire() {
  form.reset();
  document.getElementById('evt-id').value = '';
  groupeDistance.classList.add('hidden');
  champDistance.required = false;
  formTitre.textContent = 'Créer une session';
  btnAnnuler.classList.add('hidden');
}

// Appelée quand le serveur répond 401 (cookie expiré ou invalide)
async function sessionExpiree() {
  definirUtilisateur(null);
  reinitialiserFormulaire();
  afficherFormulaireConnexion();
  erreurConnexion.textContent = 'Votre session a expiré, veuillez vous reconnecter.';
  await chargerEvenements();
  miseAJourInterface();
}

// ===== Connexion / Inscription =====
function afficherFormulaireConnexion() {
  authTitre.textContent = 'Connexion';
  formConnexion.classList.remove('hidden');
  formInscription.classList.add('hidden');
  erreurConnexion.textContent = '';
  erreurInscription.textContent = '';
}

function afficherFormulaireInscription() {
  authTitre.textContent = 'Créer un compte';
  formInscription.classList.remove('hidden');
  formConnexion.classList.add('hidden');
  erreurConnexion.textContent = '';
  erreurInscription.textContent = '';
}

document.getElementById('vers-inscription').addEventListener('click', afficherFormulaireInscription);
document.getElementById('vers-connexion').addEventListener('click', afficherFormulaireConnexion);

formConnexion.addEventListener('submit', async (e) => {
  e.preventDefault();
  const donnees = {
    email: document.getElementById('conn-email').value,
    motDePasse: document.getElementById('conn-mdp').value
  };
  const erreur = validerConnexion(donnees);
  if (erreur) { erreurConnexion.textContent = erreur; return; }

  try {
    const r = await connexion(donnees.email, donnees.motDePasse);
    if (!r.ok) {
      erreurConnexion.textContent = (r.data && r.data.erreur) || 'Connexion impossible.';
      return;
    }
  } catch {
    erreurConnexion.textContent = 'Serveur injoignable.';
    return;
  }
  formConnexion.reset();
  erreurConnexion.textContent = '';
  await chargerEvenements();
  miseAJourInterface();
});

formInscription.addEventListener('submit', async (e) => {
  e.preventDefault();
  const donnees = {
    pseudo: document.getElementById('ins-pseudo').value,
    email: document.getElementById('ins-email').value,
    motDePasse: document.getElementById('ins-mdp').value,
    confirmation: document.getElementById('ins-mdp2').value
  };
  const erreur = validerInscription(donnees);
  if (erreur) { erreurInscription.textContent = erreur; return; }

  try {
    const r = await inscription(donnees.pseudo, donnees.email, donnees.motDePasse);
    if (!r.ok) {
      erreurInscription.textContent = (r.data && r.data.erreur) || "Inscription impossible.";
      return;
    }
  } catch {
    erreurInscription.textContent = 'Serveur injoignable.';
    return;
  }
  formInscription.reset();
  erreurInscription.textContent = '';
  afficherFormulaireConnexion();
  await chargerEvenements();
  miseAJourInterface();
});

btnDeconnexion.addEventListener('click', async () => {
  await deconnexion();
  reinitialiserFormulaire();
  erreurs.textContent = '';
  afficherFormulaireConnexion();
  await chargerEvenements();
  miseAJourInterface();
});

// ===== Création / modification d'une session =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('evt-id').value;
  const data = {
    titre: document.getElementById('evt-titre').value,
    sport: document.getElementById('evt-sport').value,
    lieu: document.getElementById('evt-lieu').value,
    localisation: document.getElementById('evt-localisation').value,
    date: document.getElementById('evt-date').value,
    places: document.getElementById('evt-places').value,
    joueursMin: document.getElementById('evt-joueurs-min').value,
    joueursMax: document.getElementById('evt-joueurs-max').value,
    niveau: document.getElementById('evt-niveau').value,
    distance: document.getElementById('evt-sport').value === 'Running'
      ? document.getElementById('evt-distance').value
      : null
  };

  // Validation côté client
  const erreur = validerFormulaire(data);
  if (erreur) {
    erreurs.textContent = erreur;
    return; // bloque la suite, rien n'est créé/modifié
  }
  erreurs.textContent = '';

  let r;
  try {
    r = id ? await modifierEvenement(id, data) : await creerEvenement(data);
  } catch {
    erreurs.textContent = 'Serveur injoignable. Lancez « node server.js » et ouvrez http://localhost:3000.';
    return;
  }

  if (!r.ok) {
    if (r.status === 401) return sessionExpiree();
    erreurs.textContent = (r.data && r.data.erreur) || "L'opération a échoué.";
    return;
  }

  reinitialiserFormulaire();
  await chargerEvenements();
  afficherEvenements();
});

// ===== Modale de confirmation de suppression =====
const modalSuppression = document.getElementById('modal-suppression');
const btnModalConfirmer = document.getElementById('modal-confirmer');
const btnModalAnnuler = document.getElementById('modal-annuler');
let idASupprimer = null;

function ouvrirModaleSuppression(id) {
  idASupprimer = id;
  modalSuppression.classList.remove('hidden');
}

function fermerModaleSuppression() {
  idASupprimer = null;
  modalSuppression.classList.add('hidden');
}

btnModalConfirmer.addEventListener('click', async () => {
  if (idASupprimer !== null) {
    const r = await supprimerEvenement(idASupprimer);
    fermerModaleSuppression();
    if (!r.ok) {
      if (r.status === 401) return sessionExpiree();
      erreurs.textContent = (r.data && r.data.erreur) || 'Suppression impossible.';
      return;
    }
    await chargerEvenements();
    afficherEvenements();
    return;
  }
  fermerModaleSuppression();
});

// Fermer sans confirmer : bouton Annuler, clic sur le fond, touche Échap
btnModalAnnuler.addEventListener('click', fermerModaleSuppression);
modalSuppression.addEventListener('click', (e) => {
  if (e.target === modalSuppression) fermerModaleSuppression();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fermerModaleSuppression();
});

// ===== Clics sur les cartes (Modifier / Supprimer) =====
liste.addEventListener('click', async (e) => {
   const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('btn-rejoindre') || e.target.classList.contains('btn-quitter')) {
    if (e.target.disabled) return;

    if (monId === null) {
      sectionAuth.scrollIntoView({ behavior: 'smooth' });
      erreurConnexion.textContent = 'Connectez-vous pour rejoindre une session.';
      return;
    }

    e.target.disabled = true;
    const r = e.target.classList.contains('btn-rejoindre')
      ? await rejoindreSession(id)
      : await quitterSession(id);

    if (!r.ok) {
      if (r.status === 401) return sessionExpiree();
      alert((r.data && r.data.erreur) || "L'opération a échoué.");
    }
    await chargerEvenements();
    afficherEvenements();
    return;
  }
  if (e.target.classList.contains('btn-supprimer')) {
    const evt = evenements.find(ev => ev.id === Number(id));
    if (!evt || evt.createurId !== monId) return;
    ouvrirModaleSuppression(id);
  }

  if (e.target.classList.contains('btn-modifier')) {
    const evt = evenements.find(ev => ev.id === Number(id));
    if (!evt) return;
    if (evt.createurId !== monId) return;
    document.getElementById('evt-id').value = evt.id;
    document.getElementById('evt-titre').value = evt.titre;
    document.getElementById('evt-sport').value = evt.sport;
    document.getElementById('evt-lieu').value = evt.lieu;
    document.getElementById('evt-localisation').value = evt.localisation || '';
    document.getElementById('evt-date').value = evt.date;
    document.getElementById('evt-places').value = evt.places;
    document.getElementById('evt-joueurs-min').value = evt.joueursMin || 1;
    document.getElementById('evt-joueurs-max').value = evt.joueursMax || 10;
    document.getElementById('evt-niveau').value = evt.niveau || '';
    formTitre.textContent = 'Modifier la session';
    btnAnnuler.classList.remove('hidden');
    if (evt.sport === 'Running') {
      groupeDistance.classList.remove('hidden');
      champDistance.required = true;
      champDistance.value = evt.distance || '';
    } else {
      groupeDistance.classList.add('hidden');
      champDistance.required = false;
      champDistance.value = '';
    }
    sectionCreation.scrollIntoView({ behavior: 'smooth' });
  }
});

btnAnnuler.addEventListener('click', () => {
  reinitialiserFormulaire();
  erreurs.textContent = '';
});

// ===== Affichage initial =====
chargerUtilisateur()
  .then(chargerEvenements)
  .then(miseAJourInterface)
  .catch(() => {
    erreurConnexion.textContent = 'Serveur injoignable. Lancez « node server.js » et ouvrez http://localhost:3000.';
  });