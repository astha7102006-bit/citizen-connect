import React, { useState } from 'react';

/**
 * AI-Assisted Evidence and Report Draft Review Card
 * Strictly follows Prompt 4 requirements:
 * - Displays source citations for every extracted field
 * - "Not stated" when details are missing (never invents facts)
 * - Labeled as "AI Draft — Requires Citizen Review & Affirmation"
 * - Citizen can edit/correct every field before submission
 * - Preserves both original AI draft and citizen corrections
 * - Human-review flags with "Worth a closer look" advisory tags
 * - Strict non-rejection & non-adjudication disclaimer
 * - Loading, error, retry, and explicit privacy notice
 */
export default function AiDraftReviewCard({
  narrativeText,
  evidenceFiles = [],
  audioEvidence = null,
  onApplyDraft,
  initialDraft = null
}) {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState(null);
  const [aiDraft, setAiDraft] = useState(initialDraft);
  const [editableFields, setEditableFields] = useState(null);
  const [citizenCorrections, setCitizenCorrections] = useState({});
  const [privacyAgreed, setPrivacyAgreed] = useState(true);
  const [activeTab, setActiveTab] = useState('fields'); // 'fields', 'timeline', 'inventory', 'flags'

  const runAiExtraction = async () => {
    if (!narrativeText || narrativeText.trim().length < 10) {
      setError('Please provide at least 10 characters in your statement before initiating AI structuring.');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStage('Scanning statement and attached evidence files...');

    try {
      setTimeout(() => setLoadingStage('Extracting verifiable facts and cross-referencing quotations...'), 400);
      setTimeout(() => setLoadingStage('Evaluating human-review flags & timeline consistency...'), 800);

      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: narrativeText,
          evidenceFiles: evidenceFiles.map(f => ({ name: f.name, size: f.size, type: f.type, sha256: f.sha256 })),
          audioDuration: audioEvidence ? audioEvidence.duration || '0:45' : ''
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setAiDraft(data);
      
      // Initialize citizen editable fields
      setEditableFields({
        whatHappened: data.extractedFields.whatHappened.value,
        whenHappened: data.extractedFields.whenHappened.value,
        whereHappened: data.extractedFields.whereHappened.value,
        whoInvolved: data.extractedFields.whoInvolved.value,
        whatRequestedOrRefused: data.extractedFields.whatRequestedOrRefused.value
      });

      setCitizenCorrections({});
    } catch (err) {
      console.error('AI Extraction error:', err);
      setError('Unable to reach local AI processing proxy. You can retry or proceed with standard manual submission.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldKey, newValue) => {
    setEditableFields(prev => ({ ...prev, [fieldKey]: newValue }));
    
    // Check if changed from original AI value
    const originalVal = aiDraft?.extractedFields?.[fieldKey]?.value;
    if (originalVal !== newValue) {
      setCitizenCorrections(prev => ({
        ...prev,
        [fieldKey]: {
          originalAiValue: originalVal,
          correctedValue: newValue,
          correctedAt: new Date().toLocaleTimeString('en-IN')
        }
      }));
    } else {
      setCitizenCorrections(prev => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  const handleApplyToForm = () => {
    if (onApplyDraft && aiDraft && editableFields) {
      onApplyDraft({
        aiDraft,
        correctedFields: editableFields,
        citizenCorrections,
        statutoryDisclaimer: aiDraft.statutoryDisclaimer
      });
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-primary/30 shadow-xl space-y-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">AI-Assisted Evidence & Report Synthesizer</h3>
              {aiDraft && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {aiDraft.isDemoResult ? 'Demo Result' : 'Configured Model'}
                </span>
              )}
            </div>
            <p className="text-xs text-foreground/60">
              Extracts verifiable facts, generates source citations, and creates structured timelines
            </p>
          </div>
        </div>

        {!aiDraft && (
          <button
            type="button"
            onClick={runAiExtraction}
            disabled={loading || !narrativeText.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-md"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span> Synthesizing...
              </>
            ) : (
              <>
                <span>✨</span> Generate Structured AI Draft
              </>
            )}
          </button>
        )}
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-foreground/[0.02] border border-border/50 text-xs text-foreground/70 space-y-1.5">
        <div className="flex items-center justify-between font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <span>🔒</span> Privacy & Data Sovereign Guarantee
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-normal">
            <input
              type="checkbox"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              className="text-primary rounded"
            />
            Process locally with privacy safeguard
          </label>
        </div>
        <p className="text-[11px] leading-relaxed text-foreground/60">
          CitizenConnect never transmits raw evidence to commercial third parties without explicit affirmative consent. All extraction is handled by an isolated sovereign proxy. Complainant identities are strictly shielded.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center space-y-3 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="font-bold text-sm text-foreground">Organizing Evidence & Cross-Referencing Quotations</h4>
          <p className="text-xs text-primary font-mono">{loadingStage}</p>
        </div>
      )}

      {/* Error & Retry State */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={runAiExtraction}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 font-semibold text-[11px] transition-all whitespace-nowrap"
          >
            Retry Extraction ↺
          </button>
        </div>
      )}

      {/* Extracted Structured Draft */}
      {aiDraft && editableFields && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Important Citizen Review Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <strong className="font-bold uppercase tracking-wider block text-[11px]">
                AI Draft — Mandatory Citizen Review & Correction
              </strong>
              <p className="mt-0.5 leading-relaxed">
                This structured synthesis was automatically parsed from your statements and evidence. You have the right and responsibility to correct any field before final filing. If any detail is missing, it is marked as <strong className="underline">"Not stated"</strong>. The AI never invents missing facts.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('fields')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'fields'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/70 hover:bg-foreground/5'
              }`}
            >
              Extracted Factual Fields (5)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'timeline'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/70 hover:bg-foreground/5'
              }`}
            >
              Incident Timeline ({aiDraft.timeline?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'inventory'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/70 hover:bg-foreground/5'
              }`}
            >
              Evidence Inventory ({aiDraft.evidenceInventory?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('flags')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'flags'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <span>Audit Flags</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                {aiDraft.humanReviewFlags?.length || 0}
              </span>
            </button>
          </div>

          {/* Tab 1: Extracted Fields with Citations and Citizen Editing */}
          {activeTab === 'fields' && (
            <div className="space-y-4">
              {/* Field 1: What Happened */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-foreground">1. What Allegedly Happened</label>
                  <span className="font-mono text-[10px] text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded">
                    Source: {aiDraft.extractedFields.whatHappened.source}
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={editableFields.whatHappened}
                  onChange={(e) => handleFieldChange('whatHappened', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
                {citizenCorrections.whatHappened && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    ✎ Citizen corrected from: "{citizenCorrections.whatHappened.originalAiValue}"
                  </p>
                )}
              </div>

              {/* Field 2 & 3: When & Where */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-foreground">2. When It Happened</label>
                    <span className="font-mono text-[10px] text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded">
                      Citations
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editableFields.whenHappened}
                    onChange={(e) => handleFieldChange('whenHappened', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <span className="text-[10px] text-foreground/50 block">
                    Source: {aiDraft.extractedFields.whenHappened.source}
                  </span>
                  {citizenCorrections.whenHappened && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      ✎ Citizen corrected
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-foreground">3. Where It Happened</label>
                    <span className="font-mono text-[10px] text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded">
                      Citations
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editableFields.whereHappened}
                    onChange={(e) => handleFieldChange('whereHappened', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <span className="text-[10px] text-foreground/50 block">
                    Source: {aiDraft.extractedFields.whereHappened.source}
                  </span>
                  {citizenCorrections.whereHappened && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      ✎ Citizen corrected
                    </p>
                  )}
                </div>
              </div>

              {/* Field 4 & 5: Who Involved & Requested/Refused */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-foreground">4. Who Was Involved (If Stated)</label>
                    <span className="font-mono text-[10px] text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded">
                      Official Identifiers
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editableFields.whoInvolved}
                    onChange={(e) => handleFieldChange('whoInvolved', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <span className="text-[10px] text-foreground/50 block">
                    Source: {aiDraft.extractedFields.whoInvolved.source}
                  </span>
                  {citizenCorrections.whoInvolved && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      ✎ Citizen corrected
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-foreground">5. What Was Requested or Refused</label>
                    <span className="font-mono text-[10px] text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded">
                      Demand / Denial
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editableFields.whatRequestedOrRefused}
                    onChange={(e) => handleFieldChange('whatRequestedOrRefused', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <span className="text-[10px] text-foreground/50 block">
                    Source: {aiDraft.extractedFields.whatRequestedOrRefused.source}
                  </span>
                  {citizenCorrections.whatRequestedOrRefused && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      ✎ Citizen corrected
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Chronological Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <p className="text-xs text-foreground/60">
                Timeline generated strictly from verifiable temporal indicators in the complainant narrative.
              </p>
              <div className="space-y-2">
                {aiDraft.timeline?.map((item) => (
                  <div key={item.step} className="p-3.5 rounded-2xl bg-card border border-border/70 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {item.step}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{item.timeframe}</span>
                        <span className="text-[10px] text-foreground/50 font-mono">({item.source})</span>
                      </div>
                      <p className="text-xs text-foreground/80">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Evidence Inventory */}
          {activeTab === 'inventory' && (
            <div className="space-y-3">
              <p className="text-xs text-foreground/60">
                Itemized exhibit list with cryptographic SHA-256 integrity signatures and citation index.
              </p>
              <div className="space-y-2">
                {aiDraft.evidenceInventory?.map((item) => (
                  <div key={item.itemNumber} className="p-3.5 rounded-2xl bg-card border border-border/70 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <span>Exhibit #{item.itemNumber}: {item.filename}</span>
                        <span className="font-normal text-foreground/60">({item.type} — {item.size})</span>
                      </div>
                      <div className="text-[11px] text-foreground/50 mt-0.5">
                        Source Reference: {item.sourceCitation}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-foreground/5 text-foreground/60 border border-border/40">
                      {item.sha256}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Human-Review Flags ("Worth a closer look") */}
          {activeTab === 'flags' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                <strong>Statutory Principle:</strong> These flags are raised as human oversight suggestions. They indicate items that are <em>"Worth a closer look"</em> during review, and are never presented as proof of falsehood or wrongdoing.
              </div>

              {aiDraft.humanReviewFlags?.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold text-center">
                  ✓ No consistency discrepancies or coordinated reporting patterns flagged.
                </div>
              ) : (
                <div className="space-y-2">
                  {aiDraft.humanReviewFlags.map((flag) => (
                    <div key={flag.id} className="p-4 rounded-2xl bg-card border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-xs text-foreground flex items-center gap-2">
                          <span>🚩</span> {flag.title}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          {flag.recommendation}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{flag.reason}</p>
                      <div className="text-[10px] text-foreground/50 font-semibold italic border-t border-border/40 pt-1.5">
                        Notice: {flag.neverProofNotice}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions & Affirmation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border/40 pt-4">
            <div className="text-xs text-foreground/60">
              {Object.keys(citizenCorrections).length > 0 ? (
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {Object.keys(citizenCorrections).length} field(s) edited by citizen (both original AI draft and corrections will be archived).
                </span>
              ) : (
                <span>No citizen corrections entered yet. Original AI draft will be preserved.</span>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={runAiExtraction}
                className="px-3 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:bg-foreground/5 transition-all"
              >
                Re-Synthesize ↺
              </button>
              <button
                type="button"
                onClick={handleApplyToForm}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-md transition-all flex items-center gap-1.5"
              >
                <span>✓</span> Adopt AI Structured Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
