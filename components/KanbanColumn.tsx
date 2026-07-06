"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { LucideIcon } from "lucide-react";
import WaitingCard from "./WaitingCard";
import type { WaitingItemWithFollowUps } from "@/types";

interface KanbanColumnProps {
  id: string;
  label: string;
  icon: LucideIcon;
  dotColor: string;
  titleColor: string;
  items: WaitingItemWithFollowUps[];
  onNudge: (item: WaitingItemWithFollowUps) => void;
  onResolve: (item: WaitingItemWithFollowUps) => void;
  onEdit: (item: WaitingItemWithFollowUps) => void;
  onDelete: (id: string) => void;
}

export default function KanbanColumn({
  id,
  label,
  icon: Icon,
  dotColor,
  titleColor,
  items,
  onNudge,
  onResolve,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`column column-${id.toLowerCase()} ${isOver ? "is-over" : ""}`}
      ref={setNodeRef}
    >
      <div className="column-header">
        <div className="column-title">
          <div className={`column-dot ${dotColor}`} />
          <Icon size={12} className={titleColor} />
          <span className={titleColor}>{label}</span>
        </div>
        <span className="column-count">{items.length}</span>
      </div>

      <div className="column-body">
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                {id === "WAITING" && "🕐"}
                {id === "DUE_SOON" && "⚡"}
                {id === "OVERDUE" && "🔴"}
                {id === "RESOLVED" && "✅"}
              </div>
              <div className="empty-state-text">No items here</div>
            </div>
          ) : (
            items.map((item) => (
              <WaitingCard
                key={item.id}
                item={item}
                onNudge={onNudge}
                onResolve={onResolve}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
