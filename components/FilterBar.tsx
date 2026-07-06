"use client";

import {
  ASK_TYPE_LABELS,
  COUNTERPARTY_TYPE_LABELS,
} from "@/lib/constants";
import type { AskType, CounterpartyType } from "@/lib/constants";

interface FilterBarProps {
  filterAskType: string;
  filterCounterpartyType: string;
  searchQuery: string;
  onAskTypeChange: (value: string) => void;
  onCounterpartyTypeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
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

export default function FilterBar({
  filterAskType,
  filterCounterpartyType,
  searchQuery,
  onAskTypeChange,
  onCounterpartyTypeChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "12px 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {/* Ask type filters */}
        <div className="filter-group">
          <span className="filter-label">Ask type</span>
          <button
            id="filter-ask-all"
            className={`filter-chip ${filterAskType === "ALL" ? "active" : ""}`}
            onClick={() => onAskTypeChange("ALL")}
          >
            All
          </button>
          {ASK_TYPES.map((t) => (
            <button
              key={t}
              id={`filter-ask-${t.toLowerCase()}`}
              className={`filter-chip ${filterAskType === t ? "active" : ""}`}
              onClick={() => onAskTypeChange(t)}
            >
              {ASK_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Counterparty type filters */}
        <div className="filter-group">
          <span className="filter-label">From</span>
          <button
            id="filter-cp-all"
            className={`filter-chip ${filterCounterpartyType === "ALL" ? "active" : ""}`}
            onClick={() => onCounterpartyTypeChange("ALL")}
          >
            All
          </button>
          {COUNTERPARTY_TYPES.map((t) => (
            <button
              key={t}
              id={`filter-cp-${t.toLowerCase()}`}
              className={`filter-chip ${filterCounterpartyType === t ? "active" : ""}`}
              onClick={() => onCounterpartyTypeChange(t)}
            >
              {COUNTERPARTY_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div style={{ minWidth: "260px" }}>
        <input
          type="text"
          id="search-input"
          className="form-input"
          placeholder="🔍 Search cards..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 14px",
            fontSize: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            color: "var(--text-primary)",
            outline: "none"
          }}
        />
      </div>
    </div>
  );
}
