"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { DEFAULT_LATENCY, ASK_TYPE_LABELS, COUNTERPARTY_TYPE_LABELS } from "@/lib/constants";
import type { AskType, CounterpartyType } from "@/lib/constants";
import type { WaitingItemWithFollowUps } from "@/types";

interface AddItemModalProps {
  onClose: () => void;
  onAdded: (item: WaitingItemWithFollowUps) => void;
}

const ASK_TYPES: AskType[] = [
  "REPLY",
  "DOCUMENT",
  "PAYMENT",
  "DECISION",
  "DELIVERY",
  "OTHER",
];
const COUNTERPARTY_TYPES: CounterpartyType[] = [
  "PERSON",
  "COMPANY",
  "INSTITUTION",
];

export default function AddItemModal({ onClose, onAdded }: AddItemModalProps) {
  const [title, setTitle] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyType, setCounterpartyType] =
    useState<CounterpartyType>("PERSON");
  const [askType, setAskType] = useState<AskType>("REPLY");
  const [expectedBy, setExpectedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !counterpartyName.trim()) {
      setError("Title and counterparty name are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          counterpartyName: counterpartyName.trim(),
          counterpartyType,
          askType,
          expectedBy: expectedBy || null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create item");
      }

      const data = await res.json();
      const item = {
        ...data.item,
        createdAt: new Date(data.item.createdAt),
        lastContactAt: new Date(data.item.lastContactAt),
        expectedBy: data.item.expectedBy ? new Date(data.item.expectedBy) : null,
        followUps: [],
      };
      onAdded(item);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultLatency = DEFAULT_LATENCY[askType];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Add waiting item">
        <div className="modal-header">
          <div>
            <div className="modal-title">Add Waiting Item</div>
            <div className="modal-subtitle">
              Track something you&apos;re waiting on someone else for
            </div>
          </div>
          <button className="modal-close" onClick={onClose} id="btn-add-modal-close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-title">
                What are you waiting for?
              </label>
              <input
                id="input-title"
                className="form-input"
                placeholder="e.g. Kitchen renovation quote"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Counterparty */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="input-counterparty-name">
                  From whom?
                </label>
                <input
                  id="input-counterparty-name"
                  className="form-input"
                  placeholder="Name or organization"
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="select-counterparty-type">
                  Type
                </label>
                <select
                  id="select-counterparty-type"
                  className="form-select"
                  value={counterpartyType}
                  onChange={(e) =>
                    setCounterpartyType(e.target.value as CounterpartyType)
                  }
                >
                  {COUNTERPARTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {COUNTERPARTY_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ask type + expected by */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="select-ask-type">
                  Type of ask
                </label>
                <select
                  id="select-ask-type"
                  className="form-select"
                  value={askType}
                  onChange={(e) => setAskType(e.target.value as AskType)}
                >
                  {ASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ASK_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <span className="form-hint">
                  Default: {defaultLatency} day wait
                </span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="input-expected-by">
                  Expected by (optional)
                </label>
                <input
                  id="input-expected-by"
                  type="date"
                  className="form-input"
                  style={{ colorScheme: "dark" }}
                  value={expectedBy}
                  onChange={(e) => setExpectedBy(e.target.value)}
                />
                <span className="form-hint">Date they gave you</span>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-notes">
                Notes (optional)
              </label>
              <textarea
                id="input-notes"
                className="form-textarea"
                placeholder="Context, what you said, what they said..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

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
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              id="btn-add-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              id="btn-add-submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="spinner" />
                  Adding...
                </>
              ) : (
                "Add to Waiting Room"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
