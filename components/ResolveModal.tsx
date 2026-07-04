"use client";

import { useState } from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { COUNTERPARTY_ICONS, ASK_TYPE_LABELS } from "@/lib/constants";
import type { AskType, CounterpartyType } from "@/lib/constants";
import type { WaitingItemWithFollowUps } from "@/types";

interface ResolveModalProps {
  item: WaitingItemWithFollowUps;
  onClose: () => void;
  onResolved: (item: WaitingItemWithFollowUps) => void;
}

export default function ResolveModal({
  item,
  onClose,
  onResolved,
}: ResolveModalProps) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/items/${item.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNote: resolutionNote.trim() }),
      });

      if (!res.ok) throw new Error("Failed to resolve item");

      const data = await res.json();
      const resolved = {
        ...data.item,
        createdAt: new Date(data.item.createdAt),
        lastContactAt: new Date(data.item.lastContactAt),
        expectedBy: data.item.expectedBy
          ? new Date(data.item.expectedBy)
          : null,
        followUps: data.item.followUps.map((f: { date: string }) => ({
          ...f,
          date: new Date(f.date),
        })),
      };
      onResolved(resolved);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysWaited = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Resolve waiting item"
      >
        <div className="modal-header">
          <div>
            <div className="modal-title">Mark as Resolved</div>
            <div className="modal-subtitle">
              {COUNTERPARTY_ICONS[item.counterpartyType as CounterpartyType]}{" "}
              {item.counterpartyName} ·{" "}
              {ASK_TYPE_LABELS[item.askType as AskType]}
            </div>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            id="btn-resolve-modal-close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Summary */}
            <div
              style={{
                background: "rgba(5, 150, 105, 0.06)",
                border: "1px solid rgba(5, 150, 105, 0.2)",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <CheckCircle2 size={14} color="#34d399" />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#34d399",
                  }}
                >
                  {item.title}
                </span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  display: "flex",
                  gap: "16px",
                }}
              >
                <span>Waited {daysWaited} days</span>
                <span>{item.followUps.length} follow-ups sent</span>
              </div>
            </div>

            {/* Resolution note */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-resolution-note">
                Resolution note (optional)
              </label>
              <textarea
                id="input-resolution-note"
                className="form-textarea"
                placeholder="How did it resolve? e.g. Received quote, payment arrived, got approval..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                autoFocus
              />
              <span className="form-hint">
                Stored for your records and future latency learning
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              id="btn-resolve-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              id="btn-resolve-submit"
              style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} />
                  Mark Resolved
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
