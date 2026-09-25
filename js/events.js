// events.js — gestion des événements/sessions sportives (backend simulé).
// Les données vivent dans un simple tableau JS ; aucune persistance réelle.

let evenements = [
  { id: 1, titre: "Footing du dimanche", sport: "Course", lieu: "Lyon", date: "2026-10-04", places: 3, participe: false },
  { id: 2, titre: "Match 5v5", sport: "Football", lieu: "Paris", date: "2026-10-02", places: 2, participe: false },
  { id: 3, titre: "Tournoi amical", sport: "Tennis", lieu: "Lyon", date: "2026-10-10", places: 4, participe: false },
  { id: 4, titre: "Sortie vélo côtière", sport: "Cyclisme", lieu: "Nice", date: "2026-10-06", places: 6, participe: false }
];

let prochainId = 5;

// Recherche géolocalisée simulée : filtre par ville. Un rayon "100" = partout.
function rechercherEvenements(ville, rayon) {
  const v = (ville || "").trim().toLowerCase();
  return evenements.filter(e => {
    if (Number(rayon) >= 100) return true;      // "Partout"
    if (!v) return true;                          // pas de ville => tout afficher
    return e.lieu.toLowerCase().includes(v);      // proximité simulée par ville
  });
}

// Crée un nouvel événement et le renvoie.
function creerEvenement(data) {
  const evt = {
    id: prochainId++,
    titre: data.titre.trim(),
    sport: data.sport,
    lieu: data.lieu.trim(),
    date: data.date,
    places: Number(data.places),
    participe: false
  };
  evenements.push(evt);
  return evt;
}

// Modifie un événement existant (par id).
function modifierEvenement(id, data) {
  const evt = evenements.find(e => e.id === Number(id));
  if (!evt) return null;
  Object.assign(evt, {
    titre: data.titre.trim(),
    sport: data.sport,
    lieu: data.lieu.trim(),
    date: data.date,
    places: Number(data.places)
  });
  return evt;
}

// Supprime un événement (par id).
function supprimerEvenement(id) {
  evenements = evenements.filter(e => e.id !== Number(id));
}

// (Dé)inscrit l'utilisateur : décrémente/incrémente les places disponibles.
function participer(id) {
  const evt = evenements.find(e => e.id === Number(id));
  if (!evt) return null;
  if (evt.participe) {
    evt.participe = false;
    evt.places++;
  } else if (evt.places > 0) {
    evt.participe = true;
    evt.places--;
  }
  return evt;
}

/*
  ============================================================================
  FICHIER : js/events.js
  RÔLE    : Simuler le "backend" des sessions sportives via un tableau en mémoire.
  CONTENU :
    - evenements[] : jeu de données statique servant de base de démonstration.
    - rechercherEvenements(ville, rayon) : filtre "géolocalisé" simplifié (par
      ville, avec l'option "Partout" quand le rayon vaut 100).
    - creerEvenement / modifierEvenement / supprimerEvenement : opérations CRUD
      sur le tableau, chacune renvoyant l'événement concerné.
    - participer(id) : bascule l'inscription de l'utilisateur et ajuste le nombre
      de places disponibles.
    - Ces fonctions ne manipulent PAS le DOM : c'est js/app.js qui appelle ces
      fonctions puis rafraîchit l'affichage. Séparation nette logique / rendu.
  PLACE DANS LE PROJET : couche "données" utilisée par app.js après validation.
  ============================================================================
*/
