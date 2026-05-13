// ============================================
// ChatBot.jsx — Version Finale Complète
// ============================================

import { useState, useEffect, useRef } from "react";
import CVUploader from './CVUploader';
import CVGenerator from './CVGenerator';

import { BACKEND_URL } from '../services/api';

// Fonction pour enlever les astérisques markdown
const cleanText = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');
};

// ============================================
// ICÔNES SVG
// ============================================
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const CVIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
  </svg>
);

// ============================================
// APPEL API BACKEND
// ============================================
const callChatbot = async (messagesHistory, lang) => {
  const response = await fetch(`${BACKEND_URL}/api/chatbot/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messagesHistory, language: lang }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur ${response.status}`);
  }
  return await response.json();
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const ChatBot = () => {

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('fr');
  const [started, setStarted] = useState(false);
  const [showCVUploader, setShowCVUploader] = useState(false);
  const [showCVGenerator, setShowCVGenerator] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showCVUploader, showCVGenerator]);

  // ============================================
  // DÉMARRER L'ENTRETIEN
  // ============================================
  const startInterview = async (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setStarted(true);
    setIsLoading(true);
    setShowCVUploader(false);
    setShowCVGenerator(false);

    const firstMessage = [{
      role: 'user',
      content: selectedLanguage === 'fr'
        ? 'Bonjour, je souhaite commencer mon entretien.'
        : selectedLanguage === 'en'
        ? 'Hello, I would like to start my interview.'
        : 'مرحباً، أريد البدء في المقابلة.'
    }];

    try {
      const data = await callChatbot(firstMessage, selectedLanguage);
      setMessages([{
        role: 'assistant',
        content: data.message,
        isScore: data.isScore || false
      }]);
    } catch (error) {
      setMessages([{
        role: 'assistant',
        content: `❌ Erreur de connexion : ${error.message}`,
        isScore: false
      }]);
    }
    setIsLoading(false);
  };

  // ============================================
  // ENVOYER UN MESSAGE
  // ============================================
  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    setShowCVUploader(false);
    setShowCVGenerator(false);

    const userMessage = { role: 'user', content: inputText.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      const data = await callChatbot(apiMessages, language);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        isScore: data.isScore || false
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Erreur : ${error.message}`,
        isScore: false
      }]);
    }
    setIsLoading(false);
  };

  // ============================================
  // CALLBACK : Analyse CV terminée
  // ============================================
  const handleCVAnalysisComplete = (analysis, action) => {
    setShowCVUploader(false);

    let cvSummary = '';
    if (language === 'fr') {
      cvSummary = analysis.isGood
        ? `📄 Analyse CV terminée\n\n✅ Score : ${analysis.score}/100 — CV professionnel !\n\nPoints forts : ${analysis.pointsForts?.slice(0, 2).join(', ') || 'Bon profil'}\n\nContinuons votre entretien.`
        : `📄 Analyse CV terminée\n\n⚠️ Score : ${analysis.score}/100 — Des améliorations sont possibles.\n\nInformations manquantes : ${analysis.informationsManquantes?.slice(0, 2).join(', ') || 'Voir détails'}\n\nConseil : ${analysis.conseil || 'Complétez votre CV'}\n\n${action === 'improve' ? 'Je vais vous aider à améliorer votre CV.' : 'Continuons quand même.'}`;
    } else if (language === 'en') {
      cvSummary = analysis.isGood
        ? `📄 CV Analysis Complete\n\n✅ Score: ${analysis.score}/100 — Professional CV!\n\nStrengths: ${analysis.pointsForts?.slice(0, 2).join(', ') || 'Good profile'}\n\nLet's continue your interview.`
        : `📄 CV Analysis Complete\n\n⚠️ Score: ${analysis.score}/100 — Some improvements possible.\n\nMissing: ${analysis.informationsManquantes?.slice(0, 2).join(', ') || 'See details'}\n\nAdvice: ${analysis.conseil || 'Complete your CV'}`;
    } else {
      cvSummary = analysis.isGood
        ? `📄 اكتمل تحليل السيرة الذاتية\n\n✅ النتيجة: ${analysis.score}/100\n\nلنكمل المقابلة.`
        : `📄 اكتمل تحليل السيرة الذاتية\n\n⚠️ النتيجة: ${analysis.score}/100\n\nنصيحة: ${analysis.conseil || 'أكمل سيرتك الذاتية'}`;
    }

    const updatedMessages = [...messages, {
      role: 'assistant',
      content: cvSummary,
      isScore: false,
      isCVResult: true
    }];
    setMessages(updatedMessages);

    if (action === 'improve') {
      setTimeout(async () => {
        setIsLoading(true);
        try {
          const improveMsg = `Le candidat a uploadé son CV. Score : ${analysis.score}/100. Informations manquantes : ${analysis.informationsManquantes?.join(', ')}. Aide-le à améliorer son CV.`;
          const apiMessages = [
            ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: improveMsg }
          ];
          const data = await callChatbot(apiMessages, language);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.message,
            isScore: false
          }]);
        } catch (err) {
          console.error('❌ Erreur improve CV:', err);
        }
        setIsLoading(false);
      }, 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setMessages([]);
    setInputText('');
    setLanguage('fr');
    setShowCVUploader(false);
    setShowCVGenerator(false);
  };

  // ============================================
  // PAGE SÉLECTION LANGUE
  // ============================================
  if (!started) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-700">

          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BotIcon />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Recrutement International IA
          </h1>
          <p className="text-slate-400 mb-2">
            Choisissez votre langue pour commencer l'entretien
          </p>
          <p className="text-slate-500 text-xs mb-8">
            🤖 Entretien simulé • Analyse CV • Génération CV PDF • Score automatique
          </p>

          <div className="space-y-3">
            <button onClick={() => startInterview('fr')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all text-lg">
              🇫🇷 Continuer en Français
            </button>
            <button onClick={() => startInterview('en')}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-4 px-6 rounded-xl transition-all text-lg">
              🇬🇧 Continue in English
            </button>
            <button onClick={() => startInterview('ar')}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-4 px-6 rounded-xl transition-all text-lg">
              🇸🇦 المتابعة بالعربية
            </button>
          </div>

          <p className="text-slate-500 text-xs mt-6">
            Propulsé par Groq AI (Llama 3.3) • 100% Gratuit
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // INTERFACE CHATBOT PRINCIPALE
  // ============================================
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">

      {/* HEADER */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <BotIcon />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm sm:text-base">
              Sarah — IA Recrutement
            </h1>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs">En ligne</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Analyser CV */}
          <button
            onClick={() => { setShowCVUploader(!showCVUploader); setShowCVGenerator(false); }}
            className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all ${
              showCVUploader ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}>
            <CVIcon />
            <span className="hidden sm:inline ml-1">Analyser CV</span>
          </button>

          {/* Bouton Générer CV */}
          <button
            onClick={() => { setShowCVGenerator(!showCVGenerator); setShowCVUploader(false); }}
            className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all ${
              showCVGenerator ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}>
            ✨ <span className="hidden sm:inline">Générer CV</span>
          </button>

          {/* Bouton Recommencer */}
          <button onClick={handleRestart}
            className="text-slate-400 hover:text-white text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-all">
            🔄
          </button>
        </div>
      </div>

      {/* CV UPLOADER */}
      {showCVUploader && (
        <div className="bg-slate-900 border-b border-slate-700 p-4 overflow-y-auto max-h-[70vh]">
          <CVUploader language={language} onAnalysisComplete={handleCVAnalysisComplete} />
        </div>
      )}

      {/* CV GENERATOR */}
      {showCVGenerator && (
        <div className="bg-slate-900 border-b border-slate-700 p-4 overflow-y-auto max-h-[70vh]">
          <CVGenerator messages={messages} language={language} />
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index}
            className={`flex gap-3 message-animation ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-600'}`}>
              {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
            </div>

            <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : msg.isScore
                  ? 'bg-slate-700 text-white border-2 border-blue-500 rounded-tl-none'
                  : msg.isCVResult
                    ? 'bg-slate-700 text-white border border-green-500 rounded-tl-none'
                    : 'bg-slate-700 text-slate-100 rounded-tl-none'
            }`}>
              {/* Texte sans astérisques markdown */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {cleanText(msg.content)}
              </p>
            </div>
          </div>
        ))}

        {/* Animation chargement */}
        {isLoading && (
          <div className="flex gap-3 message-animation">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
              <BotIcon />
            </div>
            <div className="bg-slate-700 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ZONE SAISIE */}
      <div className="bg-slate-800 border-t border-slate-700 p-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              language === 'fr' ? 'Écrivez votre réponse...' :
              language === 'en' ? 'Write your answer...' : 'اكتب إجابتك...'
            }
            rows={1}
            className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 resize-none outline-none border border-slate-600 focus:border-blue-500 transition-all text-sm"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button onClick={handleSend} disabled={!inputText.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all">
            <SendIcon />
          </button>
        </div>
        <p className="text-slate-500 text-xs text-center mt-2">
          {language === 'fr' && 'Entrée pour envoyer • Shift+Entrée pour nouvelle ligne'}
          {language === 'en' && 'Enter to send • Shift+Enter for new line'}
          {language === 'ar' && 'Enter للإرسال • Shift+Enter لسطر جديد'}
        </p>
      </div>
    </div>
  );
};

export default ChatBot;