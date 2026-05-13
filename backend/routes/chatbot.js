// ============================================
// routes/chatbot.js — Cerveau du Chatbot IA
// ============================================

const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Initialisation Groq avec la clé depuis .env
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const AI_MODEL = 'llama-3.3-70b-versatile';

// ============================================
// PROMPT SYSTÈME selon la langue
// ============================================
const getSystemPrompt = (language = 'fr') => {
  const prompts = {
    fr: `Tu es Sarah, une assistante experte en recrutement international pour une agence professionnelle.
    
Ton rôle :
- Accueillir chaleureusement les candidats
- Poser des questions intelligentes sur leur profil
- Faire un entretien simulé professionnel
- Analyser leurs compétences et expériences
- Donner des conseils professionnels
- À la fin de l'entretien, donner un score détaillé

Règles importantes :
- Pose UNE seule question à la fois
- Attends la réponse avant de poser la suivante
- Sois professionnelle mais sympathique

Étapes de l'entretien :
1. Accueil et présentation
2. Informations personnelles (nom, âge, pays)
3. Spécialité et niveau d'études
4. Expérience professionnelle
5. Langues parlées
6. Compétences techniques
7. Motivation et objectif
8. Questions comportementales
9. Score final et résultat

Pour le score final, utilise ce format EXACT :
📊 SCORE FINAL
- Communication : X/20
- Niveau de langue : X/20
- Compétences techniques : X/20
- Expérience : X/20
- Motivation : X/20
- Score global : X/100
- Résultat : [ACCEPTÉ ✅ / MOYEN ⚠️ / REFUSÉ ❌]`,

    en: `You are Sarah, an expert international recruitment assistant.

Your role:
- Warmly welcome candidates
- Ask intelligent questions about their profile
- Conduct a professional simulated interview
- At the end, give a detailed score

Rules:
- Ask ONE question at a time
- Be professional but friendly

Interview steps:
1. Welcome
2. Personal info (name, age, country)
3. Specialty and education
4. Experience
5. Languages
6. Technical skills
7. Motivation
8. Behavioral questions
9. Final score

Final score format:
📊 FINAL SCORE
- Communication: X/20
- Language level: X/20
- Technical skills: X/20
- Experience: X/20
- Motivation: X/20
- Global score: X/100
- Result: [ACCEPTED ✅ / AVERAGE ⚠️ / REJECTED ❌]`,

    ar: `أنت سارة، مساعدة خبيرة في التوظيف الدولي.

دورك:
- استقبال المرشحين بحرارة
- طرح أسئلة ذكية
- إجراء مقابلة احترافية
- إعطاء نتيجة في النهاية

قواعد: اطرح سؤالاً واحداً فقط في كل مرة

خطوات المقابلة:
1. الترحيب
2. المعلومات الشخصية
3. التخصص والمستوى
4. الخبرة
5. اللغات
6. المهارات
7. الدوافع
8. أسئلة سلوكية
9. النتيجة النهائية`
  };

  return prompts[language] || prompts['fr'];
};

// ============================================
// ROUTE PRINCIPALE : POST /api/chatbot/message
// ============================================
router.post('/message', async (req, res) => {

  console.log('📨 Body reçu:', JSON.stringify(req.body));

  // Récupération des données
  const messages = req.body.messages;
  const language = req.body.language || 'fr';

  console.log('📝 Messages reçus:', messages);
  console.log('🌍 Langue:', language);

  // --- Validation ---
  if (!messages) {
    return res.status(400).json({
      error: 'Données manquantes',
      message: 'Le champ messages est requis'
    });
  }

  if (!Array.isArray(messages)) {
    return res.status(400).json({
      error: 'Format invalide',
      message: 'messages doit être un tableau'
    });
  }

  if (messages.length === 0) {
    return res.status(400).json({
      error: 'Messages vides',
      message: 'Le tableau messages ne peut pas être vide'
    });
  }

  try {
    // Appel à Groq API
    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(language)
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices[0].message.content;

    // Détecter si c'est le score final
    const isScoreMessage = aiResponse.includes('SCORE FINAL') ||
                           aiResponse.includes('FINAL SCORE') ||
                           aiResponse.includes('Score global') ||
                           aiResponse.includes('النتيجة النهائية');

    console.log('✅ Réponse IA générée avec succès');

    res.json({
      success: true,
      message: aiResponse,
      isScore: isScoreMessage,
      model: AI_MODEL
    });

  } catch (error) {
    console.error('❌ Erreur Groq:', error);

    if (error.status === 401) {
      return res.status(401).json({
        error: 'Clé API invalide',
        message: 'Vérifiez GROQ_API_KEY dans .env'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Limite dépassée',
        message: 'Attendez quelques secondes'
      });
    }

    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

// ============================================
// ROUTE TEST
// ============================================
router.get('/test', (req, res) => {
  res.json({
    message: '✅ Route chatbot active',
    model: AI_MODEL,
    languages: ['fr', 'en', 'ar'],
    groq_configured: !!process.env.GROQ_API_KEY
  });
});

module.exports = router;