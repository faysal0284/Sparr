

// app.js — logique d'affichage et interactions

const liste = document.getElementById('liste-evenements');
const form = document.getElementById('form-evenement');
const btnAnnuler = document.getElementById('btn-annuler');
const formTitre = document.getElementById('form-titre');
const erreurs = document.getElementById('err-evenement');
const selectSport = document.getElementById('evt-sport');
const groupeDistance = document.getElementById('groupe-distance');
const champDistance = document.getElementById('evt-distance');
// Empêche de choisir une date passée dans le sélecteur
const champDate = document.getElementById('evt-date');
const aujourdhui = new Date().toISOString().split('T')[0]; // format YYYY-MM-DD
champDate.setAttribute('min', aujourdhui);

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
    const estProprietaire = evt.createurId === monId;
    const carte = document.createElement('div');
    carte.className = 'card';
    carte.innerHTML = `
      <h3>${evt.titre}</h3>
      <p>${evt.sport} — ${evt.lieu}</p>
      <p>${evt.date} — ${evt.places} places</p>
      ${estProprietaire ? `<button class="btn-modifier" data-id="${evt.id}">Modifier</button>` : ''}
      <button class="btn-supprimer" data-id="${evt.id}">Supprimer</button>
    `;
    liste.appendChild(carte);
  });
}

form.addEventListener('submit', (e) => {
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

  // ===== AJOUT : appel de la validation =====
  const erreur = validerFormulaire(data);
  if (erreur) {
    erreurs.textContent = erreur;
    return; // bloque la suite, rien n'est créé/modifié
  }
  erreurs.textContent = '';
  // ===========================================

    if (id) {
    const resultat = modifierEvenement(id, data);
    if (!resultat) {
      erreurs.textContent = 'Vous ne pouvez modifier que vos propres sessions.';
      return;
    }
  } else {
    creerEvenement(data);
  }

  form.reset();
  document.getElementById('evt-id').value = '';
  groupeDistance.classList.add('hidden');
  formTitre.textContent = 'Créer une session';
  btnAnnuler.classList.add('hidden');
  afficherEvenements();
});
liste.addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('btn-supprimer')) {
    supprimerEvenement(id);
    afficherEvenements();
  }

  if (e.target.classList.contains('btn-modifier')) {
    const evt = evenements.find(ev => ev.id === Number(id));
    if (!evt) return;
    if (evt.createurId !== monId) return;
    document.getElementById('evt-id').value = evt.id;
    document.getElementById('evt-titre').value = evt.titre;
    document.getElementById('evt-sport').value = evt.sport;
    document.getElementById('evt-lieu').value = evt.lieu;
    document.getElementById('evt-date').value = evt.date;
    document.getElementById('evt-places').value = evt.places;
    formTitre.textContent = 'Modifier la session';
    btnAnnuler.classList.remove('hidden');
      document.getElementById('evt-localisation').value = evt.localisation || '';
    document.getElementById('evt-joueurs-min').value = evt.joueursMin || 1;
    document.getElementById('evt-joueurs-max').value = evt.joueursMax || 10;
    document.getElementById('evt-niveau').value = evt.niveau || '';
    if (evt.sport === 'Running') {
      groupeDistance.classList.remove('hidden');
      champDistance.value = evt.distance || '';
    }
  }
});

btnAnnuler.addEventListener('click', () => {
  form.reset();
  document.getElementById('evt-id').value = '';
  formTitre.textContent = 'Créer une session';
  btnAnnuler.classList.add('hidden');
});

// Affichage initial
afficherEvenements();