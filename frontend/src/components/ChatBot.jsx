// ============================================
// ChatBot.jsx — Theme Clair & Moderne
// ============================================

import { useState, useEffect, useRef } from "react";
import CVUploader from './CVUploader';
import CVGenerator from './CVGenerator';
import { BACKEND_URL } from '../services/api';

const cleanText = (text) => text
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/\*(.*?)\*/g, '$1');

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const BotIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16"/>
    <line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

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
      setMessages([{ role: 'assistant', content: `Erreur : ${error.message}`, isScore: false }]);
    }
    setIsLoading(false);
  };

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
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, isScore: data.isScore || false }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erreur : ${error.message}`, isScore: false }]);
    }
    setIsLoading(false);
  };

  const handleCVAnalysisComplete = (analysis, action) => {
    setShowCVUploader(false);
    let cvSummary = '';
    if (language === 'fr') {
      cvSummary = analysis.isGood
        ? `Analyse CV terminée\n\nScore : ${analysis.score}/100 — CV professionnel !\nPoints forts : ${analysis.pointsForts?.slice(0, 2).join(', ') || 'Bon profil'}\n\nContinuons votre entretien.`
        : `Analyse CV terminée\n\nScore : ${analysis.score}/100 — Des améliorations sont possibles.\nInformations manquantes : ${analysis.informationsManquantes?.slice(0, 2).join(', ') || 'Voir détails'}\nConseil : ${analysis.conseil || 'Complétez votre CV'}`;
    } else if (language === 'en') {
      cvSummary = analysis.isGood
        ? `CV Analysis Complete\n\nScore: ${analysis.score}/100 — Professional CV!\nStrengths: ${analysis.pointsForts?.slice(0, 2).join(', ') || 'Good profile'}\n\nLet's continue.`
        : `CV Analysis Complete\n\nScore: ${analysis.score}/100 — Improvements possible.\nAdvice: ${analysis.conseil || 'Complete your CV'}`;
    } else {
      cvSummary = `اكتمل تحليل السيرة الذاتية\n\nالنتيجة: ${analysis.score}/100`;
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

  if (!started) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #f5f6f8; }
          .lp { min-height: 100vh; background: #f5f6f8; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Plus Jakarta Sans', sans-serif; }
          .lp-card { background: #fff; border-radius: 20px; border: 1px solid #e8eaed; padding: 40px 36px 36px; max-width: 420px; width: 100%; text-align: center; }
          .lp-logo { width: 56px; height: 56px; background: #1a56db; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #fff; }
          .lp-title { font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.3px; margin-bottom: 6px; }
          .lp-sub { font-size: 13.5px; color: #6b7280; margin-bottom: 20px; line-height: 1.5; }
          .lp-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 28px; }
          .lp-chip { font-size: 11.5px; font-weight: 500; color: #374151; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 4px 10px; border-radius: 20px; }
          .lp-divider { height: 1px; background: #f0f0f0; margin-bottom: 20px; }
          .lp-btn { width: 100%; padding: 13px 18px; border-radius: 12px; border: 1px solid #e5e7eb; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; text-align: left; background: #fff; color: #374151; }
          .lp-btn:last-of-type { margin-bottom: 0; }
          .lp-btn-primary { background: #1a56db; border-color: #1a56db; color: #fff; }
          .lp-btn-primary:hover { background: #1648c0; }
          .lp-btn:not(.lp-btn-primary):hover { background: #f9fafb; border-color: #d1d5db; color: #111827; }
          .lp-btn-flag { font-size: 18px; }
          .lp-btn-label { flex: 1; }
          .lp-footer { font-size: 11px; color: #9ca3af; margin-top: 22px; }
        `}</style>
        <div className="lp">
          <div className="lp-card">
            <div className="lp-logo"><BotIcon size={26} /></div>
            <h1 className="lp-title">Recrutement International IA</h1>
            <p className="lp-sub">Entretien simulé avec analyse et génération de CV par intelligence artificielle</p>
            <div className="lp-chips">
              <span className="lp-chip">Entretien IA</span>
              <span className="lp-chip">Analyse CV</span>
              <span className="lp-chip">Génération PDF</span>
              <span className="lp-chip">FR · EN · AR</span>
            </div>
            <div className="lp-divider" />
            <button className="lp-btn lp-btn-primary" onClick={() => startInterview('fr')}>
              <span className="lp-btn-flag">🇫🇷</span><span className="lp-btn-label">Continuer en Français</span>
            </button>
            <button className="lp-btn" onClick={() => startInterview('en')}>
              <span className="lp-btn-flag">🇬🇧</span><span className="lp-btn-label">Continue in English</span>
            </button>
            <button className="lp-btn" onClick={() => startInterview('ar')}>
              <span className="lp-btn-flag">🇸🇦</span><span className="lp-btn-label">المتابعة بالعربية</span>
            </button>
            <p className="lp-footer">Propulsé par Groq AI (Llama 3.3) · 100% Gratuit</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f6f8; }
        .chat-root { height: 100vh; display: flex; flex-direction: column; background: #f5f6f8; font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; }
        .c-header { background: #fff; border-bottom: 1px solid #e8eaed; padding: 0 20px; height: 58px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; z-index: 10; }
        .c-header-left { display: flex; align-items: center; gap: 11px; }
        .c-avatar { width: 36px; height: 36px; background: #1a56db; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
        .c-name { font-size: 14px; font-weight: 700; color: #111827; letter-spacing: -0.2px; }
        .c-status { display: flex; align-items: center; gap: 5px; margin-top: 1px; }
        .c-dot { width: 6px; height: 6px; background: #16a34a; border-radius: 50%; animation: blink 2s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .c-status-txt { font-size: 11px; color: #16a34a; font-weight: 500; }
        .c-header-right { display: flex; gap: 6px; align-items: center; }
        .c-hbtn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: #f9fafb; color: #374151; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
        .c-hbtn:hover { background: #f3f4f6; border-color: #d1d5db; color: #111827; }
        .c-hbtn.on-cv { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
        .c-hbtn.on-gen { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
        .c-hbtn.restart { padding: 6px 10px; font-size: 14px; }
        .c-msgs { flex: 1; overflow-y: auto; padding: 20px 20px 12px; display: flex; flex-direction: column; gap: 14px; scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
        .c-msgs::-webkit-scrollbar { width: 4px; }
        .c-msgs::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
        .c-row { display: flex; gap: 8px; align-items: flex-end; animation: fadeUp 0.2s ease; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .c-row.u { flex-direction: row-reverse; }
        .c-ico { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .c-ico.bot { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .c-ico.usr { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
        .c-bubble { max-width: 70%; padding: 11px 15px; border-radius: 14px; font-size: 13.5px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }
        .c-bubble.bot { background: #fff; border: 1px solid #e8eaed; color: #1f2937; border-bottom-left-radius: 4px; }
        .c-bubble.bot.score { background: #eff6ff; border-color: #bfdbfe; color: #1e3a5f; }
        .c-bubble.bot.cv { background: #f0fdf4; border-color: #bbf7d0; color: #14532d; }
        .c-bubble.usr { background: #1a56db; color: #fff; border-bottom-right-radius: 4px; }
        .c-typing { display: flex; gap: 8px; align-items: flex-end; }
        .c-typing-bub { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; border-bottom-left-radius: 4px; padding: 13px 16px; display: flex; gap: 4px; align-items: center; }
        .c-tdot { width: 6px; height: 6px; background: #d1d5db; border-radius: 50%; animation: tdot 1.2s infinite; }
        .c-tdot:nth-child(2){animation-delay:0.2s} .c-tdot:nth-child(3){animation-delay:0.4s}
        @keyframes tdot { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-4px);opacity:1} }
        .c-cvpanel { background: #fff; border-top: 1px solid #e8eaed; padding: 16px 20px; max-height: 56vh; overflow-y: auto; flex-shrink: 0; animation: slideUp 0.2s ease; scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .c-inputzone { background: #fff; border-top: 1px solid #e8eaed; padding: 12px 20px 14px; flex-shrink: 0; }
        .c-inputrow { display: flex; gap: 8px; align-items: flex-end; max-width: 860px; margin: 0 auto; }
        .c-textarea { flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 11px 14px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; color: #111827; resize: none; outline: none; min-height: 44px; max-height: 120px; line-height: 1.5; transition: border-color 0.15s ease, background 0.15s ease; scrollbar-width: none; }
        .c-textarea::placeholder { color: #9ca3af; }
        .c-textarea:focus { border-color: #93c5fd; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
        .c-sendbtn { width: 44px; height: 44px; background: #1a56db; border: none; border-radius: 12px; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.15s ease; }
        .c-sendbtn:hover:not(:disabled) { background: #1648c0; }
        .c-sendbtn:disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }
        .c-hint { text-align: center; font-size: 11px; color: #d1d5db; margin-top: 7px; }
        @media (max-width: 640px) {
          .lbl { display: none; }
          .c-bubble { max-width: 84%; font-size: 13px; }
          .c-msgs { padding: 14px 12px 10px; }
          .c-inputzone { padding: 10px 12px 12px; }
        }
      `}</style>

      <div className="chat-root">
        <div className="c-header">
          <div className="c-header-left">
            <div className="c-avatar"><BotIcon size={20} /></div>
            <div>
              <div className="c-name">Sarah — IA Recrutement</div>
              <div className="c-status">
                <div className="c-dot" />
                <span className="c-status-txt">
                  {language === 'ar' ? 'متصلة' : language === 'en' ? 'Online' : 'En ligne'}
                </span>
              </div>
            </div>
          </div>
          <div className="c-header-right">
            <button className={`c-hbtn ${showCVUploader ? 'on-cv' : ''}`}
              onClick={() => { setShowCVUploader(!showCVUploader); setShowCVGenerator(false); }}>
              📄 <span className="lbl">Analyser CV</span>
            </button>
            <button className={`c-hbtn ${showCVGenerator ? 'on-gen' : ''}`}
              onClick={() => { setShowCVGenerator(!showCVGenerator); setShowCVUploader(false); }}>
              ✨ <span className="lbl">Générer CV</span>
            </button>
            <button className="c-hbtn restart" onClick={handleRestart}>🔄</button>
          </div>
        </div>

        <div className="c-msgs">
          {messages.map((msg, i) => (
            <div key={i} className={`c-row${msg.role === 'user' ? ' u' : ''}`}>
              <div className={`c-ico ${msg.role === 'user' ? 'usr' : 'bot'}`}>
                {msg.role === 'user' ? <UserIcon /> : <BotIcon size={15} />}
              </div>
              <div className={`c-bubble${
                msg.role === 'user' ? ' usr'
                : msg.isScore ? ' bot score'
                : msg.isCVResult ? ' bot cv'
                : ' bot'
              }`}>
                {cleanText(msg.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="c-typing">
              <div className="c-ico bot"><BotIcon size={15} /></div>
              <div className="c-typing-bub">
                <div className="c-tdot"/><div className="c-tdot"/><div className="c-tdot"/>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showCVUploader && (
          <div className="c-cvpanel">
            <CVUploader language={language} onAnalysisComplete={handleCVAnalysisComplete} />
          </div>
        )}

        {showCVGenerator && (
          <div className="c-cvpanel">
            <CVGenerator messages={messages} language={language} />
          </div>
        )}

        <div className="c-inputzone">
          <div className="c-inputrow">
            <textarea ref={textareaRef} className="c-textarea" value={inputText}
              onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyPress}
              placeholder={language === 'fr' ? 'Écrivez votre réponse...' : language === 'en' ? 'Write your answer...' : 'اكتب إجابتك...'}
              rows={1}
            />
            <button className="c-sendbtn" onClick={handleSend} disabled={!inputText.trim() || isLoading}>
              <SendIcon />
            </button>
          </div>
          <p className="c-hint">
            {language === 'fr' && 'Entrée pour envoyer · Shift+Entrée pour nouvelle ligne'}
            {language === 'en' && 'Enter to send · Shift+Enter for new line'}
            {language === 'ar' && 'Enter للإرسال · Shift+Enter لسطر جديد'}
          </p>
        </div>
      </div>
    </>
  );
};

export default ChatBot;