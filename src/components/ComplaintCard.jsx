import React, { useState, useRef } from 'react';
import {
  Send,
  User,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { getTranslation } from '../i18n/translations';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function ComplaintCard({
  isDark: propIsDark,
  currentLang: propCurrentLang,
  onComplaintSubmitted,
}) {
  const { isDark: contextIsDark } = useTheme();
  const { currentLang: contextLang, t } = useLanguage();

  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const currentLang = propCurrentLang || contextLang || 'en';
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const fileInputRef = useRef(null);

  const departments = [
    'Municipal Corporation & Civic Services',
    'Public Works Department (PWD)',
    'Revenue & Land Administration',
    'Electricity & Power Distribution (DISCOM)',
    'Water Supply & Sewerage Board',
    'Transport & Traffic Authority',
    'Police & Law Enforcement Oversight',
    'Health & Family Welfare',
    'Education & Universities',
    'Consumer Affairs & Ration',
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          attachment: 'File size must be under 10MB',
        }));
        return;
      }
      setAttachment(file);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.attachment;
        return next;
      });
    }
  };

  const removeAttachment = (e) => {
    e.stopPropagation();
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const newErrors = {};
    if (!department) {
      newErrors.department = 'Please select a department';
    }
    if (!description.trim()) {
      newErrors.description = 'Please describe your complaint';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedId = `CC-2026-IND-${Math.floor(10000 + Math.random() * 90000)}`;
      setTrackingId(generatedId);
      setIsSubmitting(false);
      setSubmitSuccess(true);

      const record = {
        id: generatedId,
        department,
        description,
        attachmentName: attachment ? attachment.name : null,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        status: 'Level 1: Grievance Officer Assigned',
        escalationDaysRemaining: 7,
      };

      if (onComplaintSubmitted) {
        onComplaintSubmitted(record);
      }
    }, 600);
  };

  const handleReset = () => {
    setDepartment('');
    setDescription('');
    setAttachment(null);
    setErrors({});
    setSubmitSuccess(false);
  };

  return (
    <div
      className={`w-full max-w-[430px] rounded-3xl p-5 sm:p-6 transition-all duration-300 relative select-text shadow-2xl ${
        isDark ? 'glass-panel-dark' : 'glass-panel-light'
      }`}
    >
      {/* Card Header matching reference: circular blue icon + title + subtitle */}
      <div className="flex items-center space-x-3.5 mb-4">
        <div className="w-11 h-11 rounded-full bg-[#0F4C81] flex items-center justify-center text-white shadow-md flex-shrink-0">
          <Send className="w-4 h-4 fill-white/20 -rotate-12 translate-x-0.5" />
        </div>
        <div className="flex flex-col">
          <h2
            className={`text-xl sm:text-[21px] font-bold tracking-tight transition-colors ${
              isDark ? 'text-white' : 'text-[#0E1B33]'
            }`}
          >
            {getTranslation(currentLang, 'cardTitle')}
          </h2>
          <span
            className={`text-[13px] font-normal transition-colors ${
              isDark ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {getTranslation(currentLang, 'cardSubtitle')}
          </span>
        </div>
      </div>

      {submitSuccess ? (
        /* Confirmation State */
        <div className="py-4 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3
              className={`text-lg font-bold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Complaint Submitted
            </h3>
            <p
              className={`text-xs mt-1 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Indexed on time-bound citizen escalation ledger.
            </p>
          </div>

          <div
            className={`w-full p-3.5 rounded-2xl border flex flex-col items-center justify-center ${
              isDark
                ? 'bg-slate-900/60 border-slate-700/60'
                : 'bg-white/80 border-slate-200'
            }`}
          >
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Tracking Reference Code
            </span>
            <span className="text-lg font-black text-[#E06820] tracking-wide mt-0.5 font-mono">
              {trackingId}
            </span>
            <span
              className={`text-[11px] mt-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Statutory Escalation Window: 7 Working Days
            </span>
          </div>

          <div className="flex space-x-3 w-full pt-1">
            <button
              onClick={handleReset}
              className={`flex-1 py-2.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Submit Another
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(trackingId);
                alert(`Tracking ID ${trackingId} copied!`);
              }}
              className="flex-1 py-2.5 rounded-full text-xs font-semibold btn-primary-gradient text-white cursor-pointer"
            >
              Copy ID
            </button>
          </div>
        </div>
      ) : (
        /* Form matching Screenshot Exactly */
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Field 1: Select Department (User icon on left) */}
          <div>
            <div
              className={`relative flex items-center rounded-2xl transition-all ${
                isDark ? 'glass-input-dark' : 'glass-input-light'
              } ${errors.department ? 'border-rose-500' : ''}`}
            >
              <User
                className={`w-4 h-4 ml-4 mr-2.5 flex-shrink-0 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  if (errors.department) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.department;
                      return next;
                    });
                  }
                }}
                className={`w-full py-3 pr-9 text-[13.5px] font-normal bg-transparent focus:outline-none appearance-none cursor-pointer ${
                  !department
                    ? isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                    : isDark
                    ? 'text-white font-medium'
                    : 'text-slate-900 font-medium'
                }`}
              >
                <option value="" disabled className={isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700'}>
                  {getTranslation(currentLang, 'cardSelectDept')}
                </option>
                {departments.map((dep) => (
                  <option
                    key={dep}
                    value={dep}
                    className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}
                  >
                    {dep}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`w-4 h-4 absolute right-4 pointer-events-none ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
            </div>
            {errors.department && (
              <span className="text-[11px] text-rose-500 mt-1 ml-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.department}
              </span>
            )}
          </div>

          {/* Field 2: Describe your complaint... (FileText icon on left) */}
          <div>
            <div
              className={`relative flex items-start rounded-2xl p-3 transition-all ${
                isDark ? 'glass-input-dark' : 'glass-input-light'
              } ${errors.description ? 'border-rose-500' : ''}`}
            >
              <FileText
                className={`w-4 h-4 mr-2.5 mt-0.5 flex-shrink-0 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.description;
                      return next;
                    });
                  }
                }}
                placeholder={getTranslation(currentLang, 'cardDescribePlaceholder')}
                className={`w-full text-[13.5px] font-normal bg-transparent focus:outline-none resize-none placeholder:font-normal leading-relaxed ${
                  isDark
                    ? 'text-white placeholder:text-slate-400'
                    : 'text-slate-900 placeholder:text-slate-500'
                }`}
              />
            </div>
            {errors.description && (
              <span className="text-[11px] text-rose-500 mt-1 ml-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description}
              </span>
            )}
          </div>

          {/* Field 3: Attach documents (optional) (Paperclip icon on left) */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-all cursor-pointer ${
                isDark ? 'glass-input-dark' : 'glass-input-light'
              }`}
            >
              <div className="flex items-center min-w-0 flex-1">
                <Paperclip
                  className={`w-4 h-4 mr-2.5 flex-shrink-0 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                />
                <span
                  className={`text-[13.5px] truncate ${
                    attachment
                      ? isDark
                        ? 'text-sky-300 font-medium'
                        : 'text-sky-700 font-medium'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  {attachment ? attachment.name : getTranslation(currentLang, 'cardAttachOptional')}
                </span>
              </div>

              {attachment && (
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="p-1 rounded-full hover:bg-slate-500/20 text-slate-400 hover:text-rose-500 cursor-pointer ml-2"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {errors.attachment && (
              <span className="text-[11px] text-rose-500 mt-1 ml-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.attachment}
              </span>
            )}
          </div>

          {/* Field 4: Submit Complaint Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary-gradient py-3.5 rounded-full text-white font-semibold text-[15px] flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/20 active:scale-[0.98] cursor-pointer mt-1 disabled:opacity-75"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              <>
                <span>{getTranslation(currentLang, 'cardSubmitBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
