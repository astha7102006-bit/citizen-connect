import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import CaseSummaryModal from '../../components/legal/CaseSummaryModal';
import {
  STATUTORY_REMEDIES,
  LEGAL_DISCLAIMER_EN,
  LEGAL_DISCLAIMER_HI,
} from '../../data/legalData';
import {
  Scale,
  FileText,
  AlertTriangle,
  ExternalLink,
  Printer,
  Filter,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Shield,
  HelpCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function LegalRemediesPage() {
  const { isDark } = useTheme();
  const { currentLang, setCurrentLang } = useLanguage();
  const isHi = currentLang === 'hi';
  const navigate = useNavigate();
  const { complaints } = useData();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [expandedRemedy, setExpandedRemedy] = useState(null);

  // Case Summary Modal state
  const [showCaseSummaryModal, setShowCaseSummaryModal] = useState(false);
  const [selectedComplaintForSummary, setSelectedComplaintForSummary] = useState(complaints?.[0] || null);

  // Filter options
  const categoryFilters = [
    { id: 'all', label: 'All Incident Categories', labelHi: 'सभी श्रेणियां' },
    { id: 'bribe', label: 'Bribe Demand / Corruption', labelHi: 'रिश्वत मांग / भ्रष्टाचार' },
    { id: 'delay', label: 'Public Service Refused / Delayed', labelHi: 'सेवा में देरी / इनकार' },
    { id: 'duties', label: 'Official Not Performing Duties', labelHi: 'अधिकारी द्वारा कर्तव्य की उपेक्षा' },
    { id: 'police', label: 'Police Misconduct / Refusal of FIR', labelHi: 'पुलिस कदाचार / एफआईआर से इनकार' },
    { id: 'misbehaviour', label: 'Abusive Behaviour / Harassment', labelHi: 'अभद्र व्यवहार / उत्पीड़न' },
  ];

  const stageFilters = [
    { id: 'all', label: 'All Escalation Stages', labelHi: 'सभी चरण' },
    { id: 1, label: 'Stage 1: Grievance Officer Inaction', labelHi: 'चरण 1: शिकायत अधिकारी स्तर' },
    { id: 2, label: 'Stage 2: First Appeal / Delayed Redressal', labelHi: 'चरण 2: प्रथम अपीलीय स्तर' },
    { id: 3, label: 'Stage 3: Lokayukta / Systemic Deadlock', labelHi: 'चरण 3: लोकायुक्त / गतिरोध' },
  ];

  // Filtered remedies based on category & stage matching
  const filteredRemedies = STATUTORY_REMEDIES.filter((rem) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      rem.relevantCategories.includes('all') ||
      rem.relevantCategories.includes(selectedCategory);

    const matchesStage =
      selectedStage === 'all' || rem.relevantStages.includes(Number(selectedStage));

    return matchesCategory && matchesStage;
  });

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8 space-y-8">
      {/* 1. Mandatory Emergency Banner Notice */}
      <div className="p-3.5 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span>
            {isHi
              ? 'यदि आप इस समय किसी खतरे में हैं, तो तत्काल 112 डायल करें।'
              : 'If you are in danger right now, call 112 immediately for emergency police response.'}
          </span>
        </div>
        <a
          href="tel:112"
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-sm flex-shrink-0"
        >
          Call 112
        </a>
      </div>

      {/* 2. Page Header with Language Switcher & Case Summary trigger */}
      <PageHeader
        title={
          isHi
            ? 'अगले कदम एवं वैधानिक कानूनी उपचार'
            : 'Next Steps & Statutory Legal Remedies'
        }
        subtitle={
          isHi
            ? 'जब प्रशासनिक शिकायत प्रणाली में रुकावट आए, तो भारतीय कानून सुदृढ़ वैधानिक उपचार प्रदान करता है। अपनी शिकायत श्रेणी और चरण के अनुसार प्रासंगिक वैधानिक उपाय समझें।'
            : 'When administrative grievance channels stall, Indian law provides robust statutory instruments. Explore tailored institutional remedies based on your complaint category and escalation stage.'
        }
        badge={
          <Badge variant="saffron" dot>
            {isHi ? 'संवैधानिक एवं वैधानिक अधिकार' : 'Statutory Framework'}
          </Badge>
        }
        breadcrumbs={[
          { label: isHi ? 'विधिक सहायता' : 'Legal Support' },
          { label: isHi ? 'कानूनी उपचार' : 'Legal Remedies' },
        ]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Toggle */}
            <button
              onClick={() => setCurrentLang(isHi ? 'en' : 'hi')}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
              title="Toggle English / हिन्दी"
            >
              {isHi ? 'Switch to English' : 'हिन्दी में देखें'}
            </button>

            {/* Prepare Case Summary Button */}
            <Button
              variant="primary"
              icon={Printer}
              onClick={() => setShowCaseSummaryModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              {isHi ? 'केस सारांश तैयार करें (Print/PDF)' : 'Prepare My Case Summary'}
            </Button>
          </div>
        }
        isDark={isDark}
      />

      {/* 3. Mandatory Statutory Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3">
        <HelpCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider block mb-0.5">
            {isHi ? 'सामान्य जानकारी — विधिक सलाह नहीं' : 'General Information, Not Legal Advice'}
          </span>
          <p>{isHi ? LEGAL_DISCLAIMER_HI : LEGAL_DISCLAIMER_EN}</p>
          <span className="text-[11px] opacity-80 mt-1 block">
            {isHi
              ? 'नोट: प्रत्येक रास्ता हर शिकायत पर लागू नहीं होता। CitizenConnect किसी कानूनी परिणाम का वादा नहीं करता है। हमेशा आधिकारिक स्रोतों से पुष्टि करें।'
              : 'Notice: Not every route applies to every complaint. CitizenConnect does not promise or guarantee a legal outcome. Official source links are provided for direct verification.'}
          </span>
        </div>
      </div>

      {/* 4. Interactive Guidance Filters: By Category & Escalation Stage */}
      <GlassCard isDark={isDark} className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-sm">
              {isHi ? 'शिकायत के अनुसार प्रासंगिक उपाय खोजें' : 'Tailor Practical Options for Your Situation'}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {filteredRemedies.length} {isHi ? 'उपलब्ध वैधानिक विकल्प' : 'Statutory remedies available'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {isHi ? '1. शिकायत की श्रेणी चुनें:' : '1. Select Complaint Category:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold'
                      : isDark
                      ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {isHi ? cat.labelHi : cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Escalation Stage Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {isHi ? '2. वर्तमान शिकायत का स्तर (Stage):' : '2. Current Escalation Stage:'}
            </label>
            <div className="space-y-2">
              {stageFilters.map((stg) => (
                <button
                  key={stg.id}
                  onClick={() => setSelectedStage(stg.id)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                    selectedStage === stg.id
                      ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold'
                      : isDark
                      ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {isHi ? stg.labelHi : stg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(selectedCategory !== 'all' || selectedStage !== 'all') && (
          <div className="pt-2 flex justify-between items-center text-xs">
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              {isHi
                ? 'फ़िल्टर लागू: केवल आपकी श्रेणी और चरण के लिए लागू विकल्प दिखाए जा रहे हैं।'
                : 'Filter applied: Showing only verified routes applicable to your selected conditions.'}
            </span>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStage('all');
              }}
              className="text-xs text-slate-500 hover:text-purple-500 underline cursor-pointer"
            >
              {isHi ? 'फ़िल्टर हटाएं (Reset Filters)' : 'Reset Filters'}
            </button>
          </div>
        )}
      </GlassCard>

      {/* 5. Statutory Remedies Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>
            {isHi ? 'प्रासंगिक वैधानिक संस्थाएं एवं कानूनी मार्ग' : 'Statutory Remedies & Institutional Routes'}
          </span>
        </h3>

        {filteredRemedies.length === 0 ? (
          <GlassCard isDark={isDark} className="text-center py-10">
            <Scale className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold">
              {isHi ? 'कोई विशिष्ट मार्ग मेल नहीं खाता' : 'No specific remedy matches this exact filter combination'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isHi
                ? 'अन्य श्रेणियों या चरणों के लिए फ़िल्टर रीसेट करें।'
                : 'Try resetting the filters or consulting DLSA free legal aid.'}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRemedies.map((remedy) => {
              const isExpanded = expandedRemedy === remedy.id;
              return (
                <GlassCard
                  key={remedy.id}
                  isDark={isDark}
                  className="space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <Badge variant="purple" size="sm">
                        {isHi ? remedy.timeframeHi : remedy.timeframe}
                      </Badge>
                      <span className="text-[11px] font-mono text-[#E06820] font-bold">
                        {isHi ? remedy.provisionHi : remedy.provision}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {isHi ? remedy.titleHi : remedy.title}
                    </h4>

                    {/* What it is & Summary */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {isHi ? remedy.summaryHi : remedy.summary}
                    </p>

                    {/* Verified Deadlines Callout */}
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-800 dark:text-purple-300 flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <strong>{isHi ? 'सत्यापित समय-सीमा:' : 'Verified Statutory Deadlines:'}</strong>{' '}
                        {isHi ? remedy.deadlinesVerifiedHi : remedy.deadlinesVerified}
                      </div>
                    </div>

                    {/* Expandable Section: Steps & Document Checklist */}
                    {isExpanded && (
                      <div className="space-y-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs animate-in fade-in">
                        {/* Steps */}
                        <div>
                          <strong className="block text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {isHi ? 'सामान्य कदम (General Steps):' : 'General Procedural Steps:'}
                          </strong>
                          <ol className="list-decimal pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                            {(isHi ? remedy.generalStepsHi : remedy.generalSteps).map((step, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Documents Checklist */}
                        <div>
                          <strong className="block text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-sky-500" />
                            {isHi ? 'आवश्यक दस्तावेज़ (Documents Checklist):' : 'Documents Checklist:'}
                          </strong>
                          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                            {(isHi ? remedy.documentsChecklistHi : remedy.documentsChecklist).map((doc, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Toggle & Official Portal Link */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => setExpandedRemedy(isExpanded ? null : remedy.id)}
                      className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        {isExpanded
                          ? isHi
                            ? 'कम विवरण देखें'
                            : 'Hide Steps'
                          : isHi
                          ? 'कदम और दस्तावेज़ सूची देखें'
                          : 'View Steps & Documents'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <a
                      href={remedy.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      title={remedy.officialSource}
                    >
                      <span className="truncate max-w-[170px] sm:max-w-none">{remedy.officialSource}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Free Legal Assistance Quick Bridge Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/50 via-indigo-900/40 to-purple-900/50 border border-purple-500/30 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <Badge variant="purple" size="sm">
            {isHi ? 'धारा 12 विधिक सेवा' : 'Section 12 Legal Aid'}
          </Badge>
          <h3 className="text-xl font-bold">
            {isHi
              ? 'क्या आप निःशुल्क कानूनी सहायता के पात्र हैं?'
              : 'Need Representation? Check Free Legal Aid Eligibility'}
          </h3>
          <p className="text-xs text-purple-200 max-w-2xl leading-relaxed">
            {isHi
              ? 'विधिक सेवा प्राधिकरण अधिनियम, 1987 की धारा 12 के तहत महिलाएं, बच्चे, एससी/एसटी, दिव्यांगजन एवं पात्र आय वर्ग निःशुल्क वकील और कोर्ट फीस छूट प्राप्त कर सकते हैं।'
              : 'Under Section 12 of the Legal Services Authorities Act, 1987, eligible citizens receive completely free legal representation through District Legal Services Authorities (DLSA) and NALSA.'}
          </p>
        </div>

        <Button
          variant="primary"
          icon={ArrowRight}
          onClick={() => navigate('/legal-help')}
          className="bg-white text-purple-900 hover:bg-purple-100 font-bold px-6 py-2.5 rounded-2xl flex-shrink-0"
        >
          {isHi ? 'मुफ्त कानूनी सहायता पोर्टल →' : 'Check Eligibility & Directory →'}
        </Button>
      </div>

      {/* 7. Case Summary Modal */}
      {selectedComplaintForSummary && (
        <CaseSummaryModal
          complaint={selectedComplaintForSummary}
          isOpen={showCaseSummaryModal}
          onClose={() => setShowCaseSummaryModal(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
