// ============================================
// CVUploader.jsx — Upload et Analyse de CV
// Permet au candidat d'uploader son CV PDF
// ============================================

import { useState, useRef } from 'react';

// ============================================
// COMPOSANT PRINCIPAL
// Props :
//   language → langue choisie par le candidat
//   onAnalysisComplete → fonction appelée après analyse
// ============================================
const CVUploader = ({ language, onAnalysisComplete }) => {

  // État : fichier sélectionné
  const [file, setFile] = useState(null);

  // État : en cours d'analyse
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // État : résultat de l'analyse
  const [analysis, setAnalysis] = useState(null);

  // État : message d'erreur
  const [error, setError] = useState('');

  // Référence vers l'input file (invisible)
  const fileInputRef = useRef(null);

  // Textes selon la langue
  const texts = {
    fr: {
      title: '📄 Uploadez votre CV',
      subtitle: 'Format PDF uniquement • Maximum 5MB',
      button: 'Choisir un fichier PDF',
      analyze: 'Analyser mon CV avec l\'IA',
      analyzing: 'Analyse en cours...',
      good: '✅ CV Professionnel',
      bad: '⚠️ CV à améliorer',
      score: 'Score',
      strengths: 'Points forts',
      weaknesses: 'Points à améliorer',
      missing: 'Informations manquantes',
      advice: 'Conseil IA',
      continueInterview: '▶️ Continuer l\'entretien',
      improveCV: '🔧 Améliorer mon CV avec l\'IA',
    },
    en: {
      title: '📄 Upload your CV',
      subtitle: 'PDF format only • Maximum 5MB',
      button: 'Choose a PDF file',
      analyze: 'Analyze my CV with AI',
      analyzing: 'Analyzing...',
      good: '✅ Professional CV',
      bad: '⚠️ CV needs improvement',
      score: 'Score',
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
      score: 'النتيجة',
      strengths: 'نقاط القوة',
      weaknesses: 'نقاط الضعف',
      missing: 'معلومات ناقصة',
      advice: 'نصيحة الذكاء الاصطناعي',
      continueInterview: '▶️ متابعة المقابلة',
      improveCV: '🔧 تحسين سيرتي مع الذكاء الاصطناعي',
    }
  };

  const t = texts[language] || texts['fr'];

  // ============================================
  // FONCTION : Sélectionner un fichier
  // ============================================
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setAnalysis(null);

    if (!selectedFile) return;

    // Vérifier que c'est un PDF
    if (selectedFile.type !== 'application/pdf') {
      setError('❌ Seulement les fichiers PDF sont acceptés');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('❌ Le fichier est trop grand (max 5MB)');
      return;
    }

    setFile(selectedFile);
  };

  // ============================================
  // FONCTION : Analyser le CV
  // Envoie le PDF au backend pour analyse IA
  // ============================================
  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError('');

    // FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append('cv', file);           // Le fichier PDF
    formData.append('language', language); // La langue

    try {
      const response = await fetch('http://localhost:5000/api/cv/analyze', {
        method: 'POST',
        body: formData,
        // Pas de Content-Type ici → le navigateur le set automatiquement avec boundary
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erreur analyse');
      }

      const data = await response.json();
      console.log('✅ Analyse reçue:', data.analysis);
      setAnalysis(data.analysis);

    } catch (err) {
      console.error('❌ Erreur upload:', err.message);
      setError('❌ Erreur : ' + err.message);
    }

    setIsAnalyzing(false);
  };

  // ============================================
  // AFFICHAGE
  // ============================================
  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-2xl mx-auto">

      <h2 className="text-white text-xl font-bold mb-1">{t.title}</h2>
      <p className="text-slate-400 text-sm mb-6">{t.subtitle}</p>

      {/* Zone upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 mb-4"
      >
        <div className="text-4xl mb-3">📄</div>
        {file ? (
          <div>
            <p className="text-green-400 font-semibold">{file.name}</p>
            <p className="text-slate-400 text-sm mt-1">
              {(file.size / 1024).toFixed(0)} KB
            </p>
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

      {/* Message d'erreur */}
      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded-lg">
          {error}
        </p>
      )}

      {/* Bouton analyser */}
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

      {/* Résultat de l'analyse */}
      {analysis && (
        <div className="space-y-4">

          {/* Score + Statut */}
          <div className={`p-4 rounded-xl border ${
            analysis.isGood
              ? 'bg-green-900/20 border-green-500'
              : 'bg-yellow-900/20 border-yellow-500'
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
              <h3 className="text-green-400 font-semibold mb-2">
                ✅ {t.strengths}
              </h3>
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
              <h3 className="text-yellow-400 font-semibold mb-2">
                ⚠️ {t.weaknesses}
              </h3>
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
              <h3 className="text-red-400 font-semibold mb-2">
                ❌ {t.missing}
              </h3>
              <ul className="space-y-1">
                {analysis.informationsManquantes.map((info, i) => (
                  <li key={i} className="text-slate-300 text-sm">• {info}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Conseil IA */}
          {analysis.conseil && (
            <div className="bg-blue-900/20 border border-blue-600 rounded-xl p-4">
              <h3 className="text-blue-400 font-semibold mb-2">
                💡 {t.advice}
              </h3>
              <p className="text-slate-300 text-sm">{analysis.conseil}</p>
            </div>
          )}

          {/* Boutons d'action */}
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