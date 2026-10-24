import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import AiDraftReviewCard from './AiDraftReviewCard';

const CATEGORIES = [
  { id: 'bribe', label: 'Bribe Demand', desc: 'Demand for cash, gifts, or illegal gratification', icon: '💰' },
  { id: 'refusal', label: 'Public Service Refused', desc: 'Arbitrary denial or delay of legitimate citizen service', icon: '🚫' },
  { id: 'harassment', label: 'Rude or Abusive Behaviour', desc: 'Verbal mistreatment, intimidation, or harassment', icon: '⚠️' },
  { id: 'duty-neglect', label: 'Official Not Performing Duties', desc: 'Chronic absenteeism, refusal to sign, or procedural obstruction', icon: '⏳' },
  { id: 'other', label: 'Other Civic Grievance', desc: 'General administrative corruption or regulatory violation', icon: '📋' }
];

const DEPARTMENTS = [
  'Police & Law Enforcement',
  'Municipal Corporation & Civic Services',
  'Public Healthcare & Civil Hospital',
  'Education & School Administration',
  'Revenue & Sub-Registrar Office',
  'Transport Authority (RTO)',
  'Electricity & Water Supply Board',
  'Other Public Administrative Service'
];

export default function WrittenComplaintPage() {
  const { submitComplaint, addSupplementalCorrection } = useData();

  // Form State
  const [formData, setFormData] = useState({
    category: 'bribe',
    department: 'Police & Law Enforcement',
    officeLocation: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '11:30',
    title: '',
    description: '',
    officialName: '',
    officialRole: '',
    citizenName: 'Aditya Kumar Verma',
    citizenPhone: '+91 98765 43210',
    citizenEmail: 'citizen@fictional-citizen.org',
    isAnonymous: false,
    severity: 'High'
  });

  // Witnesses
  const [witnesses, setWitnesses] = useState([]);
  const [newWitness, setNewWitness] = useState({ name: '', contact: '', relation: '' });

  // Attachments
  const [attachments, setAttachments] = useState([]);

  // OTP Verification
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpDemoCode, setOtpDemoCode] = useState('');

  // Declaration
  const [declared, setDeclared] = useState(false);

  // AI Synthesis State
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [aiDraftData, setAiDraftData] = useState(null);

  const handleApplyAiDraft = (aiPackage) => {
    const { correctedFields } = aiPackage;
    setFormData((prev) => ({
      ...prev,
      description: correctedFields.whatHappened || prev.description,
      officeLocation:
        correctedFields.whereHappened && correctedFields.whereHappened !== 'Not stated'
          ? correctedFields.whereHappened
          : prev.officeLocation,
      officialName:
        correctedFields.whoInvolved && correctedFields.whoInvolved !== 'Not stated'
          ? correctedFields.whoInvolved
          : prev.officialName,
    }));
    setAiDraftData(aiPackage);
    setShowAiDraft(false);
  };

  // Errors & UI
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  // Supplemental correction state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionSuccess, setCorrectionSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddWitness = () => {
    if (!newWitness.name.trim()) return;
    setWitnesses(prev => [...prev, { ...newWitness, id: Date.now() }]);
    setNewWitness({ name: '', contact: '', relation: '' });
  };

  const handleRemoveWitness = (id) => {
    setWitnesses(prev => prev.filter(w => w.id !== id));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type || 'Document',
      sha256: `sha256-${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      uploadedAt: new Date().toLocaleTimeString('en-IN')
    }));
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const handleSendOtp = () => {
    setOtpSent(true);
    setOtpDemoCode('112233');
    setOtpError('');
  };

  const handleVerifyOtp = () => {
    if (otpValue.trim() === '112233' || otpValue.trim().length === 6) {
      setOtpVerified(true);
      setOtpError('');
    } else {
      setOtpError('Invalid OTP code. For this simulated demo, please use code 112233.');
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.category) errs.category = 'Incident category is required.';
    if (!formData.department) errs.department = 'Department is required.';
    if (!formData.officeLocation.trim()) errs.officeLocation = 'Please specify the exact office or jurisdiction location.';
    if (!formData.incidentDate) errs.incidentDate = 'Date of incident is required.';
    if (!formData.title.trim()) errs.title = 'A concise subject/title is required.';
    if (!formData.description.trim() || formData.description.length < 20) {
      errs.description = 'Please provide a factual written description (at least 20 characters).';
    }
    if (!otpVerified) {
      errs.otp = 'Simulated mobile OTP verification is required to establish citizen verification.';
    }
    if (!declared) {
      errs.declared = 'You must affirm the statutory declaration before submitting.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await submitComplaint({
        ...formData,
        category: CATEGORIES.find(c => c.id === formData.category)?.label || formData.category,
        witnesses,
        evidenceFiles: attachments,
        otpVerified: true,
        isDeclarationAgreed: true,
        aiDraftData,
        submissionMode: 'Written Form Dossier (Low-Bandwidth / Non-Audio)'
      });

      setSubmittedComplaint(created);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setIsSubmitting(false);
      alert(err.message || 'Failed to submit complaint. Please check your connection.');
    }
  };

  const handleAddCorrection = () => {
    if (!correctionText.trim() || !submittedComplaint) return;
    addSupplementalCorrection(
      submittedComplaint.id,
      correctionText,
      formData.isAnonymous ? 'Citizen (Anonymous Whistleblower)' : formData.citizenName
    );
    setCorrectionSuccess(true);
    setTimeout(() => {
      setCorrectionSuccess(false);
      setShowCorrectionModal(false);
      setCorrectionText('');
    }, 1400);
  };

  // If submitted, show full immutable dossier confirmation
  if (submittedComplaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl font-bold shadow-inner">
                ✓
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Dossier Formally Registered
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                  Complaint Filed Successfully
                </h1>
                <p className="text-sm text-foreground/70">
                  Registered under CitizenConnect Statutory Grievance Redressal Protocol
                </p>
              </div>
            </div>

            <div className="bg-background/80 px-4 py-2 rounded-xl border border-border/60 text-right">
              <span className="text-xs uppercase tracking-wider text-foreground/50 block font-semibold">Official Complaint ID</span>
              <span className="font-mono font-bold text-lg text-primary">{submittedComplaint.id}</span>
            </div>
          </div>

          {/* Grid of dossier highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border/50">
              <span className="text-xs text-foreground/60 block font-medium">Timestamp (IST)</span>
              <p className="font-semibold text-foreground mt-0.5">{submittedComplaint.auditHistory?.[0]?.timestamp || new Date().toLocaleString('en-IN')}</p>
            </div>
            <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border/50">
              <span className="text-xs text-foreground/60 block font-medium">Jurisdiction & Office</span>
              <p className="font-semibold text-foreground mt-0.5">{submittedComplaint.department} — {submittedComplaint.officeLocation}</p>
            </div>
            <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border/50">
              <span className="text-xs text-foreground/60 block font-medium">Incident Category</span>
              <p className="font-semibold text-foreground mt-0.5">{submittedComplaint.category}</p>
            </div>
            <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border/50">
              <span className="text-xs text-foreground/60 block font-medium">Verification Status</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                OTP Verified & Statutory Declaration Bound
              </p>
            </div>
          </div>

          {/* Statutory Deadlines & SLA Timetable */}
          <div className="mb-8 p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
              <span className="text-base">⏱️</span> Statutory Redressal Deadlines (Citizen Charter SLA)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-xs text-foreground/60 block font-semibold">Level 1: Grievance Officer</span>
                <span className="text-lg font-bold text-foreground">7 Days</span>
                <span className="text-[11px] text-foreground/50 block mt-1">Initial notice & inquiry report</span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-xs text-foreground/60 block font-semibold">Level 2: Appellate Authority</span>
                <span className="text-lg font-bold text-foreground">15 Days</span>
                <span className="text-[11px] text-foreground/50 block mt-1">First appeal review deadline</span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-xs text-foreground/60 block font-semibold">Level 3: Ombudsman / Lokayukta</span>
                <span className="text-lg font-bold text-foreground">30 Days</span>
                <span className="text-[11px] text-foreground/50 block mt-1">Independent external sanction</span>
              </div>
            </div>
          </div>

          {/* Immutability & Audit Guarantee Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs sm:text-sm mb-8 flex items-start gap-3">
            <span className="text-lg">🔒</span>
            <div>
              <strong className="font-semibold">Immutable Record Guarantee:</strong> As mandated by civic anti-tampering protocols, complaints cannot be deleted or edited in place. Any clarification or additional evidence will be appended as a timestamped supplemental audit entry.
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border/40 pt-6">
            <Link
              to="/track"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-95 transition-all text-sm shadow-md"
            >
              Track Complaint Status →
            </Link>
            <Link
              to="/citizen-dashboard"
              className="px-6 py-3 rounded-xl bg-card hover:bg-muted text-foreground font-medium border border-border transition-all text-sm"
            >
              Go to Citizen Dashboard
            </Link>
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-medium border border-amber-500/30 transition-all text-sm ml-auto"
            >
              + Submit Supplemental Correction
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground text-sm font-medium border border-border transition-all"
            >
              🖨️ Print Receipt
            </button>
          </div>
        </div>

        {/* Supplemental Correction Modal */}
        {showCorrectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-lg font-bold text-foreground mb-1">Submit Supplemental Correction</h3>
              <p className="text-xs text-foreground/70 mb-4">
                This correction will be appended to the permanent audit trail without rewriting the original statement.
              </p>

              {correctionSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-center text-sm font-semibold mb-4">
                  ✓ Supplemental correction permanently recorded in audit trail.
                </div>
              ) : (
                <>
                  <textarea
                    rows={4}
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    placeholder="Enter additional facts, clarifications, or corrigendum details..."
                    className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 mb-4 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowCorrectionModal(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-foreground/70 hover:bg-foreground/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCorrection}
                      disabled={!correctionText.trim()}
                      className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      Append to Audit Trail
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Written Complaint Form
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Route Switcher Banner */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
            ✍️
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Written Complaint Submission (Text-Only Route)</h1>
            <p className="text-xs text-foreground/60">
              Low-bandwidth format for users without microphone, camera, or voice hardware
            </p>
          </div>
        </div>
        <Link
          to="/report"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center gap-1.5 self-end sm:self-auto"
        >
          <span>🎙️</span> Switch to Audio & Speech Wizard →
        </Link>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-10 border border-border/80 shadow-xl space-y-8">
        
        {/* Section 1: Incident Category */}
        <fieldset className="space-y-3">
          <legend className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
            Incident Category <span className="text-red-500">*</span>
          </legend>
          <p className="text-xs text-foreground/60">Select the primary nature of the civil violation or grievance.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {CATEGORIES.map(cat => (
              <label
                key={cat.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.category === cat.id
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border/60 hover:border-border bg-card/60'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  checked={formData.category === cat.id}
                  onChange={() => handleInputChange('category', cat.id)}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <span>{cat.icon}</span> {cat.label}
                  </div>
                  <div className="text-xs text-foreground/60 mt-0.5 leading-snug">{cat.desc}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.category && <p className="text-xs text-red-500 font-medium">{errors.category}</p>}
        </fieldset>

        {/* Section 2: Department & Office Location */}
        <fieldset className="space-y-4 pt-4 border-t border-border/40">
          <legend className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
            Department & Office Jurisdiction <span className="text-red-500">*</span>
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Responsible Department</label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">
                Office / Station / Zonal Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.officeLocation}
                onChange={(e) => handleInputChange('officeLocation', e.target.value)}
                placeholder="e.g., Connaught Place Police Station, New Delhi"
                className={`w-full p-3 rounded-xl bg-background border ${errors.officeLocation ? 'border-red-500' : 'border-border'} text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40`}
              />
              {errors.officeLocation && <p className="text-xs text-red-500 mt-1">{errors.officeLocation}</p>}
            </div>
          </div>
        </fieldset>

        {/* Section 3: Date, Time, and Specific Landmark */}
        <fieldset className="space-y-4 pt-4 border-t border-border/40">
          <legend className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
            Date & Time of Incident <span className="text-red-500">*</span>
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Date</label>
              <input
                type="date"
                value={formData.incidentDate}
                onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Approximate Time</label>
              <input
                type="time"
                value={formData.incidentTime}
                onChange={(e) => handleInputChange('incidentTime', e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Severity Level</label>
              <select
                value={formData.severity}
                onChange={(e) => handleInputChange('severity', e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Low">Low (Routine Delay)</option>
                <option value="Medium">Medium (Procedural Obstruction)</option>
                <option value="High">High (Direct Bribery or Abuse)</option>
                <option value="Urgent">Urgent (Safety or Human Rights Threat)</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Section 4: Factual Statement & Official Identity */}
        <fieldset className="space-y-4 pt-4 border-t border-border/40">
          <legend className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
            Factual Written Statement & Official Details <span className="text-red-500">*</span>
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Official's Name (if known)</label>
              <input
                type="text"
                value={formData.officialName}
                onChange={(e) => handleInputChange('officialName', e.target.value)}
                placeholder="e.g., Sub-Inspector R.K. Sharma (or leave blank if unknown)"
                className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Official's Designation / Badge / Desk</label>
              <input
                type="text"
                value={formData.officialRole}
                onChange={(e) => handleInputChange('officialRole', e.target.value)}
                placeholder="e.g., Duty Officer, Desk 3, Counter B"
                className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/80 block mb-1">
              Grievance Summary / Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Unlawful demand of Rs 5,000 for issuing police clearance certificate"
              className={`w-full p-3 rounded-xl bg-background border ${errors.title ? 'border-red-500' : 'border-border'} text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/80 block mb-1">
              Detailed Written Statement <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe chronologically what occurred, exact words or demands made, references to receipts or file numbers, and any actions taken..."
              className={`w-full p-3 rounded-xl bg-background border ${errors.description ? 'border-red-500' : 'border-border'} text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed`}
            />
            <div className="flex justify-between items-center text-xs text-foreground/50 mt-1">
              <span>Minimum 20 characters</span>
              <span>{formData.description.length} characters</span>
            </div>
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}

            {/* AI Report Synthesizer Drawer */}
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-3 mt-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span>✨</span> AI-Assisted Evidence Organization & Factual Extraction
                  </h4>
                  <p className="text-[11px] text-foreground/60 mt-0.5">
                    Synthesizes narrative, extracts timestamps and quotations, itemizes evidence, and flags items "Worth a closer look".
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiDraft(!showAiDraft)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all self-start sm:self-auto shrink-0 shadow-sm"
                >
                  {showAiDraft ? 'Hide AI Assistant ▲' : '✨ Open AI Evidence Synthesizer ▼'}
                </button>
              </div>

              {aiDraftData && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <span>✓</span> AI Structured Draft adopted with source citations and human-review flags.
                </div>
              )}

              {showAiDraft && (
                <div className="pt-2 animate-in fade-in">
                  <AiDraftReviewCard
                    narrativeText={formData.description}
                    evidenceFiles={attachments}
                    onApplyDraft={handleApplyAiDraft}
                    initialDraft={aiDraftData?.aiDraft}
                  />
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {/* Section 5: Confidential Witnesses (Reviewer-Only) */}
        <fieldset className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <legend className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
                Optional Witnesses
              </legend>
              <p className="text-xs text-foreground/60 mt-0.5">
                Co-citizens or bystanders present during the incident
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              🔒 Accessible ONLY to Oversight Reviewer
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-foreground/[0.02] border border-border/50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Witness Full Name"
                value={newWitness.name}
                onChange={(e) => setNewWitness(prev => ({ ...prev, name: e.target.value }))}
                className="p-2.5 rounded-lg bg-background border border-border text-foreground text-xs"
              />
              <input
                type="text"
                placeholder="Contact Phone / Email"
                value={newWitness.contact}
                onChange={(e) => setNewWitness(prev => ({ ...prev, contact: e.target.value }))}
                className="p-2.5 rounded-lg bg-background border border-border text-foreground text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Role (e.g. Fellow Citizen)"
                  value={newWitness.relation}
                  onChange={(e) => setNewWitness(prev => ({ ...prev, relation: e.target.value }))}
                  className="flex-1 p-2.5 rounded-lg bg-background border border-border text-foreground text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddWitness}
                  className="px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-all whitespace-nowrap"
                >
                  + Add
                </button>
              </div>
            </div>

            {witnesses.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {witnesses.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60 text-xs">
                    <div>
                      <span className="font-semibold text-foreground">{w.name}</span>
                      <span className="text-foreground/60 ml-2">({w.relation || 'Witness'})</span>
                      {w.contact && <span className="text-foreground/40 ml-2">| {w.contact}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWitness(w.id)}
                      className="text-red-500 hover:text-red-700 font-semibold px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        {/* Section 6: Document & Evidence Upload */}
        <fieldset className="space-y-3 pt-4 border-t border-border/40">
          <legend className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">6</span>
            Supporting Evidence & Documents (Optional)
          </legend>
          <p className="text-xs text-foreground/60">
            Upload receipts, notices, application slips, photographs, or official communication. Cryptographic SHA-256 hashes will be generated automatically.
          </p>

          <div className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-card/40">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="written-file-upload"
            />
            <label htmlFor="written-file-upload" className="cursor-pointer block">
              <span className="text-3xl block mb-2">📁</span>
              <span className="text-sm font-semibold text-primary hover:underline">Click to browse files</span>
              <span className="text-xs text-foreground/50 block mt-1">Supports PDF, JPG, PNG, DOCX up to 25MB</span>
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2 pt-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📄</span>
                    <div>
                      <span className="font-semibold text-foreground">{file.name}</span>
                      <span className="text-foreground/50 ml-2">({file.size})</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] bg-foreground/5 px-2 py-0.5 rounded text-foreground/60 border border-border/40">
                    {file.sha256}
                  </span>
                </div>
              ))}
            </div>
          )}
        </fieldset>

        {/* Section 7: Whistleblower Protection */}
        <fieldset className="pt-4 border-t border-border/40">
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
              className="mt-1 text-primary focus:ring-primary rounded"
            />
            <div>
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>🛡️</span> Request Whistleblower Protection / Anonymous Filing
              </span>
              <p className="text-xs text-foreground/70 mt-1">
                When enabled, your name, contact phone, and email will be completely redacted from the official inbox and public records. Only the Oversight Reviewer can inspect your identity under secure statutory seal.
              </p>
            </div>
          </label>
        </fieldset>

        {/* Section 8: Simulated Mobile OTP Verification */}
        <fieldset className="space-y-4 pt-4 border-t border-border/40">
          <legend className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">7</span>
            Simulated Mobile OTP Verification <span className="text-red-500">*</span>
          </legend>
          <p className="text-xs text-foreground/60">
            Citizen identity is verified via simulated One-Time Password to prevent spam submissions while maintaining confidentiality.
          </p>

          <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-foreground/70 block mb-1">Citizen Mobile Number</label>
                <input
                  type="text"
                  value={formData.citizenPhone}
                  onChange={(e) => handleInputChange('citizenPhone', e.target.value)}
                  disabled={otpVerified}
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-sm disabled:opacity-60"
                />
              </div>
              <div className="self-end">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpVerified}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  {otpSent ? 'Resend Demo OTP' : 'Send Simulated OTP'}
                </button>
              </div>
            </div>

            {otpSent && !otpVerified && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span>📱 Simulated SMS Dispatch to {formData.citizenPhone}:</span>
                  <span className="font-mono font-bold bg-blue-500/20 px-2 py-0.5 rounded text-primary">
                    Code: {otpDemoCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    className="p-2 rounded-lg bg-background border border-border text-foreground font-mono text-sm tracking-widest text-center w-36"
                  />
                  <button
                    type="button"
                    onClick={() => { setOtpValue('112233'); setOtpVerified(true); }}
                    className="px-3 py-2 rounded-lg bg-blue-500 text-white font-semibold text-xs hover:bg-blue-600 transition-all"
                  >
                    Quick-Fill & Verify (112233)
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-foreground font-semibold text-xs hover:bg-muted transition-all"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}

            {otpVerified && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <span>✓</span> Mobile identity successfully verified (+91 98765 43210). Verification token bound to this session.
              </div>
            )}
            {errors.otp && <p className="text-xs text-red-500 font-medium">{errors.otp}</p>}
          </div>
        </fieldset>

        {/* Section 9: Statutory Declaration & Anti-Perjury Affirmation */}
        <fieldset className="space-y-3 pt-4 border-t border-border/40">
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
              className="mt-1 text-primary focus:ring-primary rounded"
            />
            <div>
              <span className="text-sm font-bold text-foreground">
                Statutory Declaration & Verification Affirmation <span className="text-red-500">*</span>
              </span>
              <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                "I solemnly affirm and declare that the facts set forth in this written complaint are true and accurate to the best of my personal knowledge, belief, and documentation. I understand that submitting a false, malicious, or fabricated complaint is punishable under applicable statutory provisions. I consent to CitizenConnect recording this submission with an immutable cryptographic audit record."
              </p>
            </div>
          </label>
          {errors.declared && <p className="text-xs text-red-500 font-medium">{errors.declared}</p>}
        </fieldset>

        {/* Submit Button */}
        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-foreground/50">
            * Mandatory fields. Submission will be cryptographically locked upon registration.
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-95 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span> Registering Dossier...
              </>
            ) : (
              <>
                <span>🛡️</span> Formally File Written Complaint
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
