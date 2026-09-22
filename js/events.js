import React, { useState } from 'react';

export default function CreateEventForm() {
  const [formData, setFormData] = useState({
    sport: '',
    minPlayers: 1,
    maxPlayers: 2,
    location: '',
    level: '',
    distance: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Données de l'événement créées :", formData);
    // Ici, appel à l'API (ex: Supabase) pour sauvegarder la session
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-900 rounded-lg shadow-xl text-white">
      <h2 className="text-2xl font-bold mb-6">Créer un événement sportif</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Menu de sélection du sport */}
        <div>
          <label className="block text-sm font-medium mb-1">Sport *</label>
          <select 
            name="sport" 
            value={formData.sport} 
            onChange={handleChange} 
            required
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>Sélectionnez un sport</option>
            <option value="Running">Running</option>
            <option value="padel">Padel</option>
            <option value="tennis">Tennis</option>
            <option value="five">Five</option>
            <option value="badminton">Badminton</option>
          </select>
        </div>

        {/* Champ conditionnel pour la distance si "Running" est sélectionné */}
        {formData.sport === 'Running' && (
          <div>
            <label className="block text-sm font-medium mb-1">Distance (km) *</label>
            <input 
              type="number" 
              name="distance" 
              value={formData.distance} 
              onChange={handleChange} 
              required 
              min="1"
              placeholder="Ex: 5"
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Nombre minimal et maximal de joueurs */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Joueurs Min *</label>
            <input 
              type="number" 
              name="minPlayers" 
              value={formData.minPlayers} 
              onChange={handleChange} 
              required 
              min="1"
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Joueurs Max *</label>
            <input 
              type="number" 
              name="maxPlayers" 
              value={formData.maxPlayers} 
              onChange={handleChange} 
              required 
              min={formData.minPlayers}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Localisation */}
        <div>
          <label className="block text-sm font-medium mb-1">Localisation *</label>
          <input 
            type="text" 
            name="location" 
            value={formData.location} 
            onChange={handleChange} 
            required 
            placeholder="Ex: Parc Saint-Pierre, Calais"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Niveau requis */}
        <div>
          <label className="block text-sm font-medium mb-1">Niveau requis *</label>
          <select 
            name="level" 
            value={formData.level} 
            onChange={handleChange} 
            required
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>Sélectionnez un niveau</option>
            <option value="Débutant">Débutant</option>
            <option value="Intermédiaire">Intermédiaire</option>
            <option value="Avancé">Avancé</option>
            <option value="Expert">Expert</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
        >
          Publier la session
        </button>
      </form>
    </div>
  );
}
