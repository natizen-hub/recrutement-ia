// ============================================
// CVGenerator.jsx — Génération CV PDF
// ============================================

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { BACKEND_URL } from '../services/api';

const CVGenerator = ({ messages, language }) => {

  const [isGenerating, setIsGenerating] = useState(false);
  const [cvData, setCvData] = useState(null);
  const [error, setError] = useState('');

  const extractCandidateInfo = () => {
    const fullConversation = messages
      .map(m => `${m.role === 'user' ? 'Candidat' : 'Sarah'}: ${m.content}`)
      .join('\n');
    return { conversation: fullConversation };
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const candidateInfo = extractCandidateInfo();

      const response = await fetch(`${BACKEND_URL}/api/cv/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateInfo, language }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Erreur serveur');
      }

      const data = await response.json();
      setCvData(data.cvData);

    } catch (err) {
      setError('❌ Erreur : ' + err.message);
    }

    setIsGenerating(false);
  };

  const handleDownloadPDF = () => {
    if (!cvData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 0;

    const bleu = [37, 99, 235];
    const gris = [100, 116, 139];
    const noir = [15, 23, 42];
    const blanc = [255, 255, 255];
    const bleuClair = [239, 246, 255];

    // HEADER
    doc.setFillColor(...bleu);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(...blanc);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(cvData.nom || 'Candidat', 15, 18);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(cvData.titre || '', 15, 28);

    doc.setFontSize(9);
    const contact = [
      cvData.email !== 'N/A' ? `✉ ${cvData.email}` : '',
      cvData.telephone !== 'N/A' ? `✆ ${cvData.telephone}` : '',
      cvData.pays ? `⚑ ${cvData.pays}` : ''
    ].filter(Boolean).join('   |   ');
    doc.text(contact, 15, 38);

    y = 55;

    const sectionTitle = (title) => {
      doc.setFillColor(...bleuClair);
      doc.rect(10, y - 5, pageWidth - 20, 10, 'F');
      doc.setTextColor(...bleu);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 15, y + 2);
      y += 10;
    };

    // PROFIL
    if (cvData.profil) {
      sectionTitle(language === 'en' ? 'PROFESSIONAL PROFILE' : 'PROFIL PROFESSIONNEL');
      doc.setTextColor(...noir);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const profilLines = doc.splitTextToSize(cvData.profil, pageWidth - 30);
      doc.text(profilLines, 15, y);
      y += profilLines.length * 6 + 8;
    }

    // EXPÉRIENCE
    if (cvData.experience?.length > 0) {
      sectionTitle(language === 'en' ? 'WORK EXPERIENCE' : 'EXPÉRIENCE PROFESSIONNELLE');
      cvData.experience.forEach(exp => {
        doc.setTextColor(...noir);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${exp.poste} — ${exp.entreprise}`, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...gris);
        doc.setFontSize(9);
        doc.text(exp.duree || '', pageWidth - 15, y, { align: 'right' });
        y += 6;
        if (exp.description) {
          doc.setTextColor(...noir);
          const lines = doc.splitTextToSize(`• ${exp.description}`, pageWidth - 35);
          doc.text(lines, 20, y);
          y += lines.length * 5 + 4;
        }
        y += 3;
      });
      y += 3;
    }

    // FORMATION
    if (cvData.formation?.length > 0) {
      sectionTitle(language === 'en' ? 'EDUCATION' : 'FORMATION');
      cvData.formation.forEach(f => {
        doc.setTextColor(...noir);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(f.diplome || '', 15, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...gris);
        doc.setFontSize(9);
        doc.text(f.annee || '', pageWidth - 15, y, { align: 'right' });
        y += 5;
        doc.setTextColor(...noir);
        doc.text(f.etablissement || '', 20, y);
        y += 8;
      });
      y += 3;
    }

    // COMPÉTENCES
    if (cvData.competences?.length > 0) {
      sectionTitle(language === 'en' ? 'SKILLS' : 'COMPÉTENCES');
      doc.setTextColor(...noir);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const skillsText = cvData.competences.join('   •   ');
      const skillLines = doc.splitTextToSize(skillsText, pageWidth - 30);
      doc.text(skillLines, 15, y);
      y += skillLines.length * 6 + 8;
    }

    // LANGUES
    if (cvData.langues?.length > 0) {
      sectionTitle(language === 'en' ? 'LANGUAGES' : 'LANGUES');
      doc.setTextColor(...noir);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(cvData.langues.join('   •   '), 15, y);
      y += 10;
    }

    // QUALITÉS
    if (cvData.qualites?.length > 0) {
      sectionTitle(language === 'en' ? 'QUALITIES' : 'QUALITÉS');
      doc.setTextColor(...noir);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(cvData.qualites.join('   •   '), 15, y);
    }

    const fileName = `CV_${(cvData.nom || 'candidat').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const t = {
    fr: {
      title: '📄 Générer mon CV PDF',
      subtitle: "L'IA crée un CV professionnel basé sur votre entretien",
      generate: "✨ Générer mon CV avec l'IA",
      generating: 'Génération en cours...',
      download: '⬇️ Télécharger le PDF',
      preview: 'Aperçu du CV généré',
      warning: "⚠️ Complétez d'abord quelques étapes de l'entretien pour obtenir un meilleur CV."
    },
    en: {
      title: '📄 Generate my PDF CV',
      subtitle: 'AI creates a professional CV based on your interview',
      generate: '✨ Generate my CV with AI',
      generating: 'Generating...',
      download: '⬇️ Download PDF',
      preview: 'Generated CV Preview',
      warning: '⚠️ Complete a few interview steps first for a better CV.'
    },
    ar: {
      title: '📄 إنشاء سيرتي الذاتية',
      subtitle: 'يقوم الذكاء الاصطناعي بإنشاء سيرة ذاتية احترافية',
      generate: '✨ إنشاء سيرتي الذاتية',
      generating: 'جارٍ الإنشاء...',
      download: '⬇️ تحميل PDF',
      preview: 'معاينة السيرة الذاتية',
      warning: '⚠️ أكمل بعض خطوات المقابلة أولاً.'
    }
  };

  const text = t[language] || t['fr'];
  const hasEnoughData = messages.length >= 4;

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-2xl mx-auto">

      <h2 className="text-white text-xl font-bold mb-1">{text.title}</h2>
      <p className="text-slate-400 text-sm mb-6">{text.subtitle}</p>

      {!hasEnoughData && (
        <div className="bg-yellow-900/20 border border-yellow-500 rounded-xl p-4 mb-4">
          <p className="text-yellow-400 text-sm">{text.warning}</p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded-lg">{error}</p>
      )}

      {!cvData ? (
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !hasEnoughData}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> {text.generating}
            </span>
          ) : text.generate}
        </button>
      ) : (
        <div className="space-y-4">

          {/* Aperçu */}
          <div className="bg-slate-700 rounded-xl p-4 border border-slate-600">
            <h3 className="text-blue-400 font-semibold mb-3">{text.preview}</h3>
            <div className="space-y-2 text-sm">
              <p className="text-white font-bold text-lg">{cvData.nom}</p>
              <p className="text-blue-400">{cvData.titre}</p>
              {cvData.profil && (
                <p className="text-slate-300 text-xs leading-relaxed">{cvData.profil}</p>
              )}
              {cvData.competences?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {cvData.competences.slice(0, 4).map((c, i) => (
                    <span key={i} className="bg-blue-900/40 text-blue-300 text-xs px-2 py-1 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Boutons */}
          <button
            onClick={handleDownloadPDF}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {text.download}
          </button>
          <button
            onClick={() => setCvData(null)}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            🔄 Régénérer
          </button>
        </div>
      )}
    </div>
  );
};

export default CVGenerator;