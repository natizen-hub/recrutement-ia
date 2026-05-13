// Route CV — sera complétée à l'étape suivante
const express = require('express');
const router = express.Router();

// Test temporaire
router.get('/test', (req, res) => {
  res.json({ message: '✅ Route CV active' });
});

module.exports = router;