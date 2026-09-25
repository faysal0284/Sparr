// events.js — gestion des événements/sessions sportives (backend simulé).
// Les données vivent dans un simple tableau JS ; aucune persistance réelle.

let evenements = [
  { id: 1, titre: "Footing du dimanche", sport: "Course", lieu: "Lyon", date: "2026-10-04", places: 3, participe: false },
  { id: 2, titre: "Match 5v5", sport: "Football", lieu: "Paris", date: "2026-10-02", places: 2, participe: false },
  { id: 3, titre: "Tournoi amical", sport: "Tennis", lieu: "Lyon", date: "2026-10-10", places: 4, participe: false },
  { id: 4, titre: "Sortie vélo côtière", sport: "Cyclisme", lieu: "Nice", date: "2026-10-06", places: 6, participe: false }
];

let prochainId = 5;


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
