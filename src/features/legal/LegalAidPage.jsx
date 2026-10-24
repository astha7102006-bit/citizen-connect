import React, { useState, useMemo } from 'react';
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
  SECTION_12_CATEGORIES,
  FREE_LEGAL_CHANNELS,
  FICTIONAL_LAWYERS,
  LEGAL_DISCLAIMER_EN,
  LEGAL_DISCLAIMER_HI,
} from '../../data/legalData';
import {
  Scale,
  PhoneCall,
  Shield,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Languages,
  Calendar,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Printer,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Building2,
  Phone,
  Video,
  FileText,
  Clock,
  X,
} from 'lucide-react';

export default function LegalAidPage() {
  const { isDark } = useTheme();
  const { currentLang, setCurrentLang } = useLanguage();
  const isHi = currentLang === 'hi';
  const navigate = useNavigate();
  const { complaints } = useData();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState('eligibility'); // 'eligibility' | 'channels' | 'directory'

  // Section 12 Eligibility Selector State
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [annualIncome, setAnnualIncome] = useState('');
  const [stateIncomeLimitNotice, setStateIncomeLimitNotice] = useState(false);

  // Lawyer Directory Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterFormat, setFilterFormat] = useState('all');
  const [filterFeeModel, setFilterFeeModel] = useState('all');

  // Consultation Modal State
  const [consultModalLawyer, setConsultModalLawyer] = useState(null);
  const [consultSubject, setConsultSubject] = useState('');
  const [consultSuccessMessage, setConsultSuccessMessage] = useState('');

  // Case Summary Modal State
  const [showCaseSummaryModal, setShowCaseSummaryModal] = useState(false);
  const [selectedComplaintForSummary, setSelectedComplaintForSummary] = useState(complaints?.[0] || null);

  // Toggle category in eligibility check
  const toggleCategory = (catId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Eligibility evaluation logic
  const isEligibleByStatute = selectedCategoryIds.some((id) => id !== 'income_limit');
  const isIncomeClaimed = selectedCategoryIds.includes('income_limit') || (annualIncome && Number(annualIncome) <= 300000);

  // Filtered Lawyers calculation
  const filteredLawyers = useMemo(() => {
    return FICTIONAL_LAWYERS.filter((lawyer) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        lawyer.name.toLowerCase().includes(q) ||
        lawyer.specialisation.toLowerCase().includes(q) ||
        lawyer.city.toLowerCase().includes(q) ||
        lawyer.languages.some((l) => l.toLowerCase().includes(q));

      const matchesLocation =
        filterLocation === 'all' || lawyer.city.toLowerCase() === filterLocation.toLowerCase();

      const matchesSpecialty =
        filterSpecialty === 'all' || lawyer.specialisation === filterSpecialty;

      const matchesLanguage =
        filterLanguage === 'all' || lawyer.languages.includes(filterLanguage);

      const matchesFormat =
        filterFormat === 'all' || lawyer.consultationFormat.includes(filterFormat);

      const matchesFee =
        filterFeeModel === 'all' || lawyer.feeModel === filterFeeModel;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesSpecialty &&
        matchesLanguage &&
        matchesFormat &&
        matchesFee
      );
    });
  }, [
    searchQuery,
    filterLocation,
    filterSpecialty,
    filterLanguage,
    filterFormat,
    filterFeeModel,
  ]);

  // Handle consultation booking
  const handleBookConsultation = (e) => {
    e.preventDefault();
    if (!consultModalLawyer) return;
    setConsultSuccessMessage(
      isHi
        ? `सिम्युलेटेड परामर्श अनुरोध दर्ज: ${consultModalLawyer.name} के साथ आपकी परामर्श अर्जी दर्ज हो गई है। यह केवल एक प्रदर्शन सिमुलेशन है।`
        : `Simulated Consultation Logged: Your request to consult with ${consultModalLawyer.name} has been recorded in the demo system. (Fictional demo entry).`
    );
    setConsultModalLawyer(null);
    setConsultSubject('');
    setTimeout(() => setConsultSuccessMessage(''), 6000);
  };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8 space-y-8">
      {/* 1. Mandatory Emergency Banner Notice */}
      <div className="p-3.5 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span>
            {isHi
              ? 'यदि आप इस समय किसी खतरे में हैं, तो तत्काल 112 पर कॉल करें।'
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
            ? 'निःशुल्क कानूनी सहायता एवं अधिवक्ता निर्देशिका'
            : 'Free Legal Aid & Advocate Guidance'
        }
        subtitle={
          isHi
            ? 'विधिक सेवा प्राधिकरण अधिनियम, 1987 की धारा 12 के तहत निःशुल्क विधिक सेवा पात्रता जानें। डीएलएसए, नालसा हेल्पलाइन 15100, टेली-लॉ और अधिवक्ताओं से जुड़ें।'
            : 'Explore statutory free legal aid entitlements under Section 12 of the Legal Services Authorities Act, 1987. Connect with DLSA, NALSA 15100, Tele-Law, and specialized advocates.'
        }
        badge={
          <Badge variant="purple" dot>
            {isHi ? 'नालसा अनुच्छेद 39A' : 'NALSA Article 39A'}
          </Badge>
        }
        breadcrumbs={[
          { label: isHi ? 'विधिक सहायता' : 'Legal Support' },
          { label: isHi ? 'मुफ्त कानूनी सहायता' : 'Free Legal Aid' },
        ]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Switcher */}
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
              {isHi ? 'केस सारांश प्रिंट करें' : 'Prepare My Case Summary'}
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
            {isHi ? 'सामान्य जानकारी — कानूनी सलाह नहीं' : 'General Information, Not Legal Advice'}
          </span>
          <p>{isHi ? LEGAL_DISCLAIMER_HI : LEGAL_DISCLAIMER_EN}</p>
          <span className="text-[11px] opacity-80 mt-1 block">
            {isHi
              ? 'आधिकारिक समर्थन या वकील की उपलब्धता का दावा नहीं किया जाता। सभी सूचीकरण केवल प्रदर्शन (Demo) के लिए हैं।'
              : 'Never invent official endorsements, lawyer credentials, or verified availability. Demo directory listings are explicitly fictional simulations.'}
          </span>
        </div>
      </div>

      {/* 4. Toll-Free NALSA Helpline Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/70 via-indigo-900/60 to-purple-900/70 border border-purple-500/40 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-xl flex-shrink-0">
            <PhoneCall className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-purple-300 font-bold">
              {isHi ? 'राष्ट्रीय विधिक सेवा प्राधिकरण (NALSA)' : 'National Legal Services Authority'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mt-0.5 tracking-tight">
              15100 <span className="text-sm font-normal text-purple-200">({isHi ? 'टोल फ्री' : 'Toll Free'})</span>
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 mt-1">
              {isHi
                ? '24 घंटे निःशुल्क कानूनी टेली-परामर्श • पूरे भारत के सभी नागरिकों के लिए उपलब्ध'
                : '24x7 Free Legal Tele-Consultation for all citizens across India'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto">
          <a
            href="tel:15100"
            className="flex-1 md:flex-initial btn-primary-gradient px-6 py-3 rounded-full text-white font-bold text-sm shadow-md hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{isHi ? '15100 पर कॉल करें' : 'Call 15100 Now'}</span>
          </a>
          <a
            href="https://nalsa.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{isHi ? 'नालसा पोर्टल' : 'NALSA Portal'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Success Notification after Booking */}
      {consultSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{consultSuccessMessage}</span>
        </div>
      )}

      {/* 5. Main Section Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('eligibility')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'eligibility'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{isHi ? 'धारा 12 पात्रता जांच' : 'Section 12 Legal Aid Eligibility'}</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'channels'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{isHi ? 'सरकारी निःशुल्क सहायता केंद्र' : 'Verified Free Assistance Channels'}</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'directory'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>{isHi ? 'अधिवक्ता निर्देशिका (Demo)' : 'Lawyer Directory (Fictional Demo)'}</span>
        </button>
      </div>

      {/* ─── TAB 1: SECTION 12 ELIGIBILITY CALCULATOR & GUIDE ─────────────── */}
      {activeTab === 'eligibility' && (
        <div className="space-y-6">
          <GlassCard isDark={isDark} className="space-y-6">
            <div className="border-b border-slate-200/60 dark:border-slate-800 pb-4">
              <Badge variant="purple" size="sm">
                Legal Services Authorities Act, 1987
              </Badge>
              <h3 className="text-xl font-bold mt-2">
                {isHi
                  ? 'निःशुल्क कानूनी सहायता पात्रता चेकर (धारा 12)'
                  : 'Free Legal Aid Eligibility Screener (Section 12)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isHi
                  ? 'उन श्रेणियों का चयन करें जो आप पर लागू होती हैं। संसद द्वारा पारित अधिनियम के अनुसार पात्र नागरिक निःशुल्क विधिक सेवाओं के हकदार हैं।'
                  : 'Select any categories that apply to you. Eligible individuals are entitled to free legal counsel, document drafting, and court fee waiver under Central legislation.'}
              </p>
            </div>

            {/* Checklist of Section 12 categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SECTION_12_CATEGORIES.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30'
                        : isDark
                        ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 accent-purple-600 rounded"
                    />
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {isHi ? cat.labelHi : cat.label}
                        </strong>
                        <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                          {cat.sectionRef}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        {isHi ? cat.descriptionHi : cat.description}
                      </p>
                      <div className="text-[10px] text-slate-400 pt-1">
                        <strong>{isHi ? 'आवश्यक दस्तावेज:' : 'Proof Needed:'}</strong>{' '}
                        {isHi ? cat.docsNeededHi : cat.docsNeeded}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Income Criteria Notice Box */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>
                  {isHi
                    ? 'महत्वपूर्ण आय मानदंड सूचना (Income Criteria):'
                    : 'Important Statutory Income Threshold Caveat:'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {isHi
                  ? 'आय मानदंड की पुष्टि संबंधित राज्य विधिक सेवा प्राधिकरण (SLSA / DLSA) से की जानी चाहिए। राज्य सरकारें अपनी आय सीमा स्वयं अधिसूचित करती हैं (आमतौर पर ₹1,00,000 से ₹3,00,000 प्रति वर्ष, और सुप्रीम कोर्ट विधिक सेवा समिति के समक्ष ₹5,00,000)।'
                  : 'Income criteria must be verified with the relevant State Legal Services Authority. State limits vary widely by jurisdiction (typically ranging from ₹1,00,000 to ₹3,00,000 per annum, and up to ₹5,00,000 before the Supreme Court Legal Services Committee).'}
              </p>
            </div>

            {/* Dynamic Eligibility Verdict */}
            <div
              className={`p-5 rounded-2xl border text-sm font-medium ${
                isEligibleByStatute
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                  : isIncomeClaimed
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-200'
                  : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-base mb-1">
                {isEligibleByStatute ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {isHi
                        ? 'आप धारा 12 के तहत निःशुल्क विधिक सेवा के पूर्ण पात्र हैं!'
                        : 'Eligible for Statutory Free Legal Aid under Section 12!'}
                    </span>
                  </>
                ) : isIncomeClaimed ? (
                  <>
                    <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span>
                      {isHi
                        ? 'आय प्रमाण के आधार पर पात्रता (स्थानीय डीएलएसए से पुष्टि करें)'
                        : 'Income-Based Eligibility: Verify with Local DLSA / SLSA'}
                    </span>
                  </>
                ) : (
                  <>
                    <Scale className="w-5 h-5 text-slate-400" />
                    <span>
                      {isHi
                        ? 'कृपया उपरोक्त विकल्पों में से अपनी श्रेणी का चयन करें।'
                        : 'Select categories above to check statutory eligibility.'}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {isEligibleByStatute
                  ? isHi
                    ? 'आपको कोर्ट फीस, वकालतनामा शुल्क, दस्तावेज़ टाइपिंग और मुकदमे की पैरवी के लिए सरकार द्वारा मुफ्त वकील उपलब्ध कराया जाएगा।'
                    : 'You are entitled to an empaneled legal aid advocate free of charge, exemption from court fees, and assistance in appeal drafting at state expense.'
                  : isHi
                  ? 'यदि आपकी श्रेणी ऊपर सूचीबद्ध नहीं है, तो भी आप तहसीलदार द्वारा जारी आय प्रमाणपत्र के साथ आवेदन कर सकते हैं।'
                  : 'If you do not fit the specified social categories, you may still qualify under local income limits by presenting an income certificate at the DLSA front office.'}
              </p>
            </div>

            {/* Application Steps & Document Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              {/* Application Steps */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isHi ? 'आवेदन कैसे करें (Application Steps):' : 'Application Procedure:'}</span>
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="leading-relaxed">
                    <strong>{isHi ? 'आवेदन पत्र भरें:' : 'Submit Form A:'}</strong>{' '}
                    {isHi
                      ? 'जिला न्यायालय परिसर में स्थित DLSA फ्रंट ऑफिस जाएं अथवा nalsa.gov.in पर ऑनलाइन आवेदन भरें।'
                      : 'Visit the DLSA Front Office in your District Court or submit online at nalsa.gov.in.'}
                  </li>
                  <li className="leading-relaxed">
                    <strong>{isHi ? 'दस्तावेज संलग्न करें:' : 'Attach Documents:'}</strong>{' '}
                    {isHi
                      ? 'पहचान पत्र (आधार) और श्रेणी/आय प्रमाण पत्र की स्व-प्रमाणित प्रति लगाएं।'
                      : 'Attach self-attested copies of identity proof and category/income certificates.'}
                  </li>
                  <li className="leading-relaxed">
                    <strong>{isHi ? 'जांच एवं अनुमोदन:' : 'Scrutiny & Assignment:'}</strong>{' '}
                    {isHi
                      ? 'सचिव 7-10 कार्यदिवसों में आवेदन की जांच कर पैनल वकील नियुक्त करेंगे।'
                      : 'The Member Secretary reviews and assigns an empaneled advocate within 7–10 working days.'}
                  </li>
                  <li className="leading-relaxed">
                    <strong>{isHi ? 'निःशुल्क परामर्श:' : 'Free Legal Representation:'}</strong>{' '}
                    {isHi
                      ? 'नियुक्त वकील आपके मामले का मसौदा तैयार करेंगे और न्यायालय में पैरवी करेंगे।'
                      : 'The appointed counsel drafts the petitions and appears in court on your behalf with zero fee.'}
                  </li>
                </ol>
              </div>

              {/* Document Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4" />
                  <span>{isHi ? 'आवश्यक दस्तावेज चेकलिस्ट:' : 'Required Document Checklist:'}</span>
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li>Form A (Free Legal Aid Application Form)</li>
                  <li>Proof of Identity (Aadhaar / Voter ID / Ration Card)</li>
                  <li>Section 12 Category Proof (Caste / Disability / Custody / Income Certificate)</li>
                  <li>Copies of original complaint, rejection letters, or department communications</li>
                  <li>Sworn affidavit confirming annual family income (if applying under income quota)</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ─── TAB 2: VERIFIED FREE GOVERNMENT ASSISTANCE CHANNELS ───────────── */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">
              {isHi
                ? 'सत्यापित निःशुल्क सरकारी विधिक सहायता तंत्र'
                : 'Prioritized Official Free Assistance Channels'}
            </h3>
            <Badge variant="purple" size="sm">
              Pan-India Institutional Access
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FREE_LEGAL_CHANNELS.map((ch) => (
              <GlassCard key={ch.id} isDark={isDark} className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="purple" size="sm">
                      {isHi ? ch.tagHi : ch.tag}
                    </Badge>
                    <a
                      href={ch.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <span>{isHi ? 'वेबसाइट' : 'Official Portal'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isHi ? ch.nameHi : ch.name}
                  </h4>

                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-mono font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{isHi ? ch.contactHi : ch.contact}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isHi ? ch.descriptionHi : ch.description}
                  </p>

                  {/* Steps */}
                  <div className="pt-2 text-xs space-y-1">
                    <strong className="text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                      {isHi ? 'पहुंचने की प्रक्रिया:' : 'Access Procedure:'}
                    </strong>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                      {(isHi ? ch.stepsHi : ch.steps).map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    {isHi ? 'लागत: 100% निःशुल्क' : 'Cost: 100% Free under NALSA'}
                  </span>
                  <a
                    href={ch.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary-gradient px-4 py-1.5 rounded-xl text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <span>{isHi ? 'पोर्टल पर जाएं' : 'Open Portal'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: SEARCHABLE FICTIONAL ADVOCATE DIRECTORY ───────────────── */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Explicit Fictional Demo Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
            <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>
                {isHi
                  ? 'प्रदर्शन निर्देशिका सूचना — सभी अधिवक्ता प्रोफाइल काल्पनिक हैं'
                  : 'Fictional Demo Directory — Explicit Simulated Profiles'}
              </span>
            </div>
            <p>
              {isHi
                ? 'यह निर्देशिका केवल CitizenConnect के इंटरफ़ेस और खोज प्रणाली को प्रदर्शित करने के लिए बनाई गई है। वास्तविक सरकारी वकीलों के लिए ऊपर दिए गए "नालसा हेल्पलाइन 15100" या "डीएलएसए फ्रंट ऑफिस" से संपर्क करें।'
                : 'All listings are fictional demo entries to demonstrate platform filtering, fee-tier differentiation, and consultation workflows. For verified legal advocates, contact NALSA (15100) or your nearest District Legal Services Authority.'}
            </p>
          </div>

          {/* Search Bar & Filters */}
          <GlassCard isDark={isDark} className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isHi
                    ? 'अधिवक्ता का नाम, विशेषज्ञता (RTI, भ्रष्टाचार, पुलिस), भाषा या शहर से खोजें...'
                    : 'Search by advocate name, specialty (RTI, corruption, police), language, or city...'
                }
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
            </div>

            {/* Filter Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              {/* Location */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isHi ? 'स्थान (City):' : 'Location:'}
                </label>
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs focus:ring-1 focus:ring-purple-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">{isHi ? 'सभी शहर' : 'All Cities'}</option>
                  <option value="New Delhi">New Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Lucknow">Lucknow</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Kolkata">Kolkata</option>
                </select>
              </div>

              {/* Specialisation */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isHi ? 'विशेषज्ञता:' : 'Specialisation:'}
                </label>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs focus:ring-1 focus:ring-purple-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">{isHi ? 'सभी विशेषज्ञताएं' : 'All Specialties'}</option>
                  <option value="RTI & Administrative Law">RTI & Administrative Law</option>
                  <option value="Anti-Corruption & Vigilance">Anti-Corruption & Vigilance</option>
                  <option value="Civil Rights & Police Accountability">Civil Rights & Police Accountability</option>
                  <option value="Municipal & Consumer Grievances">Municipal & Consumer Grievances</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isHi ? 'भाषा (Language):' : 'Language:'}
                </label>
                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs focus:ring-1 focus:ring-purple-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">{isHi ? 'सभी भाषाएं' : 'All Languages'}</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="English">English</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                </select>
              </div>

              {/* Consultation Format */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isHi ? 'परामर्श प्रारूप:' : 'Consultation Format:'}
                </label>
                <select
                  value={filterFormat}
                  onChange={(e) => setFilterFormat(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs focus:ring-1 focus:ring-purple-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">{isHi ? 'सभी प्रारूप' : 'All Formats'}</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Online Video">Online Video</option>
                  <option value="Phone">Phone</option>
                  <option value="Written Opinion">Written Opinion</option>
                </select>
              </div>

              {/* Fee Model */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isHi ? 'शुल्क मॉडल (Fee Model):' : 'Fee Structure:'}
                </label>
                <select
                  value={filterFeeModel}
                  onChange={(e) => setFilterFeeModel(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs focus:ring-1 focus:ring-purple-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">{isHi ? 'सभी मॉडल' : 'All Fee Types'}</option>
                  <option value="Government legal aid">Government legal aid (DLSA/NALSA)</option>
                  <option value="Free consultation">Free consultation (Pro Bono)</option>
                  <option value="Paid">Paid (Subsidized Private)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                {filteredLawyers.length}{' '}
                {isHi ? 'काल्पनिक डेमो अधिवक्ता उपलब्ध' : 'demo advocates found'}
              </span>
              {(searchQuery ||
                filterLocation !== 'all' ||
                filterSpecialty !== 'all' ||
                filterLanguage !== 'all' ||
                filterFormat !== 'all' ||
                filterFeeModel !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterLocation('all');
                    setFilterSpecialty('all');
                    setFilterLanguage('all');
                    setFilterFormat('all');
                    setFilterFeeModel('all');
                  }}
                  className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  {isHi ? 'सभी फ़िल्टर साफ़ करें' : 'Clear All Filters'}
                </button>
              )}
            </div>
          </GlassCard>

          {/* Lawyer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLawyers.map((lawyer) => {
              const isGov = lawyer.feeModel === 'Government legal aid';
              const isFree = lawyer.feeModel === 'Free consultation';

              return (
                <GlassCard
                  key={lawyer.id}
                  isDark={isDark}
                  className="space-y-4 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Fictional demo watermark tag */}
                  <div className="absolute top-2 right-2 text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    Fictional Demo
                  </div>

                  <div className="space-y-3">
                    {/* Header info */}
                    <div className="pr-16">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Fee Badge */}
                        <Badge
                          variant={isGov ? 'purple' : isFree ? 'success' : 'warning'}
                          size="sm"
                        >
                          {lawyer.feeModel}
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {lawyer.experienceYears} yrs experience
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {lawyer.name}
                      </h4>
                      <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
                        {lawyer.designation}
                      </p>
                      <p className="text-xs text-slate-500">{lawyer.court}</p>
                    </div>

                    {/* Location & Format Tags */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-500" />
                        <span>{lawyer.city}, {lawyer.state}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-sky-500" />
                        <span>{lawyer.consultationFormat}</span>
                      </span>
                    </div>

                    {/* About summary */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {lawyer.about}
                    </p>

                    {/* Languages */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                      <Languages className="w-3.5 h-3.5 text-slate-400" />
                      <span>Languages: <strong>{lawyer.languages.join(', ')}</strong></span>
                    </div>
                  </div>

                  {/* Card Action footer */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-[11px] text-slate-400">
                      {lawyer.phone}
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setConsultModalLawyer(lawyer)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    >
                      {isHi ? 'परामर्श का अनुरोध करें' : 'Request Consultation'}
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MODAL: Simulated Consultation Booking ─────────────────────────── */}
      {consultModalLawyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl relative space-y-5">
            <button
              onClick={() => setConsultModalLawyer(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <Badge variant="purple" size="sm">
                Simulated Consultation Request
              </Badge>
              <h3 className="text-lg font-bold mt-1 text-slate-900 dark:text-white">
                Request Consultation with {consultModalLawyer.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {consultModalLawyer.designation} • {consultModalLawyer.court}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
              <strong>Demo Disclaimer:</strong> All legal listings on this platform are fictional demonstration profiles. Submitting will simulate an advocate appointment in your demo audit trail.
            </div>

            <form onSubmit={handleBookConsultation} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Consultation Format:
                </label>
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold bg-slate-50 dark:bg-slate-800">
                  {consultModalLawyer.consultationFormat}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fee Structure:
                </label>
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold bg-slate-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400">
                  {consultModalLawyer.feeModel}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brief Summary of Legal Matter:
                </label>
                <textarea
                  required
                  rows={3}
                  value={consultSubject}
                  onChange={(e) => setConsultSubject(e.target.value)}
                  placeholder="Outline the government department, delay duration, and relief sought..."
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConsultModalLawyer(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Submit Simulated Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CASE SUMMARY PRINT MODAL ─────────────────────────────────────── */}
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
