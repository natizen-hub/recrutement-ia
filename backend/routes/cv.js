// ============================================
// routes/cv.js — Analyse + Génération CV
// ============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const AI_MODEL = 'llama-3.3-70b-versatile';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('PDF uniquement'));
  }
});

// ============================================
// Extraire texte du PDF
// ============================================
async function extractTextFromPDF(buffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText;
}

// ============================================
// ROUTE : POST /api/cv/analyze
// ============================================
router.post('/analyze', upload.single('cv'), async (req, res) => {

  console.log('📄 Fichier reçu:', req.file?.originalname);

  if (!req.file) {
    return res.status(400).json({ error: 'Fichier manquant', message: 'Envoyez un PDF' });
  }

  try {
    let cvText = '';
    try {
      cvText = await extractTextFromPDF(req.file.buffer);
      console.log('✅ Texte extrait:', cvText.length, 'caractères');
    } catch (pdfErr) {
      console.error('❌ Erreur PDF:', pdfErr.message);
      cvText = 'Contenu non extractible';
    }

    const language = req.body.language || 'fr';

    const prompt = `Tu es un expert RH. Analyse ce CV et réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans balises markdown.

CV :
${cvText.substring(0, 3000)}

Réponds avec exactement ce JSON :
{
  "isGood": true,
  "score": 75,
  "nom": "nom ou null",
  "prenom": "prénom ou null",
  "specialite": "spécialité",
  "niveau": "niveau études",
  "experience": "expérience",
  "langues": ["français", "anglais"],
  "competences": ["compétence1", "compétence2"],
  "pointsForts": ["point fort 1", "point fort 2"],
  "pointsFaibles": ["point faible 1"],
  "informationsManquantes": ["info manquante"],
  "conseil": "conseil principal"
}`;

    console.log('🤖 Analyse IA en cours...');

    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
    });

    let responseText = completion.choices[0].message.content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      analysis = {
        isGood: false,
        score: 50,
        specialite: 'Non détectée',
        niveau: 'Non détecté',
        experience: 'Non détectée',
        langues: [],
        competences: [],
        pointsForts: ['CV reçu'],
        pointsFaibles: ['Analyse partielle'],
        informationsManquantes: [],
        conseil: 'Assurez-vous que votre PDF contient du texte sélectionnable'
      };
    }

    console.log('✅ Analyse terminée, score:', analysis.score);
    res.json({ success: true, analysis });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// ============================================
// ROUTE : POST /api/cv/generate
// ============================================
router.post('/generate', async (req, res) => {

  console.log('📝 Génération CV demandée...');

  const { candidateInfo, language } = req.body;

  if (!candidateInfo) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  try {
    const prompt = `Tu es un expert RH. À partir de cette conversation d'entretien, génère un CV professionnel en JSON uniquement, sans markdown, sans texte avant ou après.

Conversation : ${JSON.stringify(candidateInfo).substring(0, 2000)}

Réponds avec exactement ce JSON :
{
  "nom": "nom complet détecté",
  "titre": "titre professionnel",
  "email": "N/A",
  "telephone": "N/A",
  "pays": "pays détecté",
  "profil": "résumé professionnel 2-3 phrases",
  "experience": [{"poste": "poste", "entreprise": "entreprise", "duree": "durée", "description": "description"}],
  "formation": [{"diplome": "diplôme", "etablissement": "établissement", "annee": "année"}],
  "competences": ["compétence1", "compétence2", "compétence3"],
  "langues": ["langue1", "langue2"],
  "qualites": ["qualité1", "qualité2", "qualité3"]
}`;

    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    let responseText = completion.choices[0].message.content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    let cvData;
    try {
      cvData = JSON.parse(responseText);
    } catch {
      return res.status(500).json({ error: 'Erreur parsing JSON' });
    }

    console.log('✅ CV généré pour:', cvData.nom);
    res.json({ success: true, cvData });

  } catch (error) {
    console.error('❌ Erreur génération CV:', error.message);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// ============================================
// ROUTE TEST
// ============================================
router.get('/test', (req, res) => {
  res.json({ message: '✅ Route CV active', maxSize: '5MB', formats: ['PDF'] });
});

module.exports = router;