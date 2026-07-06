"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow, format } from "date-fns";
import { Zap, CheckCircle2, Trash2, GitBranch, Edit } from "lucide-react";
import { getUrgencyBg } from "@/lib/urgency";
import {
  ASK_TYPE_COLORS,
  ASK_TYPE_LABELS,
  COUNTERPARTY_ICONS,
} from "@/lib/constants";
import type { WaitingItemWithFollowUps } from "@/types";
import type { AskType, CounterpartyType } from "@/lib/constants";

interface WaitingCardProps {
  item: WaitingItemWithFollowUps;
  isDragging?: boolean;
  onNudge: (item: WaitingItemWithFollowUps) => void;
  onResolve: (item: WaitingItemWithFollowUps) => void;
  onEdit: (item: WaitingItemWithFollowUps) => void;
  onDelete: (id: string) => void;
}

export default function WaitingCard({
  item,
  isDragging,
  onNudge,
  onResolve,
  onEdit,
  onDelete,
}: WaitingCardProps) {
  const isResolved = item.status === "RESOLVED";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id, disabled: isResolved });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusClass = `card-${item.status.toLowerCase().replace("_", "_")}`;

  const lastContactDate = new Date(item.lastContactAt);
  const daysWaited = Math.max(
    0,
    Math.floor(
      (Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const askTypeColor = ASK_TYPE_COLORS[item.askType as AskType];
  const counterpartyIcon =
    COUNTERPARTY_ICONS[item.counterpartyType as CounterpartyType] || "👤";
  const urgencyBg = getUrgencyBg(item.urgencyScore);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card ${statusClass} ${isSortableDragging || isDragging ? "is-dragging" : ""}`}
      id={`card-${item.id}`}
    >
      {/* Top row: title + urgency badge */}
      <div className="card-top">
        <div className="card-title">{item.title}</div>
        {!isResolved && (
          <span className={`badge urgency-badge ${urgencyBg}`}>
            {item.urgencyScore}
          </span>
        )}
        {isResolved && (
          <span className="badge" style={{ background: "rgba(5,150,105,0.15)", borderColor: "rgba(5,150,105,0.3)", color: "#34d399" }}>
            ✓
          </span>
        )}
      </div>

      {/* Counterparty + ask type */}
      <div className="card-meta">
        <span className="card-counterparty">
          <span>{counterpartyIcon}</span>
          <span>{item.counterpartyName}</span>
        </span>
        <span className={`badge ${askTypeColor}`}>
          {ASK_TYPE_LABELS[item.askType as AskType] || item.askType}
        </span>
      </div>

      {/* Notes preview */}
      {item.notes && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginBottom: "6px",
            lineHeight: "1.5",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {item.notes}
        </div>
      )}

      {/* Resolution note */}
      {isResolved && item.resolutionNote && (
        <div className="resolution-note">✓ {item.resolutionNote}</div>
      )}

      {/* Follow-up count */}
      {item.followUps.length > 0 && (
        <div className="followup-indicator">
          <GitBranch size={10} />
          <span>{item.followUps.length} follow-up{item.followUps.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Expected by */}
      {item.expectedBy && !isResolved && (
        <div className="expected-tag">
          Expected by{" "}
          <span className="expected-date">
            {format(new Date(item.expectedBy), "MMM d")}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="card-footer">
        <div className="card-days">
          {isResolved ? (
            <span>
              Resolved in{" "}
              <span>{item.actualLatencyDays ?? "—"} days</span>
            </span>
          ) : (
            <span>
              <span>{daysWaited}d</span> since last contact
            </span>
          )}
        </div>

        {!isResolved && (
          <div className="card-actions">
            <button
              id={`btn-nudge-${item.id}`}
              className="btn-ghost btn-nudge"
              onClick={(e) => {
                e.stopPropagation();
                onNudge(item);
              }}
              title="Draft follow-up message"
            >
              <Zap size={11} />
              Nudge
            </button>
            <button
              id={`btn-edit-${item.id}`}
              className="btn-ghost btn-edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              title="Edit item details"
            >
              <Edit size={11} />
            </button>
            <button
              id={`btn-resolve-${item.id}`}
              className="btn-ghost btn-resolve"
              onClick={(e) => {
                e.stopPropagation();
                onResolve(item);
              }}
              title="Mark as resolved"
            >
              <CheckCircle2 size={11} />
            </button>
            <button
              id={`btn-delete-${item.id}`}
              className="btn-ghost btn-delete"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this item?")) onDelete(item.id);
              }}
              title="Delete item"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
