

// app.js — logique d'affichage et interactions

const liste = document.getElementById('liste-evenements');
const form = document.getElementById('form-evenement');
const btnAnnuler = document.getElementById('btn-annuler');
const formTitre = document.getElementById('form-titre');
const erreurs = document.getElementById('err-evenement');

function afficherEvenements() {
  liste.innerHTML = '';
  evenements.forEach(evt => {
    const carte = document.createElement('div');
    carte.className = 'card';
    carte.innerHTML = `
      <h3>${evt.titre}</h3>
      <p>${evt.sport} — ${evt.lieu}</p>
      <p>${evt.date} — ${evt.places} places</p>
      <button class="btn-modifier" data-id="${evt.id}">Modifier</button>
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
    date: document.getElementById('evt-date').value,
    places: document.getElementById('evt-places').value
  };

  if (id) {
    modifierEvenement(id, data);
  } else {
    creerEvenement(data);
  }

  form.reset();
  document.getElementById('evt-id').value = '';
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
    document.getElementById('evt-id').value = evt.id;
    document.getElementById('evt-titre').value = evt.titre;
    document.getElementById('evt-sport').value = evt.sport;
    document.getElementById('evt-lieu').value = evt.lieu;
    document.getElementById('evt-date').value = evt.date;
    document.getElementById('evt-places').value = evt.places;
    formTitre.textContent = 'Modifier la session';
    btnAnnuler.classList.remove('hidden');
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