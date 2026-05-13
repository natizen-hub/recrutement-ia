// ============================================
// CVUploader.jsx — Upload et Analyse de CV
// ============================================

import { useState, useRef } from 'react';
import { BACKEND_URL } from '../services/api';

const CVUploader = ({ language, onAnalysisComplete }) => {

  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const texts = {
    fr: {
      title: '📄 Uploadez votre CV',
      subtitle: 'Format PDF uniquement • Maximum 5MB',
      button: 'Choisir un fichier PDF',
      analyze: "Analyser mon CV avec l'IA",
      analyzing: 'Analyse en cours...',
      good: '✅ CV Professionnel',
      bad: '⚠️ CV à améliorer',
      strengths: 'Points forts',
      weaknesses: 'Points à améliorer',
      missing: 'Informations manquantes',
      advice: 'Conseil IA',
      continueInterview: "▶️ Continuer l'entretien",
      improveCV: "🔧 Améliorer mon CV avec l'IA",
    },
    en: {
      title: '📄 Upload your CV',
      subtitle: 'PDF format only • Maximum 5MB',
      button: 'Choose a PDF file',
      analyze: 'Analyze my CV with AI',
      analyzing: 'Analyzing...',
      good: '✅ Professional CV',
      bad: '⚠️ CV needs improvement',
      strengths: 'Strengths',
      weaknesses: 'Areas to improve',
      missing: 'Missing information',
      advice: 'AI Advice',
      continueInterview: '▶️ Continue interview',
      improveCV: '🔧 Improve my CV with AI',
    },
    ar: {
      title: '📄 ارفع سيرتك الذاتية',
      subtitle: 'صيغة PDF فقط • الحد الأقصى 5MB',
      button: 'اختر ملف PDF',
      analyze: 'تحليل سيرتي الذاتية بالذكاء الاصطناعي',
      analyzing: 'جارٍ التحليل...',
      good: '✅ سيرة ذاتية احترافية',
      bad: '⚠️ السيرة الذاتية تحتاج تحسين',
      strengths: 'نقاط القوة',
      weaknesses: 'نقاط الضعف',
      missing: 'معلومات ناقصة',
      advice: 'نصيحة الذكاء الاصطناعي',
      continueInterview: '▶️ متابعة المقابلة',
      improveCV: '🔧 تحسين سيرتي مع الذكاء الاصطناعي',
    }
  };

  const t = texts[language] || texts['fr'];

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setAnalysis(null);
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      setError('❌ Seulement les fichiers PDF sont acceptés');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('❌ Le fichier est trop grand (max 5MB)');
      return;
    }
    setFile(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError('');

    const formData = new FormData();
    formData.append('cv', file);
    formData.append('language', language);

    try {
      const response = await fetch(`${BACKEND_URL}/api/cv/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erreur analyse');
      }

      const data = await response.json();
      setAnalysis(data.analysis);

    } catch (err) {
      setError('❌ Erreur : ' + err.message);
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-2xl mx-auto">

      <h2 className="text-white text-xl font-bold mb-1">{t.title}</h2>
      <p className="text-slate-400 text-sm mb-6">{t.subtitle}</p>

      {/* Zone upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-all mb-4"
      >
        <div className="text-4xl mb-3">📄</div>
        {file ? (
          <div>
            <p className="text-green-400 font-semibold">{file.name}</p>
            <p className="text-slate-400 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        ) : (
          <p className="text-slate-400">{t.button}</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded-lg">{error}</p>
      )}

      {file && !analysis && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-all mb-4"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> {t.analyzing}
            </span>
          ) : t.analyze}
        </button>
      )}

      {analysis && (
        <div className="space-y-4">

          {/* Score */}
          <div className={`p-4 rounded-xl border ${
            analysis.isGood ? 'bg-green-900/20 border-green-500' : 'bg-yellow-900/20 border-yellow-500'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-lg">
                {analysis.isGood ? t.good : t.bad}
              </span>
              <span className={`text-2xl font-bold ${
                analysis.score >= 70 ? 'text-green-400' :
                analysis.score >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {analysis.score}/100
              </span>
            </div>
          </div>

          {/* Points forts */}
          {analysis.pointsForts?.length > 0 && (
            <div className="bg-slate-700 rounded-xl p-4">
              <h3 className="text-green-400 font-semibold mb-2">✅ {t.strengths}</h3>
              <ul className="space-y-1">
                {analysis.pointsForts.map((point, i) => (
                  <li key={i} className="text-slate-300 text-sm">• {point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Points faibles */}
          {analysis.pointsFaibles?.length > 0 && (
            <div className="bg-slate-700 rounded-xl p-4">
              <h3 className="text-yellow-400 font-semibold mb-2">⚠️ {t.weaknesses}</h3>
              <ul className="space-y-1">
                {analysis.pointsFaibles.map((point, i) => (
                  <li key={i} className="text-slate-300 text-sm">• {point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Informations manquantes */}
          {analysis.informationsManquantes?.length > 0 && (
            <div className="bg-slate-700 rounded-xl p-4">
              <h3 className="text-red-400 font-semibold mb-2">❌ {t.missing}</h3>
              <ul className="space-y-1">
                {analysis.informationsManquantes.map((info, i) => (
                  <li key={i} className="text-slate-300 text-sm">• {info}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Conseil */}
          {analysis.conseil && (
            <div className="bg-blue-900/20 border border-blue-600 rounded-xl p-4">
              <h3 className="text-blue-400 font-semibold mb-2">💡 {t.advice}</h3>
              <p className="text-slate-300 text-sm">{analysis.conseil}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onAnalysisComplete(analysis, 'continue')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all text-sm"
            >
              {t.continueInterview}
            </button>
            {!analysis.isGood && (
              <button
                onClick={() => onAnalysisComplete(analysis, 'improve')}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition-all text-sm"
              >
                {t.improveCV}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CVUploader;