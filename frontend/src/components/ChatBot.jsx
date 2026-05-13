// ============================================
// ChatBot.jsx — Composant Principal du Chatbot
// ============================================

import { useState, useEffect, useRef } from "react";

// URL directe du backend
const BACKEND_URL = 'http://localhost:5000';

// --- Icônes SVG ---
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

// ============================================
// FONCTION CENTRALE : Appel API Backend
// Reçoit l'historique et la langue
// Retourne la réponse de l'IA
// ============================================
const callChatbot = async (messagesHistory, lang) => {
  console.log('📤 Envoi au backend:', { messagesHistory, lang });

  const response = await fetch(`${BACKEND_URL}/api/chatbot/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messagesHistory,  // tableau de {role, content}
      language: lang              // 'fr', 'en', ou 'ar'
    }),
  });

  console.log('📥 Status réponse:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Réponse IA:', data);
  return data;
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
  const messagesEndRef = useRef(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============================================
  // DÉMARRER L'ENTRETIEN
  // ============================================
  const startInterview = async (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setStarted(true);
    setIsLoading(true);

    // Message initial pour lancer la conversation
    const firstMessage = [
      {
        role: 'user',
        content: selectedLanguage === 'fr'
          ? 'Bonjour, je souhaite commencer mon entretien.'
          : selectedLanguage === 'en'
          ? 'Hello, I would like to start my interview.'
          : 'مرحباً، أريد البدء في المقابلة.'
      }
    ];

    try {
      const data = await callChatbot(firstMessage, selectedLanguage);

      setMessages([{
        role: 'assistant',
        content: data.message,
        isScore: data.isScore || false
      }]);

    } catch (error) {
      console.error('❌ Erreur startInterview:', error.message);
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

    const userMessage = {
      role: 'user',
      content: inputText.trim()
    };

    // Ajouter le message utilisateur à l'affichage
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Préparer l'historique complet pour l'API
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
      console.error('❌ Erreur handleSend:', error.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Erreur : ${error.message}`,
        isScore: false
      }]);
    }

    setIsLoading(false);
  };

  // Envoyer avec Entrée
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Recommencer l'entretien
  const handleRestart = () => {
    setStarted(false);
    setMessages([]);
    setInputText('');
    setLanguage('fr');
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
          <p className="text-slate-400 mb-8">
            Choisissez votre langue pour commencer l'entretien
          </p>

          <div className="space-y-3">
            <button
              onClick={() => startInterview('fr')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              🇫🇷 Continuer en Français
            </button>
            <button
              onClick={() => startInterview('en')}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              🇬🇧 Continue in English
            </button>
            <button
              onClick={() => startInterview('ar')}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              🇸🇦 المتابعة بالعربية
            </button>
          </div>

          <p className="text-slate-500 text-sm mt-6">
            🤖 Propulsé par Groq AI (Llama 3.3) • Gratuit
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
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <BotIcon />
          </div>
          <div>
            <h1 className="text-white font-semibold">Sarah — IA Recrutement</h1>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400 text-xs">En ligne</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleRestart}
          className="text-slate-400 hover:text-white text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg transition-all"
        >
          🔄 Recommencer
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 message-animation ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-600'
            }`}>
              {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
            </div>

            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : msg.isScore
                  ? 'bg-slate-700 text-white border border-blue-500 rounded-tl-none'
                  : 'bg-slate-700 text-slate-100 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {/* Animation chargement */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
              <BotIcon />
            </div>
            <div className="bg-slate-700 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1 items-center">
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
            placeholder="Écrivez votre réponse..."
            rows={1}
            className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 resize-none outline-none border border-slate-600 focus:border-blue-500 transition-all text-sm"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
          >
            <SendIcon />
          </button>
        </div>
        <p className="text-slate-500 text-xs text-center mt-2">
          Entrée pour envoyer • Shift+Entrée pour nouvelle ligne
        </p>
      </div>
    </div>
  );
};

export default ChatBot;