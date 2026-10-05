// events.js — gestion des événements/sessions sportives (backend simulé).
// Les données vivent dans un simple tableau JS ; aucune persistance réelle.

let evenements = [
  { id: 1, titre: "Footing du dimanche", sport: "Course", lieu: "Lyon", date: "2026-10-04", places: 3, participe: false, createurId: genererId() },
  { id: 2, titre: "Match 5v5", sport: "Football", lieu: "Paris", date: "2026-10-02", places: 2, participe: false, createurId: genererId() },
  { id: 3, titre: "Tournoi amical", sport: "Tennis", lieu: "Lyon", date: "2026-10-10", places: 4, participe: false, createurId: genererId() },
  { id: 4, titre: "Sortie vélo côtière", sport: "Cyclisme", lieu: "Nice", date: "2026-10-06", places: 6, participe: false, createurId: genererId() }
];

let prochainId = 5;
// Identifiant utilisateur simulé (pas une vraie authentification)
function genererId() {
  return 'user-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function obtenirMonId() {
  let id = localStorage.getItem('sparr_user_id');
  if (!id) {
    id = genererId();
    localStorage.setItem('sparr_user_id', id);
  }
  return id;
}

const monId = obtenirMonId();

function creerEvenement(data) {
  const evt = {
    id: prochainId++,
    titre: data.titre.trim(),
    sport: data.sport,
    lieu: data.lieu.trim(),
    localisation: data.localisation.trim(),
    date: data.date,
    places: Number(data.places),
    joueursMin: Number(data.joueursMin),
    joueursMax: Number(data.joueursMax),
    niveau: data.niveau,
    distance: data.distance ? Number(data.distance) : null,
    participe: false,
    createurId: monId
  };
  evenements.push(evt);
  return evt;
}

function modifierEvenement(id, data) {
    const evt = evenements.find(e => e.id === Number(id));
    if (!evt) return null;
    if (evt.createurId !== monId) return null; // pas le propriétaire
  Object.assign(evt, {
    titre: data.titre.trim(),
    sport: data.sport,
    lieu: data.lieu.trim(),
    localisation: data.localisation.trim(),
    date: data.date,
    places: Number(data.places),
    joueursMin: Number(data.joueursMin),
    joueursMax: Number(data.joueursMax),
    niveau: data.niveau,
    distance: data.distance ? Number(data.distance) : null
  });
  return evt;
}
// Supprime un événement existant (par id).
// Supprime un événement existant (par id), uniquement si on en est le créateur.
function supprimerEvenement(id) {
  const index = evenements.findIndex(e => e.id === Number(id));
  if (index === -1) return false;
  if (evenements[index].createurId !== monId) return false;
  evenements.splice(index, 1);
  return true;
}