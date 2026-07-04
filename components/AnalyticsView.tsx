"use client";

import { useState } from "react";
import { GitBranch, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { WaitingItemWithFollowUps } from "@/types";
import { ASK_TYPE_LABELS, ASK_TYPE_COLORS } from "@/lib/constants";
import type { AskType } from "@/lib/constants";

interface AnalyticsViewProps {
  items: WaitingItemWithFollowUps[];
}

export default function AnalyticsView({ items }: AnalyticsViewProps) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Filter items
  const activeItems = items.filter((i) => i.status !== "RESOLVED");
  const resolvedItems = items.filter((i) => i.status === "RESOLVED");
  const overdueItems = items.filter((i) => i.status === "OVERDUE");

  // Metric 1: Avg Latency
  const avgLatency =
    resolvedItems.length > 0
      ? Math.round(
          resolvedItems.reduce((acc, i) => acc + (i.actualLatencyDays || 0), 0) /
            resolvedItems.length
        )
      : 0;

  // Metric 2: Nudge Efficiency
  const itemsWithFollowups = activeItems.filter((i) => i.followUps.length > 0);
  const nudgeResponseRate =
    itemsWithFollowups.length > 0
      ? Math.round((resolvedItems.length / (resolvedItems.length + activeItems.length)) * 100)
      : 0;

  // Metric 3: Total Nudges Sent
  const totalNudges = items.reduce((acc, i) => acc + i.followUps.length, 0);

  // Group by Ask Type (For donut chart)
  const askTypeCounts = items.reduce((acc, i) => {
    acc[i.askType] = (acc[i.askType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalItemsCount = items.length || 1;
  const askTypePercentages = Object.entries(askTypeCounts).map(([type, count]) => ({
    type: type as AskType,
    count,
    percentage: Math.round((count / totalItemsCount) * 100),
  }));

  // Latency by Ask Type (For horizontal bar chart)
  const latencyByAskType = Object.keys(ASK_TYPE_LABELS).map((type) => {
    const typeResolved = resolvedItems.filter((i) => i.askType === type);
    const avg =
      typeResolved.length > 0
        ? Math.round(
            typeResolved.reduce((acc, i) => acc + (i.actualLatencyDays || 0), 0) /
              typeResolved.length
          )
        : 0;
    return { type: type as AskType, avg };
  });

  // Urgency curves (SVG path points)
  // We plot items from lowest to highest score
  const sortedByUrgency = [...items]
    .sort((a, b) => a.urgencyScore - b.urgencyScore)
    .map((i) => i.urgencyScore);

  const maxScore = Math.max(...sortedByUrgency, 100);
  const curvePoints = sortedByUrgency
    .map((score, index) => {
      const x = (index / Math.max(sortedByUrgency.length - 1, 1)) * 500;
      const y = 150 - (score / maxScore) * 120;
      return `${x},${y}`;
    })
    .join(" ");

  // Pie chart calculation helper
  let cumulativeAngle = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "24px 0" }}>
      {/* Overview Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "20px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-primary)", padding: "10px", borderRadius: "10px" }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Active Blocks</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)" }}>{activeItems.length}</div>
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "20px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--resolved)", padding: "10px", borderRadius: "10px" }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Avg Resolution Latency</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)" }}>{avgLatency} days</div>
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "20px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ background: "rgba(244, 63, 94, 0.1)", color: "var(--overdue)", padding: "10px", borderRadius: "10px" }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Overdue Alarms</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)" }}>{overdueItems.length}</div>
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "20px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ background: "rgba(168, 85, 247, 0.1)", color: "#c084fc", padding: "10px", borderRadius: "10px" }}>
            <GitBranch size={20} />
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Nudges Logged</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)" }}>{totalNudges} sent</div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
        
        {/* Urgency Distribution (Line Area Chart) */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "24px", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)" }}>Urgency Score Curve</h3>
          
          {sortedByUrgency.length > 0 ? (
            <div style={{ position: "relative", width: "100%" }}>
              <svg viewBox="0 0 500 150" style={{ width: "100%", overflow: "visible" }}>
                <defs>
                  <linearGradient id="curveGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Gridlines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                
                {/* Fill path under the curve */}
                {curvePoints && (
                  <path
                    d={`M 0,150 L ${curvePoints} L 500,150 Z`}
                    fill="url(#curveGlow)"
                  />
                )}
                
                {/* Main line path */}
                {curvePoints && (
                  <path
                    d={`M ${curvePoints}`}
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0px 2px 8px rgba(99, 102, 241, 0.4))" }}
                  />
                )}
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginTop: "8px" }}>
                <span>Lowest Blocked Item</span>
                <span>Highest Blocked Item</span>
              </div>
            </div>
          ) : (
            <div style={{ height: "150px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              No data available to display
            </div>
          )}
        </div>

        {/* Ask Type Distribution (Donut Chart) */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "24px", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)" }}>Ask Type Breakdown</h3>
          
          {askTypePercentages.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div style={{ position: "relative", width: "120px", height: "120px" }}>
                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  {askTypePercentages.map((item, idx) => {
                    const strokeDash = `${item.percentage} ${100 - item.percentage}`;
                    const offset = 100 - cumulativeAngle;
                    cumulativeAngle += item.percentage;
                    
                    // Assign chart colors
                    const colors = ["#818cf8", "#c084fc", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];
                    const color = colors[idx % colors.length];

                    return (
                      <circle
                        key={item.type}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="3.2"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={offset}
                        style={{ cursor: "pointer", transition: "stroke-width 0.2s" }}
                        onMouseEnter={() => setHoveredSlice(item.type)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "500" }}>Total Items</span>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)" }}>{items.length}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                {askTypePercentages.slice(0, 4).map((item, idx) => {
                  const colors = ["#818cf8", "#c084fc", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];
                  const color = colors[idx % colors.length];
                  const label = ASK_TYPE_LABELS[item.type];
                  return (
                    <div key={item.type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                      </div>
                      <span style={{ color: "var(--text-primary)", fontWeight: "700" }}>{item.percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ height: "120px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Latency Comparison (Bar Chart) */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "24px", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)" }}>Avg Latency by Category (Days to Resolve)</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {latencyByAskType.map((item, idx) => {
            const label = ASK_TYPE_LABELS[item.type];
            const maxVal = Math.max(...latencyByAskType.map((i) => i.avg), 1);
            const pct = Math.max((item.avg / maxVal) * 100, 3);
            const colors = ["#818cf8", "#c084fc", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];
            const color = colors[idx % colors.length];

            return (
              <div key={item.type} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ width: "80px", fontSize: "12px", color: "var(--text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{label}</span>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", height: "12px", borderRadius: "99px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ background: color, height: "100%", width: `${pct}%`, borderRadius: "99px", transition: "width 0.5s ease" }} />
                </div>
                <span style={{ width: "40px", fontSize: "12px", color: "var(--text-primary)", fontWeight: "700", textAlign: "right" }}>{item.avg}d</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
