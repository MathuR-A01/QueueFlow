"use client";

import { useState } from "react";
import { X, Copy, Check, Zap, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ASK_TYPE_LABELS, COUNTERPARTY_ICONS } from "@/lib/constants";
import type { AskType, CounterpartyType } from "@/lib/constants";
import type { WaitingItemWithFollowUps } from "@/types";

interface NudgeVariant {
  tone: string;
  message: string;
}

interface NudgeModalProps {
  item: WaitingItemWithFollowUps;
  onClose: () => void;
  onFollowUpLogged: (
    followUp: {
      id: string;
      date: string;
      channel: string;
      draftedByAi: boolean;
      notes: string | null;
      waitingItemId: string;
    },
    parentItem?: any
  ) => void;
  onFollowUpDeleted: (updatedItem: WaitingItemWithFollowUps) => void;
}

export default function NudgeModal({
  item,
  onClose,
  onFollowUpLogged,
  onFollowUpDeleted,
}: NudgeModalProps) {
  const [variants, setVariants] = useState<NudgeVariant[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<NudgeVariant[] | NudgeVariant | null>(
    null
  );
  const [copiedTone, setCopiedTone] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  const lastContactDate = new Date(item.lastContactAt);
  const daysWaited = Math.max(
    0,
    Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const followUpCount = item.followUps.length;

  const generateDraft = async () => {
    setIsLoading(true);
    setError("");
    setVariants(null);
    setSelectedVariant(null);

    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counterpartyName: item.counterpartyName,
          counterpartyType: item.counterpartyType,
          askType: item.askType,
          title: item.title,
          daysWaited,
          followUpCount,
          notes: item.notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate draft");

      const data = await res.json();
      setVariants(data.variants);
      setIsFallback(data.fallback === true);
      if (data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
    } catch (err) {
      setError("Failed to generate draft. Check your API key or try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (variant: NudgeVariant) => {
    await navigator.clipboard.writeText(variant.message);
    setCopiedTone(variant.tone);
    setTimeout(() => setCopiedTone(null), 2000);
  };

  const handleLogFollowUp = async () => {
    // If selectedVariant is array or null, we check type
    const variantObj = Array.isArray(selectedVariant) ? selectedVariant[0] : selectedVariant;
    if (!variantObj) return;
    setIsLogging(true);

    try {
      const res = await fetch(`/api/items/${item.id}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          draftedByAi: !isFallback,
          notes: `${variantObj.tone} tone: "${variantObj.message.substring(0, 80)}..."`,
          recipientEmail: recipientEmail.trim() || undefined,
          emailBody: variantObj.message,
        }),
      });

      if (!res.ok) throw new Error("Failed to log follow-up");

      const data = await res.json();
      onFollowUpLogged(data.followUp, data.parentItem);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogging(false);
    }
  };

  const toneClasses: Record<string, string> = {
    Warm: "tone-warm",
    Neutral: "tone-neutral",
    Firm: "tone-firm",
  };

  return (
    <div className="drawer-overlay">
      <div
        className="drawer drawer-wide"
        role="dialog"
        aria-modal="true"
        aria-label="Draft follow-up"
      >
        <div className="drawer-header">
          <div>
            <div className="drawer-title">Draft Follow-up</div>
            <div className="drawer-subtitle">
              {COUNTERPARTY_ICONS[item.counterpartyType as CounterpartyType]}{" "}
              {item.counterpartyName} ·{" "}
              {ASK_TYPE_LABELS[item.askType as AskType]} ·{" "}
              {followUpCount > 0
                ? `${followUpCount} prior follow-up${followUpCount > 1 ? "s" : ""}`
                : "First follow-up"}
            </div>
          </div>
          <button
            className="drawer-close"
            onClick={onClose}
            id="btn-nudge-modal-close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Context summary */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <div className="info-row" style={{ flex: 1, minWidth: "120px" }}>
              <span className="info-row-label">Days waited</span>
              <span className="info-row-value">{daysWaited}d</span>
            </div>
            <div className="info-row" style={{ flex: 1, minWidth: "120px" }}>
              <span className="info-row-label">Follow-ups</span>
              <span className="info-row-value">{followUpCount}</span>
            </div>
            <div className="info-row" style={{ flex: 1, minWidth: "120px" }}>
              <span className="info-row-label">Expected by</span>
              <span className="info-row-value">
                {item.expectedBy
                  ? format(new Date(item.expectedBy), "MMM d")
                  : "Not set"}
              </span>
            </div>
          </div>

          {/* Generate button */}
          {!variants && !isLoading && (
            <button
              id="btn-generate-draft"
              className="btn-primary"
              onClick={generateDraft}
              style={{ width: "100%", justifyContent: "center", gap: "8px" }}
            >
              <Zap size={14} />
              Generate Follow-up Drafts
            </button>
          )}

          {/* Loading state */}
          {isLoading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                padding: "20px",
                color: "var(--text-muted)",
                fontSize: "13px",
              }}
            >
              <div className="spinner" style={{ width: 24, height: 24 }} />
              <span>Drafting tone variants...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                fontSize: "12px",
                color: "#fb7185",
                background: "rgba(225,29,72,0.08)",
                border: "1px solid rgba(225,29,72,0.2)",
                borderRadius: "6px",
                padding: "8px 12px",
              }}
            >
              {error}
            </div>
          )}

          {/* Variants */}
          {variants && (
            <>
              {isFallback && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    padding: "6px 10px",
                  }}
                >
                  💡 Using built-in templates (add ANTHROPIC_API_KEY for AI-generated drafts)
                </div>
              )}

              <div className="nudge-variants">
                {variants.map((variant) => (
                  <button
                    key={variant.tone}
                    id={`btn-variant-${variant.tone.toLowerCase()}`}
                    className={`nudge-variant ${selectedVariant?.tone === variant.tone ? "selected" : ""}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <div className="nudge-tone-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div className={`nudge-tone ${toneClasses[variant.tone] || ""}`}>
                        {variant.tone === "Warm" && "🌿"}{" "}
                        {variant.tone === "Neutral" && "💼"}{" "}
                        {variant.tone === "Firm" && "🎯"}{" "}
                        {variant.tone}
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          id={`btn-copy-${variant.tone.toLowerCase()}`}
                          className="btn-ghost"
                          style={{ fontSize: "10px", padding: "2px 6px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(variant);
                          }}
                        >
                          {copiedTone === variant.tone ? (
                            <>
                              <Check size={10} />
                              <span className="copy-success">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={10} />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          id={`btn-wa-${variant.tone.toLowerCase()}`}
                          className="btn-ghost"
                          style={{ fontSize: "10px", padding: "2px 6px", color: "#22c55e", borderColor: "rgba(34, 197, 94, 0.2)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const waUrl = `https://wa.me/?text=${encodeURIComponent(variant.message)}`;
                            window.open(waUrl, "_blank");
                          }}
                          title="Send draft message via WhatsApp"
                        >
                          🟢 WhatsApp
                        </button>
                      </div>
                    </div>
                    <div className="nudge-message">{variant.message}</div>
                  </button>
                ))}
              </div>

              <button
                id="btn-regenerate"
                className="btn-secondary"
                onClick={generateDraft}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                Regenerate
              </button>
            </>
          )}

          {/* Automated Email Dispatch Section */}
          {variants && (
            <div style={{ marginTop: "20px", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>✉️</span> Automated Email Dispatch (via Resend)
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="form-label" htmlFor="input-recipient-email" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  Recipient Email Address (Optional)
                </label>
                <input
                  id="input-recipient-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. contact@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  style={{ fontSize: "12px", padding: "8px 12px" }}
                />
                <span className="form-hint" style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Provide an email to automatically send the selected draft tone via Resend integration. Leave blank to log follow-up without sending.
                </span>
              </div>
            </div>
          )}

          {/* Prior Follow-up History */}
          {item.followUps && item.followUps.length > 0 && (
            <div style={{ marginTop: "24px", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📜</span> Prior Follow-up History ({item.followUps.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                {item.followUps.map((fu) => (
                  <div
                    key={fu.id}
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, paddingRight: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: "600", color: "var(--text-secondary)" }}>
                          📧 Email Sent
                        </span>
                        {fu.draftedByAi && (
                          <span style={{ fontSize: "9px", background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", padding: "1px 6px", borderRadius: "99px", fontWeight: "600" }}>
                            AI Drafted
                          </span>
                        )}
                        <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                          {format(new Date(fu.date), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                      {fu.notes && (
                        <div style={{ color: "var(--text-muted)", fontStyle: "italic", lineHeight: "1.4", wordBreak: "break-word" }}>
                          {fu.notes}
                        </div>
                      )}
                    </div>
                    <button
                      id={`btn-delete-followup-${fu.id}`}
                      className="btn-ghost"
                      style={{ color: "#f43f5e", padding: "4px 8px", fontSize: "11px", height: "auto", minWidth: "fit-content" }}
                      onClick={async (e) => {
                        e.stopPropagation();
                         if (confirm("Are you sure you want to delete this follow-up record? This will recalculate the card's last contact time.")) {
                           try {
                             const res = await fetch(`/api/items/${item.id}/followup`, {
                               method: "DELETE",
                               headers: { "Content-Type": "application/json" },
                               body: JSON.stringify({ followUpId: fu.id }),
                             });
                             if (!res.ok) throw new Error("Failed to delete follow-up");
                             const data = await res.json();
                             if (data.parentItem) {
                               const mappedItem = {
                                 ...data.parentItem,
                                 createdAt: new Date(data.parentItem.createdAt),
                                 lastContactAt: new Date(data.parentItem.lastContactAt),
                                 expectedBy: data.parentItem.expectedBy ? new Date(data.parentItem.expectedBy) : null,
                                 followUps: data.parentItem.followUps.map((f: any) => ({ ...f, date: new Date(f.date) })),
                               };
                               onFollowUpDeleted(mappedItem);
                             }
                           } catch (err) {
                             console.error("Delete follow-up error:", err);
                           }
                         }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            id="btn-nudge-cancel"
          >
            Cancel
          </button>
          {variants && (
            <button
              id="btn-log-followup"
              className="btn-primary"
              onClick={handleLogFollowUp}
              disabled={(!selectedVariant || Array.isArray(selectedVariant) && selectedVariant.length === 0) || isLogging}
            >
              {isLogging ? (
                <>
                  <Loader2 size={13} className="spinner" />
                  {recipientEmail.trim() ? "Sending & Logging..." : "Logging..."}
                </>
              ) : recipientEmail.trim() ? (
                "Send Email & Log Follow-up"
              ) : (
                "Log Follow-up & Close"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
