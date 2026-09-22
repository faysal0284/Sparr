# Sparr
Application de mise en relation de sportifs entre eux selon leurs sports, leurs niveaux et leurs localisation géographique.


Un réseau social géolocalisé dédié aux sportifs. L'application permet aux athlètes amateurs et professionnels de trouver des partenaires d'entraînement pertinents, de créer des communautés locales et d'organiser des sessions sportives grâce à un système de mise en relation par niveau.

## 🚀 Fonctionnalités Principales

*   **Profils Sportifs :** Gestion des sports pratiqués, du niveau (débutant à expert).
*   **Moteur de Recherche Géolocalisé :** Recherche d'evenement à proximité.
*   **Communautés & Groupes :** Création de sous-groupes par sport et par localisation géographque avec fils de discussion dédiés.
*   **Création d'evenement :** Création d'événements sportifs par sport et par localisation géographque.
*   **Suppresion d'evenement :** Suppresion d'événements sportifs par sport et par localisation géographque.
*   **Modification d'evenement :** Modification d'événements sportifs par sport et par localisation géographque.
*   **Organisation de Sessions :** Planification d'événements sportifs avec système de participation.
*   **Réputation & Avis :** Évaluation post-session (ponctualité, fair-play, niveau confirmé) pour bâtir un réseau de confiance.
*   **Messagerie en Temps Réel :** Chat individuel et de groupe pour coordonner les rencontres.

## 🛠️ Stack Technique

Ce projet utilise une architecture Full-Stack JavaScript couplée à un Backend-as-a-Service (BaaS) pour une gestion optimale de la base de données relationnelle et des requêtes géospatiales.

*   **Frontend :** React (via Vite), HTML, CSS, JavaScript
*   **Encapsulation Mobile :** Capacitor / Ionic (prêt pour un déploiement cross-platform iOS/Android)
*   **Backend & Base de données :** Supabase (PostgreSQL)
*   **Géolocalisation :** Extension PostGIS (PostgreSQL) pour le calcul précis des distances.

## ⚙️ Installation et Configuration Locale

### Prérequis
*   [Node.js](https://nodejs.org/) (version 18 ou supérieure)
*   Un compte [Supabase](https://supabase.com/) avec un projet configuré.

### Étapes d'installation

1. **Cloner le dépôt**
   ```bash
   git clone [https://github.com/votre-nom-d-utilisateur/sportsync.git](https://github.com/votre-nom-d-utilisateur/sportsync.git)
   cd sportsync
