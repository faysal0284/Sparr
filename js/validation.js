function validerFormulaire(data) {
  if (!data.titre || data.titre.trim() === '') {
    return 'Le titre est obligatoire.';
  }
  if (!data.sport) {
    return 'Le sport est obligatoire.';
  }

  // ===== Validation de la date =====
  if (!data.date) {
    return 'La date est obligatoire.';
  }
  const dateChoisie = new Date(data.date);
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0); // on ignore l'heure, on compare juste les jours

  if (dateChoisie < aujourdhui) {
    return 'La date ne peut pas être dans le passé.';
  }

  if (!data.joueursMin || !data.joueursMax) {
    return 'Joueurs Min et Max sont obligatoires.';
  }
  if (Number(data.joueursMin) > Number(data.joueursMax)) {
    return 'Joueurs Min ne peut pas dépasser Joueurs Max.';
  }
  if (!data.localisation || data.localisation.trim() === '') {
    return 'La localisation est obligatoire.';
  }
  if (!data.niveau) {
    return 'Le niveau requis est obligatoire.';
  }
  if (data.sport === 'Running' && !data.distance) {
    return 'La distance est obligatoire pour une session Running.';
  }
  return null;
}

// ===== Validation de l'authentification =====
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validerConnexion(data) {
  if (!data.email || data.email.trim() === '') {
    return "L'email est obligatoire.";
  }
  if (!data.motDePasse) {
    return 'Le mot de passe est obligatoire.';
  }
  return null;
}

function validerInscription(data) {
  const pseudo = (data.pseudo || '').trim();
  if (pseudo.length < 2 || pseudo.length > 30) {
    return 'Le pseudo doit contenir entre 2 et 30 caractères.';
  }
  if (!REGEX_EMAIL.test((data.email || '').trim())) {
    return 'Adresse email invalide.';
  }
  if (!data.motDePasse || data.motDePasse.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères.';
  }
  if (data.motDePasse !== data.confirmation) {
    return 'Les mots de passe ne correspondent pas.';
  }
  return null;
}