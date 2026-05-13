// ============================================
// ChatBot.jsx — Version Finale Pro
// Theme moderne, CV panels en bas
// ============================================

import { useState, useEffect, useRef } from "react";
import CVUploader from './CVUploader';
import CVGenerator from './CVGenerator';
import { BACKEND_URL } from '../services/api';

// Nettoyer les astérisques markdown
const cleanText = (text) => text
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/\*(.*?)\*/g, '$1');

// ============================================
// ICÔNES SVG
// ============================================
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const BotIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ============================================
// APPEL API
// ============================================
const callChatbot = async (messagesHistory, lang) => {
  const response = await fetch(`${BACKEND_URL}/api/chatbot/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messagesHistory, language: lang }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || `Erreur ${response.status}`);
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
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showCVUploader, showCVGenerator]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  // ============================================
  // DÉMARRER L'ENTRETIEN
  // ============================================
  const startInterview = async (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setStarted(true);
    setIsLoading(true);

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
      setMessages([{ role: 'assistant', content: data.message, isScore: data.isScore || false }]);
    } catch (error) {
      setMessages([{ role: 'assistant', content: `❌ Erreur : ${error.message}`, isScore: false }]);
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
      const data = await callChatbot(
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        language
      );
      setMessages(prev => [...prev, {
        role: 'assistant', content: data.message, isScore: data.isScore || false
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant', content: `❌ Erreur : ${error.message}`, isScore: false
      }]);
    }
    setIsLoading(false);
  };

  // ============================================
  // CALLBACK ANALYSE CV
  // ============================================
  const handleCVAnalysisComplete = (analysis, action) => {
    setShowCVUploader(false);
    let cvSummary = '';
    if (language === 'fr') {
      cvSummary = analysis.isGood
        ? `📄 Analyse CV terminée\n\n✅ Score : ${analysis.score}/100 — CV professionnel !\n\nPoints forts : ${analysis.pointsForts?.slice(0, 2).join(', ') || 'Bon profil'}\n\nContinuons votre entretien.`
        : `📄 Analyse CV terminée\n\n⚠️ Score : ${analysis.score}/100 — Des améliorations sont possibles.\n\nInformations manquantes : ${analysis.informationsManquantes?.slice(0, 2).join(', ') || 'Voir détails'}\n\nConseil : ${analysis.conseil || 'Complétez votre CV'}`;
    } else if (language === 'en') {
      cvSummary = analysis.isGood
        ? `📄 CV Analysis Complete\n\n✅ Score: ${analysis.score}/100 — Professional CV!\n\nStrengths: ${analysis.pointsForts?.slice(0, 2).join(', ') || 'Good profile'}\n\nLet's continue.`
        : `📄 CV Analysis Complete\n\n⚠️ Score: ${analysis.score}/100 — Some improvements possible.\n\nAdvice: ${analysis.conseil || 'Complete your CV'}`;
    } else {
      cvSummary = `📄 اكتمل تحليل السيرة الذاتية\n\n${analysis.isGood ? '✅' : '⚠️'} النتيجة: ${analysis.score}/100`;
    }

    const updatedMessages = [...messages, { role: 'assistant', content: cvSummary, isScore: false, isCVResult: true }];
    setMessages(updatedMessages);

    if (action === 'improve') {
      setTimeout(async () => {
        setIsLoading(true);
        try {
          const improveMsg = `Le candidat a uploadé son CV. Score : ${analysis.score}/100. Informations manquantes : ${analysis.informationsManquantes?.join(', ')}. Aide-le à améliorer son CV.`;
          const data = await callChatbot(
            [...updatedMessages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: improveMsg }],
            language
          );
          setMessages(prev => [...prev, { role: 'assistant', content: data.message, isScore: false }]);
        } catch {}
        setIsLoading(false);
      }, 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleRestart = () => {
    setStarted(false); setMessages([]); setInputText('');
    setLanguage('fr'); setShowCVUploader(false); setShowCVGenerator(false);
  };

  // ============================================
  // PAGE SÉLECTION LANGUE
  // ============================================
  if (!started) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #080c14; }
          .lang-page {
            min-height: 100vh;
            background: #080c14;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            font-family: 'DM Sans', sans-serif;
            position: relative;
            overflow: hidden;
          }
          .lang-page::before {
            content: '';
            position: absolute;
            width: 600px; height: 600px;
            background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
            top: -100px; left: 50%; transform: translateX(-50%);
            pointer-events: none;
          }
          .lang-page::after {
            content: '';
            position: absolute;
            width: 400px; height: 400px;
            background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
            bottom: -50px; right: -50px;
            pointer-events: none;
          }
          .lang-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 24px;
            padding: 48px 40px;
            max-width: 440px;
            width: 100%;
            text-align: center;
            backdrop-filter: blur(20px);
            position: relative;
            z-index: 1;
          }
          .logo-ring {
            width: 72px; height: 72px;
            margin: 0 auto 28px;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 32px rgba(59,130,246,0.35);
          }
          .brand-title {
            font-family: 'Syne', sans-serif;
            font-size: 22px;
            font-weight: 700;
            color: #fff;
            letter-spacing: -0.3px;
            margin-bottom: 8px;
          }
          .brand-sub {
            font-size: 14px;
            color: rgba(255,255,255,0.4);
            margin-bottom: 6px;
            line-height: 1.5;
          }
          .features-row {
            display: flex;
            gap: 8px;
            justify-content: center;
            flex-wrap: wrap;
            margin: 20px 0 32px;
          }
          .feature-chip {
            font-size: 11px;
            font-weight: 500;
            color: rgba(255,255,255,0.5);
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            padding: 4px 10px;
            border-radius: 20px;
            letter-spacing: 0.2px;
          }
          .lang-btn {
            width: 100%;
            padding: 14px 20px;
            border-radius: 14px;
            border: none;
            font-family: 'DM Sans', sans-serif;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
          }
          .lang-btn:last-child { margin-bottom: 0; }
          .lang-btn-primary {
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            color: #fff;
            box-shadow: 0 4px 20px rgba(59,130,246,0.3);
          }
          .lang-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 28px rgba(59,130,246,0.4);
          }
          .lang-btn-secondary {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.7);
          }
          .lang-btn-secondary:hover {
            background: rgba(255,255,255,0.08);
            color: #fff;
            transform: translateY(-1px);
          }
          .lang-btn-flag {
            font-size: 20px;
            line-height: 1;
          }
          .lang-btn-label { flex: 1; text-align: left; }
          .powered {
            font-size: 11px;
            color: rgba(255,255,255,0.2);
            margin-top: 28px;
            letter-spacing: 0.3px;
          }
          .divider {
            height: 1px;
            background: rgba(255,255,255,0.06);
            margin: 24px 0;
          }
        `}</style>
        <div className="lang-page">
          <div className="lang-card">
            <div className="logo-ring">
              <BotIcon size={32} />
            </div>
            <h1 className="brand-title">Recrutement IA</h1>
            <p className="brand-sub">Entretien simulé • Analyse & génération de CV</p>
            <div className="features-row">
              <span className="feature-chip">🤖 IA Groq</span>
              <span className="feature-chip">📄 Analyse CV</span>
              <span className="feature-chip">✨ Génération PDF</span>
            </div>
            <div className="divider" />
            <button className="lang-btn lang-btn-primary" onClick={() => startInterview('fr')}>
              <span className="lang-btn-flag">🇫🇷</span>
              <span className="lang-btn-label">Continuer en Français</span>
            </button>
            <button className="lang-btn lang-btn-secondary" onClick={() => startInterview('en')}>
              <span className="lang-btn-flag">🇬🇧</span>
              <span className="lang-btn-label">Continue in English</span>
            </button>
            <button className="lang-btn lang-btn-secondary" onClick={() => startInterview('ar')}>
              <span className="lang-btn-flag">🇸🇦</span>
              <span className="lang-btn-label">المتابعة بالعربية</span>
            </button>
            <p className="powered">Propulsé par Groq AI (Llama 3.3) • 100% Gratuit</p>
          </div>
        </div>
      </>
    );
  }

  // ============================================
  // INTERFACE CHAT
  // ============================================
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c14; }

        .chat-root {
          min-height: 100vh;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #080c14;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        /* ─── HEADER ─── */
        .chat-header {
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 0 20px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          backdrop-filter: blur(20px);
          z-index: 10;
        }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .avatar {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(59,130,246,0.3);
        }
        .avatar svg { color: white; }
        .agent-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.2px;
        }
        .status-row { display: flex; align-items: center; gap: 6px; margin-top: 1px; }
        .status-dot {
          width: 6px; height: 6px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .status-text { font-size: 11px; color: #22c55e; font-weight: 500; }
        .header-right { display: flex; align-items: center; gap: 8px; }

        .hdr-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.55);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .hdr-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-color: rgba(255,255,255,0.14);
        }
        .hdr-btn.active-cv {
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.4);
          color: #93c5fd;
        }
        .hdr-btn.active-gen {
          background: rgba(34,197,94,0.12);
          border-color: rgba(34,197,94,0.35);
          color: #86efac;
        }
        .hdr-btn.restart {
          padding: 7px 10px;
          font-size: 14px;
        }

        /* ─── MESSAGES ZONE ─── */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

        .msg-row {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          animation: msgIn 0.25s ease;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-row.user { flex-direction: row-reverse; }

        .msg-avatar {
          width: 32px; height: 32px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .msg-avatar.bot {
          background: rgba(59,130,246,0.15);
          border: 1px solid rgba(59,130,246,0.2);
          color: #60a5fa;
        }
        .msg-avatar.user {
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.2);
          color: #a5b4fc;
        }

        .msg-bubble {
          max-width: 72%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .msg-bubble.bot {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.85);
          border-bottom-left-radius: 4px;
        }
        .msg-bubble.bot.score {
          background: rgba(59,130,246,0.08);
          border-color: rgba(59,130,246,0.25);
          color: rgba(255,255,255,0.9);
        }
        .msg-bubble.bot.cv-result {
          background: rgba(34,197,94,0.06);
          border-color: rgba(34,197,94,0.2);
          color: rgba(255,255,255,0.9);
        }
        .msg-bubble.user {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: #fff;
          border-bottom-right-radius: 4px;
          box-shadow: 0 2px 16px rgba(59,130,246,0.25);
        }

        /* Typing indicator */
        .typing-row { display: flex; gap: 10px; align-items: flex-end; }
        .typing-bubble {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; border-bottom-left-radius: 4px;
          padding: 14px 18px;
          display: flex; gap: 5px; align-items: center;
        }
        .typing-dot {
          width: 7px; height: 7px;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          animation: typingBounce 1.2s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }

        /* ─── CV PANELS (en bas) ─── */
        .cv-panel {
          background: rgba(255,255,255,0.02);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 16px 20px;
          max-height: 58vh;
          overflow-y: auto;
          flex-shrink: 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.06) transparent;
          animation: slideUp 0.25s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ─── INPUT ZONE ─── */
        .input-zone {
          background: rgba(255,255,255,0.02);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 14px 20px 16px;
          flex-shrink: 0;
          backdrop-filter: blur(20px);
        }
        .input-row {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          max-width: 900px;
          margin: 0 auto;
        }
        .input-field {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          padding: 11px 16px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          resize: none;
          outline: none;
          min-height: 44px;
          max-height: 120px;
          line-height: 1.5;
          transition: border-color 0.18s ease;
          scrollbar-width: none;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.22); }
        .input-field:focus {
          border-color: rgba(59,130,246,0.4);
          background: rgba(255,255,255,0.06);
        }
        .send-btn {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border: none;
          border-radius: 12px;
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
          flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(59,130,246,0.3);
        }
        .send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59,130,246,0.4);
        }
        .send-btn:disabled {
          background: rgba(255,255,255,0.06);
          box-shadow: none;
          cursor: not-allowed;
        }
        .input-hint {
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.18);
          margin-top: 8px;
          font-weight: 400;
        }

        /* Mobile */
        @media (max-width: 640px) {
          .hdr-btn span.label { display: none; }
          .msg-bubble { max-width: 85%; font-size: 13px; }
          .messages-area { padding: 16px 14px; }
          .input-zone { padding: 12px 14px 14px; }
        }
      `}</style>

      <div className="chat-root">

        {/* ── HEADER ── */}
        <div className="chat-header">
          <div className="header-left">
            <div className="avatar"><BotIcon size={20} /></div>
            <div>
              <div className="agent-name">Sarah</div>
              <div className="status-row">
                <div className="status-dot" />
                <span className="status-text">
                  {language === 'fr' ? 'En ligne' : language === 'en' ? 'Online' : 'متصلة'}
                </span>
              </div>
            </div>
          </div>

          <div className="header-right">
            <button
              className={`hdr-btn ${showCVUploader ? 'active-cv' : ''}`}
              onClick={() => { setShowCVUploader(!showCVUploader); setShowCVGenerator(false); }}
            >
              📄 <span className="label">Analyser CV</span>
              <ChevronDown />
            </button>
            <button
              className={`hdr-btn ${showCVGenerator ? 'active-gen' : ''}`}
              onClick={() => { setShowCVGenerator(!showCVGenerator); setShowCVUploader(false); }}
            >
              ✨ <span className="label">Générer CV</span>
              <ChevronDown />
            </button>
            <button className="hdr-btn restart" onClick={handleRestart} title="Recommencer">
              🔄
            </button>
          </div>
        </div>

        {/* ── MESSAGES ── */}
        <div className="messages-area">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role === 'user' ? 'user' : ''}`}>
              <div className={`msg-avatar ${msg.role === 'user' ? 'user' : 'bot'}`}>
                {msg.role === 'user' ? <UserIcon /> : <BotIcon size={16} />}
              </div>
              <div className={`msg-bubble ${
                msg.role === 'user' ? 'user'
                : msg.isScore ? 'bot score'
                : msg.isCVResult ? 'bot cv-result'
                : 'bot'
              }`}>
                {cleanText(msg.content)}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="typing-row">
              <div className="msg-avatar bot"><BotIcon size={16} /></div>
              <div className="typing-bubble">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── CV UPLOADER (en bas) ── */}
        {showCVUploader && (
          <div className="cv-panel">
            <CVUploader language={language} onAnalysisComplete={handleCVAnalysisComplete} />
          </div>
        )}

        {/* ── CV GENERATOR (en bas) ── */}
        {showCVGenerator && (
          <div className="cv-panel">
            <CVGenerator messages={messages} language={language} />
          </div>
        )}

        {/* ── INPUT ZONE ── */}
        <div className="input-zone">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              className="input-field"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                language === 'fr' ? 'Écrivez votre réponse...'
                : language === 'en' ? 'Write your answer...'
                : 'اكتب إجابتك...'
              }
              rows={1}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              <SendIcon />
            </button>
          </div>
          <p className="input-hint">
            {language === 'fr' && 'Entrée pour envoyer  •  Shift+Entrée pour nouvelle ligne'}
            {language === 'en' && 'Enter to send  •  Shift+Enter for new line'}
            {language === 'ar' && 'Enter للإرسال  •  Shift+Enter لسطر جديد'}
          </p>
        </div>
      </div>
    </>
  );
};

export default ChatBot;