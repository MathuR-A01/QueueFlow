"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { Plus, Clock, Hourglass, AlertTriangle, CheckCircle2, RefreshCw, BarChart2, FileText, LogOut, User } from "lucide-react";
import KanbanColumn from "./KanbanColumn";
import WaitingCard from "./WaitingCard";
import AddItemModal from "./AddItemModal";
import NudgeModal from "./NudgeModal";
import ResolveModal from "./ResolveModal";
import FilterBar from "./FilterBar";
import EditItemModal from "./EditItemModal";
import AnalyticsView from "./AnalyticsView";
import ReportsView from "./ReportsView";
import type { LucideIcon } from "lucide-react";
import type { WaitingItemWithFollowUps } from "@/types";
import { useRouter } from "next/navigation";

const COLUMNS: {
  id: string;
  label: string;
  icon: LucideIcon;
  dotColor: string;
  titleColor: string;
}[] = [
  {
    id: "WAITING",
    label: "Waiting",
    icon: Clock,
    dotColor: "bg-slate-400",
    titleColor: "text-slate-400",
  },
  {
    id: "DUE_SOON",
    label: "Due Soon",
    icon: Hourglass,
    dotColor: "bg-amber-400",
    titleColor: "text-amber-400",
  },
  {
    id: "OVERDUE",
    label: "Overdue",
    icon: AlertTriangle,
    dotColor: "bg-rose-400",
    titleColor: "text-rose-400",
  },
  {
    id: "RESOLVED",
    label: "Resolved",
    icon: CheckCircle2,
    dotColor: "bg-emerald-400",
    titleColor: "text-emerald-400",
  },
];

interface KanbanBoardProps {
  initialItems: WaitingItemWithFollowUps[];
  currentUser?: { userId: string; email: string; name: string };
}

export default function KanbanBoard({ initialItems, currentUser }: KanbanBoardProps) {
  const router = useRouter();
  const [items, setItems] = useState<WaitingItemWithFollowUps[]>(initialItems);
  const [activeTab, setActiveTab] = useState<"BOARD" | "ANALYTICS" | "REPORTS">("BOARD");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeItem, setActiveItem] = useState<WaitingItemWithFollowUps | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nudgeItem, setNudgeItem] = useState<WaitingItemWithFollowUps | null>(null);
  const [resolveItem, setResolveItem] = useState<WaitingItemWithFollowUps | null>(null);
  const [editItem, setEditItem] = useState<WaitingItemWithFollowUps | null>(null);
  const [filterAskType, setFilterAskType] = useState("ALL");
  const [filterCounterpartyType, setFilterCounterpartyType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterAskType !== "ALL" && item.askType !== filterAskType) return false;
    if (
      filterCounterpartyType !== "ALL" &&
      item.counterpartyType !== filterCounterpartyType
    )
      return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchName = item.counterpartyName.toLowerCase().includes(query);
      const matchNotes = item.notes ? item.notes.toLowerCase().includes(query) : false;
      if (!matchTitle && !matchName && !matchNotes) return false;
    }

    return true;
  });

  const getColumnItems = (status: string) =>
    filteredItems
      .filter((i) => i.status === status)
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((i) => i.id === event.active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeItemObj = items.find((i) => i.id === activeId);
    if (!activeItemObj) return;

    // Prevent dragging resolved items back to active columns
    if (activeItemObj.status === "RESOLVED") return;

    // Check if dragged over a column vs over a card
    let newStatus = overId as string;
    const columnsList = ["WAITING", "DUE_SOON", "OVERDUE", "RESOLVED"];
    if (!columnsList.includes(newStatus)) {
      const targetCard = items.find((i) => i.id === overId);
      if (targetCard) newStatus = targetCard.status;
    }

    if (activeItemObj.status === newStatus) return;

    // If drag to RESOLVED, show resolve notes dialog instead of direct update
    if (newStatus === "RESOLVED") {
      setResolveItem(activeItemObj);
      return;
    }

    // Normal status change
    setItems((prev) =>
      prev.map((i) =>
        i.id === activeId ? { ...i, status: newStatus, lastContactAt: new Date() } : i
      )
    );

    await fetch(`/api/items/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, lastContactAt: new Date() }),
    });
  };

  const handleItemAdded = useCallback((newItem: WaitingItemWithFollowUps) => {
    setItems((prev) => [...prev, newItem]);
    setShowAddModal(false);
  }, []);

  const handleItemResolved = useCallback(
    (updatedItem: WaitingItemWithFollowUps) => {
      setItems((prev) =>
        prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
      );
      setResolveItem(null);
    },
    []
  );

  const handleItemUpdated = useCallback(
    (updatedItem: WaitingItemWithFollowUps) => {
      setItems((prev) =>
        prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
      );
      setEditItem(null);
    },
    []
  );

  const handleFollowUpLogged = useCallback(
    (
      itemId: string,
      followUp: { id: string; date: string; channel: string; draftedByAi: boolean; notes: string | null; waitingItemId: string },
      parentItem?: any
    ) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                ...(parentItem
                  ? {
                      status: parentItem.status,
                      urgencyScore: parentItem.urgencyScore,
                      lastContactAt: new Date(parentItem.lastContactAt),
                    }
                  : {
                      lastContactAt: new Date(),
                    }),
                followUps: [...i.followUps, { ...followUp, date: new Date(followUp.date) }],
              }
            : i
        )
      );
    },
    []
  );

  const handleDeleteItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      if (data.items) {
        setItems(
          data.items.map((item: WaitingItemWithFollowUps & { createdAt: string; lastContactAt: string; expectedBy: string | null; followUps: { date: string }[] }) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            lastContactAt: new Date(item.lastContactAt),
            expectedBy: item.expectedBy ? new Date(item.expectedBy) : null,
            followUps: item.followUps.map((f: { date: string }) => ({ ...f, date: new Date(f.date) })),
          }))
        );
      }
    } catch (e) {
      console.error("Refresh failed:", e);
    }
    setIsRefreshing(false);
  };

  const totalOpen = items.filter((i) => i.status !== "RESOLVED").length;
  const totalOverdue = items.filter((i) => i.status === "OVERDUE").length;

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="header">
        <div className="header-brand" style={{ gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Premium SVG QueueFlow Logo Mark */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 10px rgba(129, 138, 248, 0.45))" }}>
              <path d="M6 16H18" stroke="url(#paint0_linear)" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="8" cy="16" r="3.5" fill="#818cf8"/>
              <circle cx="16" cy="16" r="3.5" fill="#a855f7"/>
              <path d="M22 11L27 16L20 17.5L25 22.5" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="paint0_linear" x1="6" y1="16" x2="18" y2="16" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#818cf8"/>
                  <stop offset="1" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>

            {/* Premium Logo Typography & Subtitle */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
                <span style={{ fontSize: "17px", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.03em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Queue</span>
                <span style={{ fontSize: "17px", fontWeight: "900", background: "linear-gradient(135deg, #a855f7 30%, #f43f5e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Flow</span>
              </div>
              <div className="header-subtitle" style={{ marginTop: "-2px" }}>
                {totalOpen} open · {totalOverdue} overdue
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", padding: "4px", borderRadius: "10px" }}>
          <button
            onClick={() => setActiveTab("BOARD")}
            className="filter-chip"
            style={{ borderRadius: "8px", background: activeTab === "BOARD" ? "rgba(255,255,255,0.06)" : "transparent", color: activeTab === "BOARD" ? "var(--text-primary)" : "var(--text-secondary)", border: "none" }}
          >
            📋 Board
          </button>
          <button
            onClick={() => setActiveTab("ANALYTICS")}
            className="filter-chip"
            style={{ borderRadius: "8px", background: activeTab === "ANALYTICS" ? "rgba(255,255,255,0.06)" : "transparent", color: activeTab === "ANALYTICS" ? "var(--text-primary)" : "var(--text-secondary)", border: "none" }}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab("REPORTS")}
            className="filter-chip"
            style={{ borderRadius: "8px", background: activeTab === "REPORTS" ? "rgba(255,255,255,0.06)" : "transparent", color: activeTab === "REPORTS" ? "var(--text-primary)" : "var(--text-secondary)", border: "none" }}
          >
            📄 Reports
          </button>
        </div>

        <div className="stats-bar" style={{ position: "relative" }}>
          <button
            id="btn-refresh"
            onClick={handleRefresh}
            className={`btn-refresh ${isRefreshing ? "spinning" : ""}`}
            title="Refresh urgency scores"
          >
            <RefreshCw size={14} />
          </button>
          <button
            id="btn-add-item"
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus size={14} />
            Add Item
          </button>
          
          {/* User profile actions */}
          {currentUser && (
            <div>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="btn-ghost"
                style={{ padding: "8px", borderRadius: "10px" }}
                title={currentUser.name}
              >
                <User size={14} />
              </button>
              {showProfileMenu && (
                <div style={{ position: "absolute", top: "42px", right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "12px", padding: "8px", minWidth: "160px", zIndex: 100, boxShadow: "var(--shadow-lg)" }}>
                  <div style={{ padding: "6px 8px", fontSize: "12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "4px" }}>
                    <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{currentUser.name}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn-ghost"
                    style={{ width: "100%", justifyContent: "flex-start", gap: "8px", padding: "6px 8px", color: "var(--overdue)" }}
                  >
                    <LogOut size={12} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Conditionally Render Views based on Tab */}
      {activeTab === "BOARD" && (
        <>
          <FilterBar
            filterAskType={filterAskType}
            filterCounterpartyType={filterCounterpartyType}
            searchQuery={searchQuery}
            onAskTypeChange={setFilterAskType}
            onCounterpartyTypeChange={setFilterCounterpartyType}
            onSearchChange={setSearchQuery}
          />

          <main className="board-container">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="board">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    id={col.id}
                    label={col.label}
                    icon={col.icon}
                    dotColor={col.dotColor}
                    titleColor={col.titleColor}
                    items={getColumnItems(col.id)}
                    onNudge={setNudgeItem}
                    onResolve={setResolveItem}
                    onEdit={setEditItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeItem ? (
                  <div style={{ transform: "rotate(2deg)", opacity: 0.95 }}>
                    <WaitingCard
                      item={activeItem}
                      isDragging
                      onNudge={() => {}}
                      onResolve={() => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </main>
        </>
      )}

      {activeTab === "ANALYTICS" && (
        <main className="board-container" style={{ overflowY: "auto" }}>
          <AnalyticsView items={items} />
        </main>
      )}

      {activeTab === "REPORTS" && (
        <main className="board-container" style={{ overflowY: "auto" }}>
          <ReportsView items={items} />
        </main>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleItemAdded}
        />
      )}

      {nudgeItem && (
        <NudgeModal
          item={nudgeItem}
          onClose={() => setNudgeItem(null)}
          onFollowUpLogged={(fu, parentItem) => handleFollowUpLogged(nudgeItem.id, fu, parentItem)}
          onFollowUpDeleted={(updatedItem) => {
            setItems((prev) =>
              prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
            );
            setNudgeItem(updatedItem);
          }}
        />
      )}

      {resolveItem && (
        <ResolveModal
          item={resolveItem}
          onClose={() => setResolveItem(null)}
          onResolved={handleItemResolved}
        />
      )}

      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onUpdated={handleItemUpdated}
        />
      )}
    </div>
  );
}
