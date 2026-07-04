"use client";

import {
  ASK_TYPE_LABELS,
  COUNTERPARTY_TYPE_LABELS,
} from "@/lib/constants";
import type { AskType, CounterpartyType } from "@/lib/constants";

interface FilterBarProps {
  filterAskType: string;
  filterCounterpartyType: string;
  onAskTypeChange: (value: string) => void;
  onCounterpartyTypeChange: (value: string) => void;
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
  onAskTypeChange,
  onCounterpartyTypeChange,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
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
  );
}
