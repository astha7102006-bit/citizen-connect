import React, { useState, useEffect } from 'react';
import { verifyComplaintAuditChain, GENESIS_HASH } from '../../services/auditCrypto';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

export default function RecordVerificationModal({ complaint, isOpen, onClose }) {
  const { role, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { tamperComplaintRecord, restoreComplaintRecord, verifyRealComplaintTimeline } = useData();

  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleRunVerification = async () => {
    if (!complaint) return;
    setVerifying(true);
    setVerificationResult(null);

    const isReal = Boolean(
      complaint.isRealRecord ||
      complaint.dbId ||
      (isAuthenticated && complaint.referenceNumber)
    );
    const identifier = complaint.dbId || complaint.id || complaint.referenceNumber;

    if (isReal && verifyRealComplaintTimeline) {
      try {
        const res = await verifyRealComplaintTimeline(identifier);
        const v = res?.verification;
        if (v) {
          setVerificationResult({
            isValid: Boolean(v.isValid),
            verifiedCount: v.verifiedCount ?? 0,
            totalCount: v.totalCount ?? (complaint.auditHistory?.length || 0),
            headHash: v.headHash || null,
            error: v.error || null,
            failedIndex: v.failedIndex ?? null,
            failedSequence: v.failedSequence ?? null,
            failedEventId: v.failedEventId ?? null,
            verifiedAt: v.verifiedAt || new Date().toISOString(),
            algorithm: v.algorithm ? `SHA-256 (${v.algorithm})` : 'SHA-256 (Government Cryptographic Ledger)',
            isServerVerified: true,
          });
          setVerifying(false);
          return;
        }
      } catch (err) {
        setVerificationResult({
          isValid: false,
          error: `Audit verification failed: ${err.message || 'Unable to verify ledger.'}`,
          verifiedCount: 0,
          totalCount: complaint.auditHistory?.length || 0,
          failedIndex: 0,
          isServerVerified: true,
        });
        setVerifying(false);
        return;
      }
    }

    // Fallback for demo/offline verification
    setTimeout(async () => {
      const result = await verifyComplaintAuditChain(complaint);
      setVerificationResult(result);
      setVerifying(false);
    }, 450);
  };

  useEffect(() => {
    if (isOpen && complaint) {
      handleRunVerification();
    }
  }, [isOpen, complaint]);

  const handleTamper = (type) => {
    tamperComplaintRecord(complaint.id, type);
    setTimeout(() => {
      handleRunVerification();
    }, 150);
  };

  const handleRestore = () => {
    restoreComplaintRecord(complaint.id);
    setTimeout(() => {
      handleRunVerification();
    }, 150);
  };

  if (!isOpen || !complaint) return null;

  const history = complaint.auditHistory || [];
  const isAdmin = role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 sm:p-8 border border-border/80 shadow-2xl relative my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                🔗
              </span>
              <h2 className="text-xl font-bold text-foreground">
                {t('modalVerifyTitle')}
              </h2>
            </div>
            <p className="text-xs text-foreground/60 mt-1">
              {t('modalVerifySubtitle')} —{' '}
              <span className="font-mono font-bold text-primary">{complaint.id}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-foreground flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-6 py-4 pr-1 flex-1">
          
          {/* Verification Status Card */}
          {verifying ? (
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-foreground">Recomputing SHA-256 hashes across complete event chain...</p>
              <p className="text-xs text-foreground/50 font-mono">Verifying block links and evidence fingerprints</p>
            </div>
          ) : verificationResult ? (
            verificationResult.isValid ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <span className="text-lg">✅</span>
                    <span>Cryptographic Audit Chain 100% Valid & Untampered</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                    {verificationResult.verifiedCount} Blocks Verified
                  </span>
                </div>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                  Every sequential event block has been re-hashed from genesis ({GENESIS_HASH.substring(0, 8)}...). Previous hash pointers, deterministic JSON field serializations, and evidence fingerprints match perfectly.
                </p>
                <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between text-[11px] text-foreground/60 font-mono">
                  <span>Head Hash: {verificationResult.headHash?.substring(0, 24)}...</span>
                  <span>Algorithm: SHA-256 (W3C Web Crypto)</span>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-900 dark:text-red-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-600 dark:text-red-400">
                    <span className="text-lg">❌</span>
                    <span>TAMPER DETECTED: Chain Verification Failed!</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 font-bold">
                    Integrity Compromised
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-card border border-red-500/30 text-xs font-mono text-red-800 dark:text-red-300">
                  {verificationResult.error}
                </div>
                <p className="text-xs text-foreground/70">
                  The audit engine detected that block #{verificationResult.failedIndex + 1} ({verificationResult.failedEventId}) or an attached evidence file was modified after its hash was permanently chained.
                </p>
              </div>
            )
          ) : null}

          {/* Admin Tamper Test Console */}
          {isAdmin && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🛠️</span> Admin Demo Tamper Test Console
                </span>
                <span className="text-[10px] font-mono text-foreground/50">Admin Role Exclusive</span>
              </div>
              <p className="text-xs text-foreground/70">
                Deliberately corrupt stored data in browser storage to test tamper detection. Verification will immediately pinpoint the exact compromised entry.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleTamper('EVENT_CONTENT')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold border border-amber-500/30 transition-all"
                >
                  ⚠️ Alter Event Statement
                </button>
                <button
                  type="button"
                  onClick={() => handleTamper('PREV_HASH')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold border border-amber-500/30 transition-all"
                >
                  ⚠️ Corrupt PrevHash Link
                </button>
                <button
                  type="button"
                  onClick={() => handleTamper('EVIDENCE')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold border border-amber-500/30 transition-all"
                >
                  ⚠️ Tamper Evidence Fingerprint
                </button>
                <button
                  type="button"
                  onClick={handleRestore}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all ml-auto"
                >
                  ✓ Restore Pristine Chain
                </button>
              </div>
            </div>
          )}

          {/* Sequential Cryptographic Blocks */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70">
              Ordered Append-Only Ledger ({history.length} Event Blocks)
            </h3>

            <div className="space-y-3">
              {history.map((event, idx) => {
                const isFailedBlock =
                  verificationResult &&
                  !verificationResult.isValid &&
                  (verificationResult.failedIndex === idx ||
                    (verificationResult.failedSequence !== null &&
                      verificationResult.failedSequence !== undefined &&
                      event.sequence !== undefined &&
                      verificationResult.failedSequence === event.sequence));

                return (
                  <div
                    key={event.eventId || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isFailedBlock
                        ? 'bg-red-500/10 border-red-500/60 ring-2 ring-red-500/30'
                        : 'bg-card border-border/70 hover:border-border'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-xs font-bold text-primary">
                          {event.eventId || `EVT-${idx + 1}`}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-foreground/5 text-foreground">
                          {event.eventType || event.action || 'COMPLAINT_EVENT'}
                        </span>
                      </div>

                      <span className="text-[11px] text-foreground/50 font-mono">
                        {event.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/90 leading-relaxed mb-3">
                      {event.details}
                    </p>

                    {event.reason && (
                      <div className="p-2 rounded-lg bg-foreground/[0.03] text-[11px] text-foreground/70 mb-3 border border-border/40">
                        <strong>Reason:</strong> {event.reason}
                      </div>
                    )}

                    {/* Block Hash Inspection Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono bg-background/60 p-2.5 rounded-xl border border-border/50">
                      <div>
                        <span className="text-foreground/50 block">Previous Hash Link:</span>
                        <span className="text-foreground/80 truncate block" title={event.previousHash}>
                          {event.previousHash ? `${event.previousHash.substring(0, 20)}...` : GENESIS_HASH.substring(0, 20) + '...'}
                        </span>
                      </div>
                      <div>
                        <span className="text-foreground/50 block">Event Block Hash (SHA-256):</span>
                        <span className="text-primary font-bold truncate block" title={event.hash}>
                          {event.hash ? `${event.hash.substring(0, 20)}...` : 'Unsigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Demonstration Architecture Notice */}
          <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border/60 text-xs text-foreground/70 space-y-1.5">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span>ℹ️</span> Browser Storage Demonstration Notice
            </div>
            <p className="text-[11px] leading-relaxed text-foreground/60">
              Browser LocalStorage is used for demonstration purposes. Browser storage is not secure against a privileged user who controls the browser, Developer Tools, or local disk storage. Permanent, non-repudiable immutability requires a distributed validator network or hardened sovereign server backend.
            </p>
          </div>

        </div>

        {/* Footer CTAs */}
        <div className="border-t border-border/50 pt-4 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleRunVerification}
            disabled={verifying}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>🔄</span> Re-Verify Chain Integrity
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-card border border-border text-foreground text-xs font-medium hover:bg-muted transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
