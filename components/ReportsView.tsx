"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { WaitingItemWithFollowUps } from "@/types";
import { ASK_TYPE_LABELS } from "@/lib/constants";
import type { AskType } from "@/lib/constants";

interface ReportsViewProps {
  items: WaitingItemWithFollowUps[];
}

export default function ReportsView({ items }: ReportsViewProps) {
  const resolvedItems = items.filter((i) => i.status === "RESOLVED");

  // Get list of months/years available in resolved data or follow-up logs
  const resolutionMonths = resolvedItems.map((item) => {
    const date = new Date(item.updatedAt); // resolution date is updatedAt for RESOLVED items
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const followUpMonths = items.flatMap((item) =>
    (item.followUps || []).map((fu) => {
      const date = new Date(fu.date);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    })
  );

  const availableDates = Array.from(
    new Set([...resolutionMonths, ...followUpMonths])
  ).sort().reverse();

  // Selected date fallback to current month if no data
  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(
    availableDates.length > 0 ? availableDates[0] : currentMonthYear
  );

  // Filter resolved items by selected month
  const filteredResolved = resolvedItems.filter((item) => {
    const date = new Date(item.updatedAt);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return dateStr === selectedDate;
  });

  // Calculate metrics
  const totalResolved = filteredResolved.length;
  const avgLatency =
    totalResolved > 0
      ? Math.round(
          filteredResolved.reduce((acc, i) => acc + (i.actualLatencyDays || 0), 0) /
            totalResolved
        )
      : 0;

  // Count all follow-ups (nudges) created during the selected month across all items
  const totalNudgesInFiltered = items.reduce((acc, item) => {
    const nudgesInMonth = (item.followUps || []).filter((fu) => {
      const date = new Date(fu.date);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return dateStr === selectedDate;
    });
    return acc + nudgesInMonth.length;
  }, 0);

  const formatMonthTitle = (dateStr: string) => {
    const [year, month] = dateStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return format(date, "MMMM yyyy");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ["Title", "Counterparty", "Type", "Latency (Days)", "Resolution Note", "Date Resolved"];
    const rows = filteredResolved.map((item) => [
      item.title,
      item.counterpartyName,
      ASK_TYPE_LABELS[item.askType as AskType] || item.askType,
      item.actualLatencyDays ?? "",
      item.resolutionNote || "",
      format(new Date(item.updatedAt), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `QueueFlow_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "24px 0" }}>
      {/* Top Filter and Actions Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="filter-label" style={{ fontSize: "12px" }}>Report Month</span>
          <select
            className="form-select"
            style={{ width: "180px", padding: "8px 12px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-default)" }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {availableDates.length > 0 ? (
              availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatMonthTitle(date)}
                </option>
              ))
            ) : (
              <option value={currentMonthYear}>{formatMonthTitle(currentMonthYear)}</option>
            )}
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderColor: "var(--accent-primary)", color: "var(--accent-primary)" }}
          >
            📥 Export to CSV
          </button>
          <button
            onClick={handlePrint}
            className="btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px" }}
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {/* Monthly Summary Statistics cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "20px", borderRadius: "14px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "6px" }}>Total Resolved</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)" }}>{totalResolved} items</div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "20px", borderRadius: "14px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "6px" }}>Average Resolution Time</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)" }}>{avgLatency} days</div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "20px", borderRadius: "14px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "6px" }}>Total Follow-Ups Generated</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)" }}>{totalNudgesInFiltered} nudges</div>
        </div>
      </div>

      {/* Resolved Items List Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ padding: "18px 24px", background: "rgba(0,0,0,0.1)", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>Resolution Log — {formatMonthTitle(selectedDate)}</h3>
        </div>

        {filteredResolved.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "12px 24px", color: "var(--text-secondary)", fontWeight: "600" }}>Title</th>
                  <th style={{ padding: "12px 24px", color: "var(--text-secondary)", fontWeight: "600" }}>Counterparty</th>
                  <th style={{ padding: "12px 24px", color: "var(--text-secondary)", fontWeight: "600" }}>Type</th>
                  <th style={{ padding: "12px 24px", color: "var(--text-secondary)", fontWeight: "600" }}>Latency</th>
                  <th style={{ padding: "12px 24px", color: "var(--text-secondary)", fontWeight: "600" }}>Resolution Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredResolved.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.2s" }} className="table-row-hover">
                    <td style={{ padding: "14px 24px", fontWeight: "600", color: "var(--text-primary)" }}>{item.title}</td>
                    <td style={{ padding: "14px 24px", color: "var(--text-secondary)" }}>{item.counterpartyName}</td>
                    <td style={{ padding: "14px 24px" }}>
                      <span className={`badge badge-${item.askType.toLowerCase()}`}>
                        {ASK_TYPE_LABELS[item.askType as AskType] || item.askType}
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px", fontWeight: "700", color: "var(--text-secondary)" }}>{item.actualLatencyDays ?? "—"} days</td>
                    <td style={{ padding: "14px 24px", fontStyle: "italic", color: "var(--text-muted)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.resolutionNote || ""}>
                      {item.resolutionNote || "None recorded"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            No resolved items recorded in {formatMonthTitle(selectedDate)}
          </div>
        )}
      </div>
    </div>
  );
}
