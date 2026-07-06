"use client";

import { useState } from "react";
import { GitBranch, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
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

  // Urgency curves (SVG path points for active items)
  const activeUrgencyItems = [...activeItems]
    .sort((a, b) => a.urgencyScore - b.urgencyScore)
    .map((i) => i.urgencyScore);

  const maxScore = 100;
  const curvePoints = activeUrgencyItems.length > 0
    ? activeUrgencyItems
        .map((score, index) => {
          const x = 70 + (index / Math.max(activeUrgencyItems.length - 1, 1)) * 410;
          const y = 140 - (score / maxScore) * 100; // y-axis maps to 40..140
          return `${x},${y}`;
        })
        .join(" ")
    : "";

  // Group resolved items by month (Last 6 Months)
  const getLast6Months = () => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        name: format(d, "MMM yyyy"),
        shortName: format(d, "MMM"),
        month: d.getMonth(),
        year: d.getFullYear(),
        count: 0,
      });
    }
    return months;
  };

  const monthlyResolutions = getLast6Months();
  resolvedItems.forEach((item) => {
    const date = new Date(item.updatedAt);
    const m = date.getMonth();
    const y = date.getFullYear();
    const match = monthlyResolutions.find((d) => d.month === m && d.year === y);
    if (match) {
      match.count += 1;
    }
  });

  const maxResolutionCount = Math.max(...monthlyResolutions.map((r) => r.count), 4);

  // Pie chart calculation helper
  let cumulativeAngle = 0;

  const hoveredItem = hoveredSlice ? askTypePercentages.find((i) => i.type === hoveredSlice) : null;
  const hoveredLabel = hoveredSlice ? ASK_TYPE_LABELS[hoveredSlice as AskType] : null;

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
          <div style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", padding: "10px", borderRadius: "10px" }}>
            <GitBranch size={20} />
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Nudges Logged</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)" }}>{totalNudges} sent</div>
          </div>
        </div>
      </div>

      {/* Main Charts Section: Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
        
        {/* Monthly Resolutions (Bar Chart with Months) */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "24px", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px", color: "var(--text-primary)" }}>Monthly Resolution Volume</h3>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "20px" }}>Number of items resolved in the last 6 months</p>
          
          <div style={{ position: "relative", width: "100%" }}>
            <svg viewBox="0 0 500 160" style={{ width: "100%", overflow: "visible" }}>
              {/* Gridlines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              
              {/* Y Axis Labels */}
              <text x="10" y="24" fill="var(--text-muted)" fontSize="9" fontWeight="600">{maxResolutionCount}</text>
              <text x="10" y="74" fill="var(--text-muted)" fontSize="9" fontWeight="600">{Math.round(maxResolutionCount / 2)}</text>
              <text x="10" y="124" fill="var(--text-muted)" fontSize="9" fontWeight="600">0</text>

              {/* Bars */}
              {monthlyResolutions.map((r, idx) => {
                const barWidth = 36;
                const gap = 36;
                const startX = 60;
                const x = startX + idx * (barWidth + gap);
                
                const barHeight = (r.count / maxResolutionCount) * 100;
                const y = 120 - barHeight;

                return (
                  <g key={r.name}>
                    {/* Glow effect for active bars */}
                    {r.count > 0 && (
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        fill="rgba(16, 185, 129, 0.15)"
                        style={{ filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))" }}
                      />
                    )}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={r.count > 0 ? "var(--resolved)" : "rgba(255,255,255,0.03)"}
                      stroke={r.count > 0 ? "rgba(16, 185, 129, 0.4)" : "rgba(255,255,255,0.05)"}
                      strokeWidth="1"
                    />
                    {/* Count label */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      fill={r.count > 0 ? "var(--text-primary)" : "var(--text-muted)"}
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {r.count}
                    </text>
                    {/* X Axis Month Label */}
                    <text
                      x={x + barWidth / 2}
                      y="142"
                      fill="var(--text-secondary)"
                      fontSize="10"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {r.shortName}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Ask Type Distribution (Donut Chart) */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "24px", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px", color: "var(--text-primary)" }}>Ask Type Breakdown</h3>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "20px" }}>Hover slices to view item distribution</p>
          
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
                        strokeWidth={hoveredSlice === item.type ? "4.0" : "3.2"}
                        strokeDasharray={strokeDash}
                        strokeDashoffset={offset}
                        style={{ cursor: "pointer", transition: "stroke-width 0.15s, stroke 0.15s" }}
                        onMouseEnter={() => setHoveredSlice(item.type)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>
                {/* Dynamic Center Text */}
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <span style={{ fontSize: "9px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {hoveredLabel || "Total Items"}
                  </span>
                  <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)", marginTop: "2px" }}>
                    {hoveredItem ? `${hoveredItem.count} (${hoveredItem.percentage}%)` : items.length}
                  </span>
                </div>
              </div>

              {/* Legend with Counts and Percentages */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, maxHeight: "130px", overflowY: "auto" }}>
                {askTypePercentages.map((item, idx) => {
                  const colors = ["#818cf8", "#c084fc", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];
                  const color = colors[idx % colors.length];
                  const label = ASK_TYPE_LABELS[item.type];
                  const isHovered = hoveredSlice === item.type;
                  return (
                    <div 
                      key={item.type} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between", 
                        fontSize: "11px",
                        background: isHovered ? "rgba(255,255,255,0.02)" : "transparent",
                        padding: "2px 4px",
                        borderRadius: "4px",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={() => setHoveredSlice(item.type)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                        <span style={{ color: "var(--text-secondary)", fontWeight: isHovered ? "600" : "400" }}>{label}</span>
                      </div>
                      <span style={{ color: "var(--text-primary)", fontWeight: "700" }}>
                        {item.count} {item.count > 1 ? "items" : "item"} ({item.percentage}%)
                      </span>
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

      {/* Main Charts Section: Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
        
        {/* Latency Comparison (Bar Chart) */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "24px", borderRadius: "16px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px", color: "var(--text-primary)" }}>Average Latency by Category</h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "20px" }}>Average number of days to resolve a request</p>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {latencyByAskType.map((item, idx) => {
              const label = ASK_TYPE_LABELS[item.type];
              const maxVal = Math.max(...latencyByAskType.map((i) => i.avg), 1);
              const pct = Math.max((item.avg / maxVal) * 100, 3);
              const colors = ["#818cf8", "#c084fc", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];
              const color = colors[idx % colors.length];

              return (
                <div key={item.type} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ width: "85px", fontSize: "11px", color: "var(--text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{label}</span>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", height: "10px", borderRadius: "99px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ background: color, height: "100%", width: `${pct}%`, borderRadius: "99px", transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ width: "35px", fontSize: "11px", color: "var(--text-primary)", fontWeight: "700", textAlign: "right" }}>{item.avg}d</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgency Score Curve (Line Area Chart with Y-axis markers) */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "24px", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px", color: "var(--text-primary)" }}>Urgency Score Curve</h3>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "20px" }}>Urgency score levels across all active blocked items</p>
          
          {activeUrgencyItems.length > 0 ? (
            <div style={{ position: "relative", width: "100%" }}>
              <svg viewBox="0 0 500 150" style={{ width: "100%", overflow: "visible" }}>
                <defs>
                  <linearGradient id="curveGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Gridlines */}
                <line x1="70" y1="40" x2="480" y2="40" stroke="rgba(225,29,72,0.1)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="70" y1="90" x2="480" y2="90" stroke="rgba(245,158,11,0.1)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="70" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                
                {/* Y Axis Range Labels */}
                <text x="10" y="44" fill="#fb7185" fontSize="8" fontWeight="700">80+ (Overdue)</text>
                <text x="10" y="94" fill="#fbbf24" fontSize="8" fontWeight="700">45+ (Due Soon)</text>
                <text x="10" y="144" fill="var(--text-muted)" fontSize="8" fontWeight="700">0 (Waiting)</text>

                {/* Fill path under the curve */}
                {curvePoints && (
                  <path
                    d={`M 70,140 L ${curvePoints} L 480,140 Z`}
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
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", paddingLeft: "70px" }}>
                <span>Lowest Blocked Item</span>
                <span>Highest Blocked Item</span>
              </div>
            </div>
          ) : (
            <div style={{ height: "150px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              No active blocked items to chart
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
