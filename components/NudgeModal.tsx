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
}

export default function NudgeModal({
  item,
  onClose,
  onFollowUpLogged,
}: NudgeModalProps) {
  const [variants, setVariants] = useState<NudgeVariant[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<NudgeVariant | null>(
    null
  );
  const [copiedTone, setCopiedTone] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState("");

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
    if (!selectedVariant) return;
    setIsLogging(true);

    try {
      const res = await fetch(`/api/items/${item.id}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          draftedByAi: !isFallback,
          notes: `${selectedVariant.tone} tone: "${selectedVariant.message.substring(0, 80)}..."`,
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
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-label="Draft follow-up"
      >
        <div className="modal-header">
          <div>
            <div className="modal-title">Draft Follow-up</div>
            <div className="modal-subtitle">
              {COUNTERPARTY_ICONS[item.counterpartyType as CounterpartyType]}{" "}
              {item.counterpartyName} ·{" "}
              {ASK_TYPE_LABELS[item.askType as AskType]} ·{" "}
              {followUpCount > 0
                ? `${followUpCount} prior follow-up${followUpCount > 1 ? "s" : ""}`
                : "First follow-up"}
            </div>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            id="btn-nudge-modal-close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
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
        </div>

        <div className="modal-footer">
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
              disabled={!selectedVariant || isLogging}
            >
              {isLogging ? (
                <>
                  <Loader2 size={13} />
                  Logging...
                </>
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
