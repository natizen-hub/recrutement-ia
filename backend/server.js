// ============================================
// server.js — Point d'entrée du backend
// Chatbot IA de Recrutement International
// ============================================

// --- Importation des bibliothèques ---
const express = require('express');   // Framework web Node.js
const cors = require('cors');         // Permet au frontend React de communiquer avec ce serveur
const dotenv = require('dotenv');     // Charge les variables secrètes depuis .env

// --- Chargement des variables d'environnement (.env) ---
// Doit être appelé AVANT tout le reste
dotenv.config();

// --- Création de l'application Express ---
const app = express();

// --- Middlewares globaux ---
// cors() : autorise les requêtes venant du frontend (localhost:5173)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// express.json() : permet de lire le corps des requêtes en format JSON
app.use(express.json());

// express.urlencoded : permet de lire les formulaires HTML
app.use(express.urlencoded({ extended: true }));

// --- Importation des routes ---
// Chaque route gère une fonctionnalité précise
const chatbotRoutes = require('./routes/chatbot'); // Route du chatbot IA
const cvRoutes = require('./routes/cv');           // Route analyse + génération CV

// --- Connexion des routes au serveur ---
// Toutes les requêtes vers /api/chatbot → fichier routes/chatbot.js
app.use('/api/chatbot', chatbotRoutes);

// Toutes les requêtes vers /api/cv → fichier routes/cv.js
app.use('/api/cv', cvRoutes);

// --- Route de test (pour vérifier que le serveur fonctionne) ---
// Accessible sur : http://localhost:5000/
app.get('/', (req, res) => {
  res.json({
    message: '🤖 Chatbot Recrutement IA — Backend actif',
    version: '1.0.0',
    status: 'running',
    routes: [
      'POST /api/chatbot/message',
      'POST /api/cv/analyze',
      'POST /api/cv/generate'
    ]
  });
});

// --- Gestion des routes inexistantes (404) ---
app.use((req, res) => {
  res.status(404).json({
    error: 'Route introuvable',
    message: `La route ${req.originalUrl} n'existe pas`
  });
});

// --- Gestion globale des erreurs serveur ---
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.message);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: err.message
  });
});

// --- Démarrage du serveur ---
// Le port vient du fichier .env, sinon 5000 par défaut
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('================================');
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 URL : http://localhost:${PORT}`);
  console.log(`🤖 Chatbot IA prêt à recevoir des messages`);
  console.log('================================');
});