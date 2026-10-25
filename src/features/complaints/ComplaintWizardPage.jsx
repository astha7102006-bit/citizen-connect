import React, { useState, useRef, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building,
  Calendar,
  Clock,
  FileText,
  User,
  Users,
  Paperclip,
  Mic,
  MicOff,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Shield,
  Lock,
  ArrowRight,
  Volume2,
  Play,
  Square,
  Sparkles,
  Phone,
  FileCheck,
  Smartphone,
  EyeOff,
  UploadCloud,
  X,
} from 'lucide-react';
import AiDraftReviewCard from './AiDraftReviewCard';

export default function ComplaintWizardPage() {
  const { isDark } = useTheme();
  const { currentLang, t } = useLanguage();
  const { departments, submitComplaint } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard current step (1 to 10)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    category: '',
    department: '',
    departmentId: '',
    officeLocation: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '11:00 AM',
    locationDetails: '',
    description: '',
    officialNamed: '',
    officialRole: '',
    witnesses: [], // array of { name, phone, statement }
    evidenceFiles: [], // array of { name, size, type, sha256, uploadedAt }
    audioEvidence: null, // { name, duration, blobUrl, size }
    isAnonymous: false,
    otpMobile: user?.phone || '+91 98765 43210',
    otpCode: '',
    otpSent: false,
    otpVerified: false,
    declarationAgreed: false,
    aiDraftData: null,
  });

  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Audio Recording State (MediaRecorder API)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Speech Recognition (Voice Input for form fields)
  const [isListening, setIsListening] = useState(false);
  const [speechField, setSpeechField] = useState(null);
  const recognitionRef = useRef(null);

  // Submission result state (Step 10)
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize SpeechRecognition if supported by browser
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Indian English accent

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (speechField === 'description') {
          setFormData((prev) => ({
            ...prev,
            description: prev.description ? `${prev.description} ${transcript}` : transcript,
          }));
        } else if (speechField === 'officialNamed') {
          setFormData((prev) => ({ ...prev, officialNamed: transcript }));
        }
        setIsListening(false);
        setSpeechField(null);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setSpeechField(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechField(null);
      };

      recognitionRef.current = recognition;
    }
  }, [speechField]);

  const toggleVoiceInput = (field) => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type directly.');
      return;
    }
    if (isListening && speechField === field) {
      recognitionRef.current.stop();
      setIsListening(false);
      setSpeechField(null);
    } else {
      setSpeechField(field);
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // MediaRecorder handlers for in-browser audio recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setFormData((prev) => ({
          ...prev,
          audioEvidence: {
            name: `Citizen_Audio_Testimony_${Date.now()}.webm`,
            size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
            duration: `${recordingSeconds}s`,
            sha256: `sha256-audio-${Math.random().toString(36).substring(2, 10)}${Date.now()}`,
          },
        }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access is not available or was blocked. You can still upload audio files in Step 6.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const discardAudioRecording = () => {
    setAudioUrl(null);
    setFormData((prev) => ({ ...prev, audioEvidence: null }));
    setRecordingSeconds(0);
  };

  const handleApplyAiDraft = (aiPackage) => {
    const { correctedFields } = aiPackage;
    setFormData((prev) => ({
      ...prev,
      description: correctedFields.whatHappened || prev.description,
      officeLocation:
        correctedFields.whereHappened && correctedFields.whereHappened !== 'Not stated'
          ? correctedFields.whereHappened
          : prev.officeLocation,
      officialNamed:
        correctedFields.whoInvolved && correctedFields.whoInvolved !== 'Not stated'
          ? correctedFields.whoInvolved
          : prev.officialNamed,
      aiDraftData: aiPackage,
    }));
    setShowAiAssistant(false);
  };

  // File Upload Handlers (Photos, PDFs, Docs, Audio, Video)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttachments = files.map((f) => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      type: f.type || 'application/octet-stream',
      sha256: `sha256-${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`,
      uploadedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }));

    setFormData((prev) => ({
      ...prev,
      evidenceFiles: [...prev.evidenceFiles, ...newAttachments],
    }));
  };

  const removeEvidence = (index) => {
    setFormData((prev) => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index),
    }));
  };

  // Witness management (Step 5)
  const [witnessInput, setWitnessInput] = useState({ name: '', phone: '', statement: '' });

  const addWitness = () => {
    if (!witnessInput.name.trim()) return;
    setFormData((prev) => ({
      ...prev,
      witnesses: [
        ...prev.witnesses,
        {
          id: `wit-${Date.now()}`,
          name: witnessInput.name.trim(),
          phone: witnessInput.phone.trim() || 'Not Provided',
          statement: witnessInput.statement.trim() || 'Present at incident location.',
        },
      ],
    }));
    setWitnessInput({ name: '', phone: '', statement: '' });
  };

  const removeWitness = (id) => {
    setFormData((prev) => ({
      ...prev,
      witnesses: prev.witnesses.filter((w) => w.id !== id),
    }));
  };

  // Simulated OTP Handlers (Step 9)
  const handleSendOtp = () => {
    if (!formData.otpMobile || formData.otpMobile.length < 10) {
      setErrors((prev) => ({ ...prev, otp: 'Please enter a valid 10-digit mobile number' }));
      return;
    }
    setFormData((prev) => ({ ...prev, otpSent: true, otpCode: '112233' }));
    setErrors((prev) => ({ ...prev, otp: null }));
  };

  const handleVerifyOtp = () => {
    if (formData.otpCode.trim() === '112233' || formData.otpCode.length === 6) {
      setFormData((prev) => ({ ...prev, otpVerified: true }));
      setErrors((prev) => ({ ...prev, otp: null }));
    } else {
      setErrors((prev) => ({ ...prev, otp: 'Invalid OTP. For demo test, use: 112233' }));
    }
  };

  // Step Validation Logic
  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.category) errs.category = 'Please select an incident category';
    } else if (step === 2) {
      if (!formData.department) errs.department = 'Please select a responsible department';
      if (!formData.officeLocation.trim()) errs.officeLocation = 'Please specify the office or district location';
    } else if (step === 3) {
      if (!formData.incidentDate) errs.incidentDate = 'Please select the date of incident';
      if (!formData.locationDetails.trim()) errs.locationDetails = 'Please specify incident location details';
    } else if (step === 4) {
      if (!formData.description.trim() || formData.description.trim().length < 20) {
        errs.description = 'Please describe the incident in detail (minimum 20 characters)';
      }
    } else if (step === 9) {
      if (!formData.otpVerified) errs.otp = 'Please verify your mobile number with OTP';
      if (!formData.declarationAgreed) errs.declaration = 'You must agree to the statutory truthfulness declaration';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 10));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Final Submission (Step 9 -> Step 10)
  const handleFinalSubmit = async () => {
    if (!validateStep(9)) return;

    setIsSubmitting(true);
    try {
      const record = await submitComplaint({
        title: `${formData.category || 'Grievance'} at ${formData.officeLocation || 'Civic Center'}`,
        category: formData.category || 'Procedural Violation',
        department: formData.department,
        departmentId: formData.departmentId,
        officeLocation: formData.officeLocation,
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime,
        description: formData.description,
        officialNamed: formData.officialNamed || 'Unspecified Official',
        officialRole: formData.officialRole || 'Department Staff',
        witnesses: formData.witnesses,
        evidenceFiles: formData.evidenceFiles,
        audioEvidence: formData.audioEvidence,
        isAnonymous: formData.isAnonymous,
        otpVerified: formData.otpVerified,
        isDeclarationAgreed: true,
        aiDraftData: formData.aiDraftData,
      });

      setSubmittedComplaint(record);
      setIsSubmitting(false);
      setCurrentStep(10);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } catch (err) {
      setIsSubmitting(false);
      alert(err.message || 'Submission failed. Please check your network.');
    }
  };

  // Category Options (Step 1)
  const incidentCategories = [
    {
      id: 'Bribe demand',
      title: 'Bribe Demand / Extortion',
      desc: 'Cash demanded for certificate, mutation, license, or routine public service.',
      badge: 'Anti-Corruption Act',
      icon: '₹',
    },
    {
      id: 'Public service refused',
      title: 'Public Service Refused',
      desc: 'Ration, Ayushman Bharat, water supply, or statutory entitlement denied.',
      badge: 'Citizens Charter',
      icon: '✕',
    },
    {
      id: 'Rude or abusive behaviour',
      title: 'Rude or Abusive Behaviour',
      desc: 'Verbal humiliation, intimidation, or harassment by government employees.',
      badge: 'Code of Conduct',
      icon: '!',
    },
    {
      id: 'Official not performing duties',
      title: 'Official Not Performing Duties',
      desc: 'Willful delay, unauthorized absence, or intentional suppression of citizen files.',
      badge: 'SLA Escalation',
      icon: '⏱',
    },
    {
      id: 'Other',
      title: 'Other Maladministration',
      desc: 'Illegal demolition threat, tender rigging, or conflict of interest.',
      badge: 'General Grievance',
      icon: '⚖',
    },
  ];

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8">
      {/* Header */}
      <PageHeader
        title={t('wizardTitle')}
        subtitle={t('wizardSubtitle')}
        badge={<Badge variant="saffron" dot>{t('feat3Title')}</Badge>}
        breadcrumbs={[{ label: t('navHome') }, { label: t('navFileComplaint') }]}
        action={
          <Link
            to="/written-complaint"
            className="text-xs font-semibold text-[#0F4C81] dark:text-sky-300 hover:underline flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Switch to Written Form →</span>
          </Link>
        }
        isDark={isDark}
      />

      {/* Progress Stepper (Steps 1 to 9) */}
      {currentStep < 10 && (
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>{t('wizardStep')} {currentStep} {t('wizardOf')} 9</span>
            <span>
              {currentStep === 1 && t('wizardStep1')}
              {currentStep === 2 && t('wizardStep2')}
              {currentStep === 3 && t('wizardStep3')}
              {currentStep === 4 && t('wizardStep4')}
              {currentStep === 5 && t('wizardStep5')}
              {currentStep === 6 && t('wizardStep6')}
              {currentStep === 7 && t('wizardStep7')}
              {currentStep === 8 && t('wizardStep8')}
              {currentStep === 9 && t('wizardStep9')}
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 btn-primary-gradient"
              style={{ width: `${(currentStep / 9) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP CONTAINER */}
      <div className="max-w-4xl mx-auto">
        {/* =========================================================================
            STEP 1: Incident Category
            ========================================================================= */}
        {currentStep === 1 && (
          <GlassCard isDark={isDark} className="space-y-6">
            <div className="text-center sm:text-left">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#E06820]">Step 1: Classification</span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">What is the primary nature of your grievance?</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Select one main category. This determines the statutory escalation authority tier.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {incidentCategories.map((cat) => {
                const isSelected = formData.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: cat.id });
                      setErrors({ ...errors, category: null });
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? isDark
                          ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/40 text-white'
                          : 'bg-sky-50 border-sky-500 ring-2 ring-sky-400/40 text-slate-900 shadow-md'
                        : isDark
                        ? 'bg-slate-900/60 border-slate-700/80 hover:border-slate-500 text-slate-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-8 h-8 rounded-full bg-[#0F4C81]/15 text-[#0F4C81] dark:text-sky-300 font-black flex items-center justify-center text-sm">
                          {cat.icon}
                        </span>
                        <Badge variant="primary" size="sm">{cat.badge}</Badge>
                      </div>
                      <h3 className="font-bold text-base">{cat.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {cat.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {errors.category && (
              <p className="text-xs text-red-500 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {errors.category}
              </p>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button variant="primary" onClick={handleNext} iconRight={ChevronRight}>
                Continue to Department Selection
              </Button>
            </div>
          </GlassCard>
        )}

        {/* =========================================================================
            STEP 2: Department and Office Selection
            ========================================================================= */}
        {currentStep === 2 && (
          <GlassCard isDark={isDark} className="space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#E06820]">Step 2: Department & Authority</span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">Which public department and local office are accountable?</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Includes Municipal services, Police, Public Hospitals, Education, Revenue, and Utilities.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Accountable Department / Ministry <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => {
                    const sel = departments.find((d) => d.name === e.target.value);
                    setFormData({
                      ...formData,
                      department: e.target.value,
                      departmentId: sel ? sel.id : '',
                    });
                    setErrors({ ...errors, department: null });
                  }}
                  className={`w-full p-3.5 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                    isDark ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                >
                  <option value="">Select Accountable Public Service Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.code}) — SLA Level 1: {d.slaDaysLevel1} Days
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {errors.department}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Specific Office / Police Station / Hospital Facility <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.officeLocation}
                  onChange={(e) => {
                    setFormData({ ...formData, officeLocation: e.target.value });
                    setErrors({ ...errors, officeLocation: null });
                  }}
                  placeholder="e.g. Ward 14 Zonal Office, Civil Lines Police Station, District Civil Hospital"
                  className={`w-full p-3.5 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                    isDark ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
                {errors.officeLocation && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {errors.officeLocation}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button variant="outline" onClick={handleBack} icon={ChevronLeft}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNext} iconRight={ChevronRight}>
                Continue to Incident Timing
              </Button>
            </div>
          </GlassCard>
        )}

        {/* =========================================================================
            STEP 3: Date, Time and Location of Incident
            ========================================================================= */}
        {currentStep === 3 && (
          <GlassCard isDark={isDark} className="space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#E06820]">Step 3: Timeline & Place</span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">When and where did this incident occur?</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Accurate timestamps establish statutory limitation periods under the Citizens Charter.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Incident Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                  className={`w-full p-3.5 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                    isDark ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Approximate Time
                </label>
                <input
                  type="text"
                  value={formData.incidentTime}
                  onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                  placeholder="e.g. 11:30 AM, Afternoon"
                  className={`w-full p-3.5 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                    isDark ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Exact Location / Room / Counter / Landmark <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.locationDetails}
                onChange={(e) => {
                  setFormData({ ...formData, locationDetails: e.target.value });
                  setErrors({ ...errors, locationDetails: null });
                }}
                placeholder="e.g. Counter #4 (Revenue Mutation Section), Room 12 Ground Floor"
                className={`w-full p-3.5 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                  isDark ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
              {errors.locationDetails && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {errors.locationDetails}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button variant="outline" onClick={handleBack} icon={ChevronLeft}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNext} iconRight={ChevronRight}>
                Continue to Statement
              </Button>
            </div>
          </GlassCard>
        )}

        {/* =========================================================================
            STEP 4: Description & Official Details (with Voice Input)
            ========================================================================= */}
        {currentStep === 4 && (
          <GlassCard isDark={isDark} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#E06820]">Step 4: Allegations & Facts</span>
                <h2 className="text-xl sm:text-2xl font-black mt-1">Describe what happened and who was involved</h2>
              </div>
              <button
                type="button"
                onClick={() => toggleVoiceInput('description')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer self-start sm:self-center ${
                  isListening && speechField === 'description'
                    ? 'bg-red-600 text-white border-red-500 animate-pulse'
                    : isDark
                    ? 'bg-slate-800 text-sky-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100'
                }`}
                title="Dictate with voice"
              >
                {isListening && speechField === 'description' ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Listening... (Click to stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#E06820]" />
                    <span>Voice Input (Speech-to-Text)</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Detailed Statement of Facts <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setErrors({ ...errors, description: null });
                  }}
                  placeholder="State the facts chronologically. What demands were made? What statutory notices were bypassed? What responses were given?"
                  className={`w-full p-3.5 rounded-2xl text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                    isDark ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                  <span>Minimum 20 characters required</span>
                  <span>{formData.description.length} characters</span>
                </div>
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* AI Evidence & Report Synthesizer Section */}
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        AI-Assisted Evidence & Report Organization
                      </h4>
                      <p className="text-[11px] text-foreground/60">
                        Extract verifiable timeline, personnel, quotations, and inventory from your statements and files.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiAssistant(!showAiAssistant)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all self-start sm:self-auto shrink-0 shadow-sm"
                  >
                    {showAiAssistant ? 'Hide AI Assistant ▲' : '✨ Open AI Evidence Synthesizer ▼'}
                  </button>
                </div>

                {formData.aiDraftData && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Structured AI Draft adopted with verifiable citations and citizen oversight.</span>
                  </div>
                )}

                {showAiAssistant && (
                  <div className="pt-2 animate-in fade-in">
                    <AiDraftReviewCard
                      narrativeText={formData.description}
                      evidenceFiles={formData.evidenceFiles}
                      audioEvidence={formData.audioEvidence}
                      onApplyDraft={handleApplyAiDraft}
                      initialDraft={formData.aiDraftData?.aiDraft}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Official's Name (If known or seen on name badge)
                  </label>
                  <input
                    type="text"
                    value={formData.officialNamed}
                    onChange={(e) => setFormData({ ...formData, officialNamed: e.target.value })}
                    placeholder="e.g. Shri R. K. Sharma"
                    className={`w-full p-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                      isDark ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Official's Role or Desk
                  </label>
                  <input
                    type="text"
                    value={formData.officialRole}
                    onChange={(e) => setFormData({ ...formData, officialRole: e.target.value })}
                    placeholder="e.g. Ward Inspector, Executive Engineer, Clerk"
                    className={`w-full p-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                      isDark ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button variant="outline" onClick={handleBack} icon={ChevronLeft}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNext} iconRight={ChevronRight}>
                Continue to Witnesses
              </Button>
            </div>
          </GlassCard>
        )}

        {/* =========================================================================
            STEP 5: Optional Witnesses (Strict Security Requirement)
            ========================================================================= */}
        {currentStep === 5 && (
          <GlassCard isDark={isDark} className="space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#E06820]">Step 5: Witness Corroboration</span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">Were there any witnesses present? (Optional)</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">You can add shopkeepers, bystanders, or colleagues who observed the interaction.</p>
            </div>

            {/* MANDATORY SECURITY ASSURANCE */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-800 dark:text-purple-200 text-xs sm:text-sm flex items-start space-x-3">
              <Shield className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Confidentiality Protection:</strong> Witness names and phone numbers are statutorily protected. They are accessible <strong>ONLY to the Oversight Reviewer</strong> and will <strong>NEVER</strong> be shared with the accused department or official.
              </div>
            </div>

            {/* Added Witnesses List */}
            {formData.witnesses.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recorded Witnesses ({formData.witnesses.length})</span>
                {formData.witnesses.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-sm">{w.name} ({w.phone})</div>
                      <div className="text-slate-400 mt-0.5">{w.statement}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWitness(w.id)}
                      className="p-1 rounded-full text-red-500 hover:bg-red-500/10 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Witness Input Form */}
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add a Witness</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={witnessInput.name}
                  onChange={(e) => setWitnessInput({ ...witnessInput, name: e.target.value })}
                  placeholder="Witness Full Name"
                  className={`p-3 rounded-xl text-xs border ${isDark ? 'glass-input-dark' : 'glass-input-light'}`}
                />
                <input
                  type="text"
                  value={witnessInput.phone}
                  onChange={(e) => setWitnessInput({ ...witnessInput, phone: e.target.value })}
                  placeholder="Contact Number (Encrypted)"
                  className={`p-3 rounded-xl text-xs border ${isDark ? 'glass-input-dark' : 'glass-input-light'}`}
                />
              </div>
              <input
                type="text"
                value={witnessInput.statement}
                onChange={(e) => setWitnessInput({ ...witnessInput, statement: e.target.value })}
                placeholder="What did this witness see or hear?"
                className={`w-full p-3 rounded-xl text-xs border ${isDark ? 'glass-input-dark' : 'glass-input-light'}`}
              />
              <Button size="sm" variant="secondary" onClick={addWitness}>
                + Add Witness to Confidential Roster
              </Button>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button variant="outline" onClick={handleBack} icon={ChevronLeft}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNext} iconRight={ChevronRight}>
                Continue to Evidence Upload
              </Button>
            </div>
          </GlassCard>
        )}

        {/* =========================================================================
            STEP 6: Evidence Upload (Photos, PDFs, Docs, Audio, Video)
            ========================================================================= */}
        {currentStep === 6 && (
          <GlassCard isDark={isDark} className="space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#E06820]">Step 6: Documentary Evidence</span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">Upload supporting documents and files</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Accepts photographs, PDF letters, demand notices, receipts, audio, and video recordings.</p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/30">
              <UploadCloud className="w-10 h-10 text-sky-500 mb-2" />
              <span className="text-sm font-bold">Click or drag files to upload</span>
              <span className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOCX, MP3, MP4 (Up to 25 MB per file)</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,audio/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Attached Files List with SHA-256 Hashes */}
            {formData.evidenceFiles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attached Files ({formData.evidenceFiles.length})</span>
                <div className="space-y-2">
                  {formData.evidenceFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold truncate max-w-sm">{f.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate">
                          {f.size} • Hash: {f.sha256}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Badge variant="success" size="sm">Hashed</Badge>
                        <button
                          type="button"
                          onClick={() => removeEvidence(idx)}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded-full cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button variant="outline" onClick={handleBack} icon={ChevronLeft}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNext} iconRight={ChevronRight}>
                Continue to Audio Testimony
              </Button>
            </div>
          </GlassCard>
        )}

        {/* =========================================================================
            STEP 7: In-Browser Audio Recording (MediaRecorder API)
            ========================================================================= */}
        {currentStep === 7 && (
          <GlassCard isDark={isDark} className="space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#E06820]">Step 7: Audio Testimony</span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">Record in-browser voice testimony (Optional)</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Record your statement directly using your microphone via the browser MediaRecorder API.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#0F4C81]/15 text-[#0F4C81] dark:text-sky-400 flex items-center justify-center">
                <Mic className={`w-8 h-8 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
              </div>

              {isRecording ? (
                <div>
                  <div className="text-red-500 font-extrabold text-lg flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                    Recording in progress... {recordingSeconds}s
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Speak clearly into your microphone</p>
                  <Button
                    variant="danger"
                    size="md"
                    className="mt-4"
                    onClick={stopAudioRecording}
                    icon={Square}
                  >
                    Stop Recording
                  </Button>
                </div>
              ) : audioUrl ? (
                <div className="space-y-3">
                  <div className="text-emerald-500 font-bold text-sm flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Testimony Recorded ({formData.audioEvidence?.duration})
                  </div>
                  <audio controls src={audioUrl} className="mx-auto max-w-md w-full" />
                  <div className="flex justify-center gap-3 pt-2">
                    <Button size="sm" variant="outline" onClick={discardAudioRecording}>
                      Discard & Re-Record
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-bold text-base">Ready to Record Voice Statement</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Click the button below to start your recording. You can review and re-record before submitting.
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    className="mt-4"
                    onClick={startAudioRecording}
                    icon={Mic}
                  >
                    Start In-Browser Recording
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button variant="outline" onClick={handleBack} icon={ChevronLeft}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNext} iconRight={ChevronRight}>
                Continue to Voice Input Tools
              </Button>
            </div>
          </GlassCard>
        )}

        {/* =========================================================================
            STEP 8: Voice Input for Form Fields (Web Speech API)
            ========================================================================= */}
        {currentStep === 8 && (
          <GlassCard isDark={isDark} className="space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#E06820]">Step 8: Voice Input Review</span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">Voice Recognition & Dictation Assistant</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Review speech-to-text dictation across your complaint inputs before proceeding to final review.</p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-3">
              <div className="flex items-center space-x-2 text-sky-700 dark:text-sky-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-[#E06820]" />
                <span>Web Speech API Status: Active (Language: Indian English en-IN)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You can dictate additional facts directly into your statement below. Speech recognition will append text automatically.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Dictated Statement Preview
                </label>
                <button
                  type="button"
                  onClick={() => toggleVoiceInput('description')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 border cursor-pointer ${
                    isListening && speechField === 'description'
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-[#0F4C81] text-white'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isListening ? 'Listening...' : 'Dictate More'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full p-3 rounded-2xl text-xs sm:text-sm border resize-none ${isDark ? 'glass-input-dark' : 'glass-input-light'}`}
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button variant="outline" onClick={handleBack} icon={ChevronLeft}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNext} iconRight={ChevronRight}>
                Proceed to Review & Verification
              </Button>
            </div>
          </GlassCard>
        )}

        {/* =========================================================================
            STEP 9: Review All Information, Simulated OTP & Declaration
            ========================================================================= */}
        {currentStep === 9 && (
          <GlassCard isDark={isDark} className="space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#E06820]">Step 9: Final Review & Verification</span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">Review your case file before statutory submission</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Please verify all allegations. Once submitted, records cannot be altered or erased.</p>
            </div>

            {/* Dossier Summary Table */}
            <div className="p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                <div>
                  <span className="text-slate-400 block text-xs">Incident Category:</span>
                  <span className="font-bold text-[#E06820]">{formData.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Accountable Department:</span>
                  <span className="font-bold">{formData.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Specific Office / Unit:</span>
                  <span className="font-bold">{formData.officeLocation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Date & Time:</span>
                  <span className="font-bold">{formData.incidentDate} ({formData.incidentTime})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Named Official:</span>
                  <span className="font-bold">{formData.officialNamed || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Official Role:</span>
                  <span className="font-bold">{formData.officialRole || 'Designated Public Servant'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-xs mb-1">Grievance Statement:</span>
                <p className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed">
                  {formData.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Witnesses:</span>
                  <span className="font-semibold">{formData.witnesses.length} Recorded (Reviewer Protected)</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Uploaded Evidence:</span>
                  <span className="font-semibold">{formData.evidenceFiles.length} Files Hashed</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Audio Testimony:</span>
                  <span className="font-semibold">{formData.audioEvidence ? '1 Recording Attached' : 'None'}</span>
                </div>
              </div>
            </div>

            {/* AI-Assisted Evidence Organization & Audit Flags in Step 9 */}
            {formData.aiDraftData ? (
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        AI-Assisted Report Synthesis & Audit Flags
                      </h4>
                      <p className="text-[11px] text-foreground/60">
                        {formData.aiDraftData.aiDraft?.modelName || 'Demo Intelligence Model'} • Source-Verified Citations
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Citizen Reviewed & Bound
                  </span>
                </div>

                {/* Timeline display */}
                {formData.aiDraftData.aiDraft?.timeline && (
                  <div>
                    <h5 className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider mb-2">
                      Chronological Incident Timeline:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {formData.aiDraftData.aiDraft.timeline.map((tl, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-card border border-border/60 text-xs">
                          <span className="font-bold text-primary block">{tl.timeframe}</span>
                          <span className="text-foreground/80 text-[11px] block mt-0.5">{tl.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Human Review Flags ("Worth a closer look") */}
                {formData.aiDraftData.aiDraft?.humanReviewFlags && formData.aiDraftData.aiDraft.humanReviewFlags.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <h5 className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🚩</span> Human-Review Advisory Flags ({formData.aiDraftData.aiDraft.humanReviewFlags.length}):
                    </h5>
                    {formData.aiDraftData.aiDraft.humanReviewFlags.map((flag) => (
                      <div key={flag.id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground">{flag.title}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            {flag.recommendation}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground/70">{flag.reason}</p>
                        <p className="text-[10px] text-foreground/50 italic">{flag.neverProofNotice}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-card border border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs text-foreground/70">
                    Want AI to extract verifiable citations, timelines, and audit flags before submitting?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiAssistant(true)}
                  className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold border border-primary/20 transition-all whitespace-nowrap"
                >
                  ✨ Run AI Evidence Synthesizer
                </button>
              </div>
            )}

            {/* Simulated OTP Verification Section */}
            <div className="p-5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 space-y-3">
              <div className="flex items-center space-x-2 text-sky-800 dark:text-sky-300 font-bold text-xs uppercase tracking-wider">
                <Smartphone className="w-4 h-4" />
                <span>Simulated Citizen Mobile Verification (OTP)</span>
              </div>

              {formData.otpVerified ? (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mobile Number {formData.otpMobile} Verified via Demo OTP ✓</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={formData.otpMobile}
                      onChange={(e) => setFormData({ ...formData, otpMobile: e.target.value })}
                      placeholder="Enter 10-digit mobile number"
                      className={`flex-1 p-3 rounded-xl text-xs border ${isDark ? 'glass-input-dark' : 'glass-input-light'}`}
                    />
                    <Button size="sm" variant="outline" onClick={handleSendOtp}>
                      {formData.otpSent ? 'Resend OTP' : 'Send Demo OTP'}
                    </Button>
                  </div>

                  {formData.otpSent && (
                    <div className="flex flex-col sm:flex-row gap-2 animate-in fade-in">
                      <input
                        type="text"
                        value={formData.otpCode}
                        onChange={(e) => setFormData({ ...formData, otpCode: e.target.value })}
                        placeholder="Enter 6-digit OTP (Demo: 112233)"
                        className={`flex-1 p-3 rounded-xl text-xs border font-mono tracking-widest ${isDark ? 'glass-input-dark' : 'glass-input-light'}`}
                      />
                      <Button size="sm" variant="primary" onClick={handleVerifyOtp}>
                        Verify OTP
                      </Button>
                    </div>
                  )}

                  {errors.otp && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {errors.otp}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Whistleblower / Anonymous Mode Checkbox */}
            <div className="flex items-center space-x-3 p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
              <input
                type="checkbox"
                id="wizardAnonCheck"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="w-4 h-4 rounded text-[#0F4C81] cursor-pointer"
              />
              <label htmlFor="wizardAnonCheck" className="text-xs font-semibold cursor-pointer">
                <strong>Statutory Whistleblower Mode:</strong> Mask my identity and contact info from the accused department during initial triage.
              </label>
            </div>

            {/* Mandatory Statutory Declaration */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="declarationCheck"
                  checked={formData.declarationAgreed}
                  onChange={(e) => {
                    setFormData({ ...formData, declarationAgreed: e.target.checked });
                    setErrors({ ...errors, declaration: null });
                  }}
                  className="w-4 h-4 rounded text-[#0F4C81] mt-0.5 cursor-pointer"
                />
                <label htmlFor="declarationCheck" className="text-xs leading-relaxed cursor-pointer">
                  <strong>Statutory Declaration:</strong> I solemnly affirm that the facts stated in this grievance are true to the best of my personal knowledge, belief, and documentation. I understand this platform is a simulated civic demonstration environment.
                </label>
              </div>
              {errors.declaration && (
                <p className="text-xs text-red-500 pl-7 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {errors.declaration}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button variant="outline" onClick={handleBack} icon={ChevronLeft}>
                {t('wizardPrev')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : `${t('wizardSubmit')} →`}
              </Button>
            </div>
          </GlassCard>
        )}

        {/* =========================================================================
            STEP 10: Confirmation, Ticket Details & Applicable Deadlines
            ========================================================================= */}
        {currentStep === 10 && submittedComplaint && (
          <GlassCard isDark={isDark} className="text-center py-8 px-6 sm:px-10 space-y-6 animate-in fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <Badge variant="success" size="lg" dot>Grievance Filed & Sealed</Badge>
              <h2 className="text-2xl sm:text-3xl font-black mt-2">Complaint Successfully Registered!</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
                Your complaint has been timestamped and anchored to the CitizenConnect autonomous escalation engine.
              </p>
            </div>

            {/* Case Details Box */}
            <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-3 max-w-2xl mx-auto text-xs sm:text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500">Unique Complaint ID:</span>
                <span className="font-mono font-black text-lg text-[#E06820]">
                  {submittedComplaint.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Submission Timestamp (IST):</span>
                <span className="font-semibold">{new Date().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Responsible Office:</span>
                <span className="font-semibold">{submittedComplaint.officeLocation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Assigned Department:</span>
                <span className="font-semibold">{submittedComplaint.department}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Confidential Witnesses:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-300">
                  {submittedComplaint.witnesses?.length || 0} Sealed in Reviewer Vault
                </span>
              </div>
            </div>

            {/* Applicable Statutory Deadlines */}
            <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Applicable Statutory Escalation Schedule:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-amber-500/20">
                  <div className="font-bold text-sky-600 dark:text-sky-300">Level 1: Ward GRO</div>
                  <div className="text-[11px] text-slate-500">7 Working Days</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-amber-500/20">
                  <div className="font-bold text-amber-600 dark:text-amber-300">Level 2: Appellate</div>
                  <div className="text-[11px] text-slate-500">15 Working Days</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-amber-500/20">
                  <div className="font-bold text-purple-600 dark:text-purple-300">Level 3: Lokayukta</div>
                  <div className="text-[11px] text-slate-500">30 Working Days</div>
                </div>
              </div>
            </div>

            {/* Immutability Notice */}
            <p className="text-[11px] text-slate-400 max-w-lg mx-auto">
              🔒 <strong>Immutability Guarantee:</strong> In-place editing and deletion are structurally prohibited. If you need to add details later, submit a supplemental record from the tracker.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              <Button
                variant="primary"
                onClick={() => navigate('/track')}
              >
                Track Escalation Timeline →
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/citizen-dashboard')}
              >
                Go to Citizen Dashboard
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSubmittedComplaint(null);
                  setCurrentStep(1);
                  setFormData({
                    category: '',
                    department: '',
                    departmentId: '',
                    officeLocation: '',
                    incidentDate: new Date().toISOString().split('T')[0],
                    incidentTime: '11:00 AM',
                    locationDetails: '',
                    description: '',
                    officialNamed: '',
                    officialRole: '',
                    witnesses: [],
                    evidenceFiles: [],
                    audioEvidence: null,
                    isAnonymous: false,
                    otpMobile: '+91 98765 43210',
                    otpCode: '',
                    otpSent: false,
                    otpVerified: false,
                    declarationAgreed: false,
                  });
                }}
              >
                File Another Complaint
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
