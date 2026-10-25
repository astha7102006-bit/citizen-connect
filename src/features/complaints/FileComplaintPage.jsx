import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import {
  Send,
  Building2,
  User,
  Shield,
  Calendar,
  MapPin,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FileComplaintPage() {
  const { isDark } = useTheme();
  const { currentLang, t } = useLanguage();
  const { departments, submitComplaint } = useData();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    department: '',
    officialNamed: '',
    officeLocation: '',
    severity: 'Medium',
    incidentDate: '',
    description: '',
    isAnonymous: false,
    attachment: null,
  });

  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.department) errs.department = 'Department is required';
    if (!form.title.trim()) errs.title = 'Title / Subject is required';
    if (!form.description.trim() || form.description.trim().length < 15) {
      errs.description = 'Please provide detailed complaint statement (min 15 characters)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');
    try {
      const record = await submitComplaint({
        title: form.title,
        department: form.department,
        officialNamed: form.officialNamed || 'Field Inspection Officer',
        officeLocation: form.officeLocation || 'Zonal Administrative Office',
        severity: form.severity,
        description: form.description,
        isAnonymous: form.isAnonymous,
        attachmentName: form.attachment ? form.attachment.name : null,
      });

      setIsSubmitting(false);
      setSubmittedRecord(record);
    } catch (err) {
      setIsSubmitting(false);
      setApiError(err.message || 'Submission failed. Please check your connection and try again.');
    }
  };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8">
      <PageHeader
        title={t('btnFileComplaint')}
        subtitle={t('heroDescription')}
        badge={<Badge variant="saffron" dot>{t('feat3Title')}</Badge>}
        breadcrumbs={[{ label: t('navHome') }, { label: t('navFileComplaint') }]}
        isDark={isDark}
      />

      {submittedRecord ? (
        <GlassCard isDark={isDark} className="max-w-2xl mx-auto text-center py-10 px-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Complaint Successfully Registered!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Your grievance has been entered into the CitizenConnect immutable tracker.
          </p>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left mb-6 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Tracking Reference ID:</span>
              <span className="font-mono font-bold text-[#E06820] text-base">
                {submittedRecord.id}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold">{submittedRecord.department}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Level 1 SLA Deadline:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">7 Working Days</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="primary"
              onClick={() => navigate('/track')}
            >
              Track Escalation Timeline →
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSubmittedRecord(null);
                setForm({
                  title: '',
                  department: '',
                  officialNamed: '',
                  officeLocation: '',
                  severity: 'Medium',
                  incidentDate: '',
                  description: '',
                  isAnonymous: false,
                  attachment: null,
                });
              }}
            >
              File Another Complaint
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <GlassCard isDark={isDark}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Department / Ministry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                      isDark ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  >
                    <option value="">Select Government Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.department}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Subject / Summary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Brief headline describing the grievance"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                      isDark ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Official / Designation (If known)
                    </label>
                    <input
                      type="text"
                      value={form.officialNamed}
                      onChange={(e) => setForm({ ...form, officialNamed: e.target.value })}
                      placeholder="e.g. Ward Inspector, Executive Engineer"
                      className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                        isDark ? 'glass-input-dark' : 'glass-input-light'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Office Location / District
                    </label>
                    <input
                      type="text"
                      value={form.officeLocation}
                      onChange={(e) => setForm({ ...form, officeLocation: e.target.value })}
                      placeholder="e.g. Civil Lines, Zone 4"
                      className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                        isDark ? 'glass-input-dark' : 'glass-input-light'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Detailed Statement & Facts <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe specific dates, actions, demands, and violations. Mention if notices were refused or statutory procedures were bypassed."
                    className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] resize-none ${
                      isDark ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3 p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
                  <input
                    type="checkbox"
                    id="anonymousCheck"
                    checked={form.isAnonymous}
                    onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0F4C81] cursor-pointer"
                  />
                  <label htmlFor="anonymousCheck" className="text-xs sm:text-sm font-medium cursor-pointer">
                    <strong>Whistleblower / Anonymous Mode:</strong> Mask my identity from the accused department during initial triage.
                  </label>
                </div>

                {apiError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  {isSubmitting ? 'Registering with Escalation Guarantee...' : 'Submit Grievance →'}
                </Button>
              </form>
            </GlassCard>
          </div>

          {/* Right Column: Information & Guarantees */}
          <div className="space-y-6">
            <GlassCard isDark={isDark}>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                The Anti-Vanishing Guarantee
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Traditional complaint portals allow files to sit indefinitely in departmental backlogs. CitizenConnect binds every complaint to statutory escalation clocks.
              </p>

              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-500 font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <span><strong>Level 1 (7 Days):</strong> Assigned to the designated Ward Grievance Redressal Officer.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center flex-shrink-0">2</span>
                  <span><strong>Level 2 (15 Days):</strong> If unresolved, automatically triggers First Appellate Authority notice.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-500 font-bold flex items-center justify-center flex-shrink-0">3</span>
                  <span><strong>Level 3 (30 Days):</strong> Direct statutory escalation to State Lokayukta / Anti-Corruption Bureau.</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard isDark={isDark}>
              <h4 className="font-bold text-sm mb-2 text-[#E06820]">Free Legal Assistance</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Need guidance on citing sections or filing under Right to Information (RTI)?
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/legal-help')}
              >
                Access Free Legal Aid Panel →
              </Button>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
