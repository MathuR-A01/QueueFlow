"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Clock, BarChart2, Shield, Bell } from "lucide-react";

function ScrollReveal({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : "translateY(40px)",
        transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

function NudgeComposerSimulator() {
  const [tone, setTone] = useState<"warm" | "neutral" | "firm">("warm");
  const [copied, setCopied] = useState(false);
  
  const drafts = {
    warm: {
      subject: "Checking in re: renov quote",
      body: "Hi Sarah, hope you're having a great week! Just checking in to see if you had a chance to look at the kitchen renovation quote we discussed. No rush at all, just planning out our timeline. Thanks!"
    },
    neutral: {
      subject: "Follow-up: Kitchen renovation quote details",
      body: "Hi Sarah, I'm following up on the itemized renovation quote. We are finalizing scheduling decisions by Friday, so please let me know if you have an estimated ETA. Thanks!"
    },
    firm: {
      subject: "URGENT: Kitchen renovation quote required",
      body: "Hi Sarah, we have now exceeded our planning timeline. We must receive the final details by tomorrow afternoon to lock in material pricing and prevent project delays. Let me know when it's sent."
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(drafts[tone].body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="process-card" style={{ padding: "24px", border: "1px solid rgba(168, 85, 247, 0.2)", background: "rgba(20, 22, 45, 0.3)", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 35px rgba(168, 85, 247, 0.05)", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Premium Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#a855f7", display: "flex", alignItems: "center" }}>⚡</span>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", color: "var(--text-secondary)", textTransform: "uppercase" }}>AI Composer</span>
        </div>
        <span style={{ fontSize: "9px", fontWeight: "800", color: "#a855f7", background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.2)", borderRadius: "6px", padding: "2px 6px", letterSpacing: "0.05em" }}>ACTIVE</span>
      </div>

      <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#f8fafc", margin: 0, letterSpacing: "-0.01em" }}>Compose Nudges Instantly</h3>
      <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
        Select a tone to see how our AI structures follow-ups based on actual item latency.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", padding: "4px", borderRadius: "10px" }}>
        {(["warm", "neutral", "firm"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTone(t)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              background: tone === t ? "rgba(168, 85, 247, 0.16)" : "transparent",
              border: tone === t ? "1px solid rgba(168, 85, 247, 0.2)" : "none",
              color: tone === t ? "#e9d5ff" : "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: "700",
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.2s"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Mock macOS Mail App Client */}
      <div style={{ background: "rgba(5, 6, 11, 0.75)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", overflow: "hidden" }}>
        {/* macOS Control Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.03)",
              border: copied ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "6px",
              padding: "2px 8px",
              color: copied ? "#6ee7b7" : "var(--text-secondary)",
              fontSize: "10px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>

        {/* Mail Fields */}
        <div style={{ padding: "12px 14px", fontSize: "11.5px", fontFamily: "monospace" }}>
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px", marginBottom: "8px", color: "var(--text-muted)", display: "flex", gap: "6px" }}>
            <span style={{ color: "#a855f7", fontWeight: "700" }}>Subject:</span>
            <span style={{ color: "var(--text-primary)" }}>{drafts[tone].subject}</span>
          </div>
          <div style={{ color: "var(--text-primary)", lineHeight: "1.5", minHeight: "72px" }}>
            {drafts[tone].body}
          </div>
        </div>
      </div>
    </div>
  );
}

function UrgencyCalculatorSimulator() {
  const [days, setDays] = useState(5);
  const latency = 7;
  const score = Math.min(100, Math.floor((days / latency) * 40));

  let status = "WAITING";
  let statusColor = "#a1a1aa";
  let statusGlow = "rgba(161, 161, 170, 0.05)";
  let dotGlow = "#a1a1aa";
  
  if (days >= 11) {
    status = "OVERDUE";
    statusColor = "#f43f5e";
    statusGlow = "rgba(244, 63, 94, 0.15)";
    dotGlow = "#f43f5e";
  } else if (days >= 7) {
    status = "DUE_SOON";
    statusColor = "#f59e0b";
    statusGlow = "rgba(245, 158, 11, 0.15)";
    dotGlow = "#f59e0b";
  }

  return (
    <div
      className="process-card"
      style={{
        padding: "24px",
        border: `1px solid ${days >= 11 ? "rgba(244, 63, 94, 0.2)" : days >= 7 ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.08)"}`,
        background: "rgba(20, 22, 45, 0.3)",
        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.6), 0 0 35px ${statusGlow}`,
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}
    >
      {/* Premium Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#f43f5e", display: "flex", alignItems: "center" }}>📊</span>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", color: "var(--text-secondary)", textTransform: "uppercase" }}>Latency Tracker</span>
        </div>
        <span style={{ fontSize: "9px", fontWeight: "800", color: "#f43f5e", background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "6px", padding: "2px 6px", letterSpacing: "0.05em" }}>CALCULATOR</span>
      </div>

      <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#f8fafc", margin: 0, letterSpacing: "-0.01em" }}>Interactive Urgency Score</h3>
      <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
        Drag the slider to adjust days since last contact and watch the status shift.
      </p>

      {/* Simulator Widget */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Slider Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--text-secondary)" }}>
            <span>Days Since Last Contact:</span>
            <span style={{ fontWeight: "700", color: statusColor, fontSize: "12px" }}>{days} days</span>
          </div>
          
          <div style={{ position: "relative", width: "100%", height: "20px", display: "flex", alignItems: "center" }}>
            <input
              type="range"
              min="1"
              max="15"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "99px",
                background: `linear-gradient(to right, ${statusColor} 0%, rgba(255,255,255,0.06) 100%)`,
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            />
          </div>
        </div>

        {/* Output Metrics */}
        <div style={{ display: "flex", gap: "12px" }}>
          {/* Status Display */}
          <div style={{ flex: 1, background: "rgba(5, 6, 11, 0.7)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Status</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: dotGlow,
                  display: "inline-block",
                  boxShadow: `0 0 8px ${dotGlow}`,
                  animation: status === "WAITING" ? "none" : "pulse 1.5s infinite"
                }}
              />
              <span style={{ fontSize: "13px", fontWeight: "800", color: statusColor, letterSpacing: "0.02em" }}>
                {status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Urgency Score Display */}
          <div style={{ flex: 1, background: "rgba(5, 6, 11, 0.7)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Urgency Score</div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#f8fafc" }}>
              {score}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const hasToken = document.cookie
      .split("; ")
      .some((row) => row.startsWith("session_token="));
    setIsAuth(hasToken);

    // Section Scroll Tracker
    const sectionIds = ["how-it-works", "playground", "workflow"];
    const observers = sectionIds.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.25, rootMargin: "-80px 0px -50% 0px" }
      );
      observer.observe(el);
      return { observer, el };
    });

    return () => {
      observers.forEach((obs) => {
        if (obs) obs.observer.unobserve(obs.el);
      });
    };
  }, []);

  return (
    <div className="app-shell" style={{ position: "relative", overflowX: "hidden" }}>
      {/* Moving Glowing Orbs & Keyframe Definitions */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes drift-purple {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(120px, 80px) scale(1.3); }
          }
          @keyframes drift-indigo {
            0%, 100% { transform: translate(0px, 0px) scale(1.2); }
            50% { transform: translate(-100px, -60px) scale(0.95); }
          }
          @keyframes drift-rose {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(60px, -120px) scale(1.15); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.15); }
          }
          .header {
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 16px 32px;
            background: rgba(5, 6, 11, 0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-subtle);
            transition: all 0.3s;
          }
          @media (max-width: 768px) {
            .header {
              padding: 12px 16px !important;
            }
          }

          .main-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 80px 24px;
            max-width: 1050px;
            margin: 0 auto;
            text-align: center;
            position: relative;
            z-index: 10;
            box-sizing: border-box;
            width: 100%;
          }
          @media (max-width: 768px) {
            .main-container {
              padding: 48px 16px !important;
            }
          }

          .commitment-container {
            width: 100%;
            background: var(--bg-card);
            border: 1px solid var(--border-default);
            border-radius: 24px;
            padding: 48px;
            box-sizing: border-box;
            text-align: left;
            box-shadow: var(--shadow-lg);
            position: relative;
            overflow: hidden;
            margin-bottom: 96px;
            backdrop-filter: blur(12px);
          }
          @media (max-width: 768px) {
            .commitment-container {
              padding: 24px 16px !important;
              border-radius: 16px !important;
            }
          }

          .glow-orb-purple {
            position: absolute;
            top: 5%;
            left: 10%;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 65%);
            filter: blur(80px);
            animation: drift-purple 22s ease-in-out infinite;
          }
          .glow-orb-indigo {
            position: absolute;
            top: 40%;
            right: 5%;
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 65%);
            filter: blur(80px);
            animation: drift-indigo 26s ease-in-out infinite;
          }
          .glow-orb-rose {
            position: absolute;
            bottom: 10%;
            left: 15%;
            width: 550px;
            height: 550px;
            background: radial-gradient(circle, rgba(244, 63, 94, 0.05) 0%, transparent 65%);
            filter: blur(80px);
            animation: drift-rose 20s ease-in-out infinite;
          }

          /* Premium Process Grid Styling */
          .process-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            width: 100%;
            position: relative;
            z-index: 10;
          }
          .process-card {
            position: relative;
            background: rgba(20, 22, 45, 0.35);
            border: 1px solid var(--border-subtle);
            border-radius: 20px;
            padding: 32px 24px;
            overflow: hidden;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
          }
          .process-card:hover {
            transform: translateY(-6px);
            border-color: rgba(255, 255, 255, 0.12);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
          }
          .process-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--card-border-gradient, linear-gradient(90deg, #818cf8, #a855f7));
            opacity: 0.8;
          }
          .process-watermark {
            position: absolute;
            bottom: -20px;
            right: -10px;
            font-size: 110px;
            font-weight: 900;
            color: rgba(255, 255, 255, 0.02);
            line-height: 1;
            user-select: none;
            pointer-events: none;
            font-family: 'Inter', sans-serif;
            transition: color 0.5s;
          }
          .process-card:hover .process-watermark {
            color: rgba(255, 255, 255, 0.04);
          }
          .process-icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--border-subtle);
            transition: all 0.5s;
          }
          .process-card:hover .process-icon-wrapper {
            background: var(--icon-bg, rgba(129, 138, 248, 0.1));
            border-color: var(--icon-border, rgba(129, 138, 248, 0.3));
            box-shadow: 0 0 20px var(--icon-shadow, rgba(129, 138, 248, 0.15));
          }
          .process-badge {
            font-size: 10px;
            font-weight: 800;
            color: var(--text-muted);
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .process-title {
            font-size: 18px;
            font-weight: 800;
            color: var(--text-primary);
            margin-bottom: 12px;
            letter-spacing: -0.01em;
          }
          .process-desc {
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.6;
            margin: 0;
          }

          @media (max-width: 950px) {
            .process-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 600px) {
            .process-grid {
              grid-template-columns: 1fr;
            }
          }

          /* Responsive Page Layout Rules */
          .hero-title {
            font-size: 58px;
            font-weight: 800;
            line-height: 1.1;
            letter-spacing: -0.03em;
            margin-bottom: 24px;
            background: linear-gradient(to bottom, #ffffff 30%, #a5b4fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .hero-buttons {
            display: flex;
            gap: 16px;
            margin-bottom: 80px;
          }
          .commitment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          .why-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            width: 100%;
          }

          @media (max-width: 768px) {
            .hero-title {
              font-size: 38px !important;
            }
            .hero-buttons {
              flex-direction: column;
              width: 100%;
              gap: 12px;
            }
            .hero-buttons a {
              width: 100% !important;
              text-align: center;
              box-sizing: border-box;
            }
            .commitment-grid {
              grid-template-columns: 1fr !important;
              gap: 24px;
            }
            .why-grid {
              grid-template-columns: 1fr !important;
            }
            .github-star-btn {
              display: none !important;
            }
          }
        `}} />
        <div className="glow-orb-purple" />
        <div className="glow-orb-indigo" />
        <div className="glow-orb-rose" />
      </div>

      {/* Header */}
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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

            {/* Premium Logo Typography */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
                <span style={{ fontSize: "19px", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.03em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Queue</span>
                <span style={{ fontSize: "19px", fontWeight: "900", background: "linear-gradient(135deg, #a855f7 30%, #f43f5e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Flow</span>
              </div>
            </div>
          </div>
          
          {/* Version Capsule */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(129, 138, 248, 0.08)", border: "1px solid rgba(129, 138, 248, 0.2)", borderRadius: "99px", padding: "4px 10px", fontSize: "10px", fontWeight: "700", color: "#a5b4fc" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#818cf8", display: "inline-block", boxShadow: "0 0 8px #818cf8" }} />
            v1.2
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="header-nav" style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 850px) {
              .header-nav {
                display: none !important;
              }
            }
            .nav-link {
              color: var(--text-secondary);
              text-decoration: none;
              font-size: 13px;
              font-weight: 500;
              transition: all 0.3s;
              position: relative;
              padding: 6px 0;
            }
            .nav-link:hover, .nav-link.active {
              color: var(--text-primary);
            }
            .nav-indicator {
              position: absolute;
              bottom: -4px;
              left: 0;
              right: 0;
              height: 2px;
              background: linear-gradient(90deg, #818cf8, #a855f7);
              border-radius: 99px;
              box-shadow: 0 0 8px rgba(129, 138, 248, 0.6);
              animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes slideIn {
              from { transform: scaleX(0); opacity: 0; }
              to { transform: scaleX(1); opacity: 1; }
            }
          `}} />
          <a href="#how-it-works" className={`nav-link ${activeSection === "how-it-works" ? "active" : ""}`}>
            Commitment Gap
            {activeSection === "how-it-works" && <span className="nav-indicator" />}
          </a>
          <a href="#playground" className={`nav-link ${activeSection === "playground" ? "active" : ""}`}>
            Playground
            {activeSection === "playground" && <span className="nav-indicator" />}
          </a>
          <a href="#workflow" className={`nav-link ${activeSection === "workflow" ? "active" : ""}`}>
            Workflow
            {activeSection === "workflow" && <span className="nav-indicator" />}
          </a>
        </nav>

        {/* Right Actions */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {/* GitHub Star Count */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="github-star-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: "700",
              color: "var(--text-secondary)",
              textDecoration: "none",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            ★ Star <span style={{ color: "var(--text-muted)", marginLeft: "2px" }}>1.4k</span>
          </a>

          {isAuth ? (
            <Link href="/dashboard" className="btn-primary" style={{ textDecoration: "none", padding: "8px 16px", fontSize: "12px" }}>
              Enter Dashboard
            </Link>
          ) : (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Link
                href="/login"
                className="btn-ghost"
                style={{
                  textDecoration: "none",
                  padding: "8px 14px",
                  fontSize: "12px",
                  color: "var(--text-secondary)"
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-primary"
                style={{
                  textDecoration: "none",
                  padding: "8px 16px",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                Get Started <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="main-container">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "99px", padding: "6px 16px", color: "#a5b4fc", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "32px" }}>
          ✨ Streamline your external dependencies
        </div>

        <h1 className="hero-title">
          Track commitments,<br />not just tasks.
        </h1>

        <p style={{ fontSize: "19px", color: "var(--text-secondary)", maxWidth: "660px", lineHeight: "1.6", marginBottom: "40px" }}>
          Your todo list is for things <strong>you</strong> need to do.
          QueueFlow is for things <strong>other people</strong> promised you.
          Track quotes, client payments, vendor approvals, and legal reviews in one unified workspace.
        </p>

        <div className="hero-buttons">
          <Link href={isAuth ? "/dashboard" : "/register"} className="btn-primary" style={{ fontSize: "15px", padding: "14px 32px", textDecoration: "none" }}>
            {isAuth ? "Go to Dashboard" : "Start Tracking Free"}
          </Link>
          <a href="#how-it-works" className="btn-secondary" style={{ fontSize: "15px", padding: "14px 32px", textDecoration: "none" }}>
            Learn More
          </a>
        </div>

        {/* Commitment Gap Section */}
        <ScrollReveal>
          <div id="how-it-works" className="commitment-container">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(to right, #6366f1, #8b5cf6)" }} />
            
            <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "16px", color: "var(--text-primary)" }}>The Commitment Gap</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px", maxWidth: "600px" }}>
              Standard task managers fail when a task leaves your plate. Once you check off "Email Legal", you forget about it—but the work is not done. QueueFlow fills this gap.
            </p>
            
            <div className="commitment-grid">
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f43f5e", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", marginBottom: "16px" }}>
                  <span>✕</span> Todo List (Internal only)
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <li style={{ textDecoration: "line-through", opacity: 0.5 }}>✓ Email contractor for kitchen quote</li>
                  <li style={{ textDecoration: "line-through", opacity: 0.5 }}>✓ Submit planning permission files</li>
                  <li style={{ textDecoration: "line-through", opacity: 0.5 }}>✓ Send legal contract to legal team</li>
                </ul>
                <div style={{ marginTop: "24px", fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Once checked off, the item is hidden. You have no visibility on whether they have actually responded.
                </div>
              </div>

              <div style={{ background: "rgba(99, 102, 241, 0.03)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", marginBottom: "16px" }}>
                  <span>✓</span> QueueFlow Queue (External Tracked)
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <li style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>⏳ Kitchen renovation quote</span>
                    <span style={{ color: "var(--overdue)", fontSize: "11px", fontWeight: "700" }}>Overdue (8d)</span>
                  </li>
                  <li style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>⏳ Planning permission approval</span>
                    <span style={{ color: "var(--due-soon)", fontSize: "11px", fontWeight: "700" }}>Due Soon (3d)</span>
                  </li>
                  <li style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>⏳ Legal contract review</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>Waiting</span>
                  </li>
                </ul>
                <div style={{ marginTop: "24px", fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Surfaces outstanding tasks waiting on counterparties. Tracks latency, and alerts you when overdue.
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Interactive Features Grid */}
        <ScrollReveal>
          <div id="playground" style={{ width: "100%", marginBottom: "56px", textAlign: "center" }}>
            <div style={{ display: "inline-flex", gap: "6px", color: "#818cf8", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px", alignItems: "center" }}>
              <Sparkles size={12} /> Interactive Playground
            </div>
            <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "16px", color: "var(--text-primary)" }}>Try QueueFlow In Action</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              Explore the core engines that keep your projects unblocked.
            </p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", width: "100%", marginBottom: "96px", textAlign: "left" }} className="interactive-grid">
            <style dangerouslySetInnerHTML={{__html: `
              @media (max-width: 850px) {
                .interactive-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}} />
            
            <NudgeComposerSimulator />
            <UrgencyCalculatorSimulator />
          </div>
        </ScrollReveal>

        {/* Premium Horizontal Process Grid Section */}
        <ScrollReveal>
          <div id="workflow" style={{ width: "100%", marginBottom: "96px" }}>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <div style={{ display: "inline-flex", gap: "6px", color: "#a855f7", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px", alignItems: "center" }}>
                <Sparkles size={12} /> The Workflow
              </div>
              <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "16px", color: "var(--text-primary)" }}>How QueueFlow Works</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
                A simple, systematic workflow to track external obligations and ensure nothing slips through the cracks.
              </p>
            </div>

            <div className="process-grid">
              {/* Step 1 */}
              <div className="process-card" style={{ "--card-border-gradient": "linear-gradient(90deg, #818cf8, #4f46e5)", "--icon-bg": "rgba(129, 138, 248, 0.1)", "--icon-border": "rgba(129, 138, 248, 0.3)", "--icon-shadow": "rgba(129, 138, 248, 0.15)", "--icon-color": "#818cf8" } as any}>
                <div className="process-watermark">01</div>
                <div className="process-icon-wrapper" style={{ color: "var(--icon-color)" }}>
                  <Clock size={20} />
                </div>
                <div className="process-badge">Step 01</div>
                <h3 className="process-title">Log request</h3>
                <p className="process-desc">
                  Input what you're waiting on, specify target latency periods, and details of the expected contractor, client, or legal partner.
                </p>
              </div>

              {/* Step 2 */}
              <div className="process-card" style={{ "--card-border-gradient": "linear-gradient(90deg, #a855f7, #7c3aed)", "--icon-bg": "rgba(168, 85, 247, 0.1)", "--icon-border": "rgba(168, 85, 247, 0.3)", "--icon-shadow": "rgba(168, 85, 247, 0.15)", "--icon-color": "#a855f7" } as any}>
                <div className="process-watermark">02</div>
                <div className="process-icon-wrapper" style={{ color: "var(--icon-color)" }}>
                  <Bell size={20} />
                </div>
                <div className="process-badge">Step 02</div>
                <h3 className="process-title">Auto-track</h3>
                <p className="process-desc">
                  QueueFlow monitors timestamps in real-time, sorting items into Waiting, Due Soon, or Overdue based on latency calculations.
                </p>
              </div>

              {/* Step 3 */}
              <div className="process-card" style={{ "--card-border-gradient": "linear-gradient(90deg, #f43f5e, #e11d48)", "--icon-bg": "rgba(244, 63, 94, 0.1)", "--icon-border": "rgba(244, 63, 94, 0.3)", "--icon-shadow": "rgba(244, 63, 94, 0.15)", "--icon-color": "#f43f5e" } as any}>
                <div className="process-watermark">03</div>
                <div className="process-icon-wrapper" style={{ color: "var(--icon-color)" }}>
                  <Sparkles size={20} />
                </div>
                <div className="process-badge">Step 03</div>
                <h3 className="process-title">AI Nudge</h3>
                <p className="process-desc">
                  Draft professional follow-up templates in Warm, Neutral, or Firm tones utilizing Claude-powered contexts to speed up replies.
                </p>
              </div>

              {/* Step 4 */}
              <div className="process-card" style={{ "--card-border-gradient": "linear-gradient(90deg, #10b981, #059669)", "--icon-bg": "rgba(16, 185, 129, 0.1)", "--icon-border": "rgba(16, 185, 129, 0.3)", "--icon-shadow": "rgba(16, 185, 129, 0.15)", "--icon-color": "#10b981" } as any}>
                <div className="process-watermark">04</div>
                <div className="process-icon-wrapper" style={{ color: "var(--icon-color)" }}>
                  <BarChart2 size={20} />
                </div>
                <div className="process-badge">Step 04</div>
                <h3 className="process-title">Analyze</h3>
                <p className="process-desc">
                  Review resolution latency trends, log resolved outcomes, and identify slow counterparties who are stalling your flow.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Detailed Application Information */}
        <ScrollReveal>
          <div style={{ width: "100%", textAlign: "left", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "36px", textAlign: "center", color: "var(--text-primary)" }}>Why Professionals Choose QueueFlow</h2>
            
            <div className="why-grid">
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "32px", backdropFilter: "blur(12px)" }}>
                <div style={{ fontSize: "28px", marginBottom: "16px" }}>⚡</div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>High-Contrast Dashboard</h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  Drag-and-drop Kanban view styled with a premium deep-space dark theme. Status indicators automatically shift based on actual delay time, keeping you prioritized.
                </p>
              </div>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "32px", backdropFilter: "blur(12px)" }}>
                <div style={{ fontSize: "28px", marginBottom: "16px" }}>📧</div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>Automated Reports</h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  Receive custom daily or weekly summaries delivered to your inbox containing status shifts, recently overdue tasks, and items requiring follow-ups.
                </p>
              </div>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "32px", backdropFilter: "blur(12px)" }}>
                <div style={{ fontSize: "28px", marginBottom: "16px" }}>🛡️</div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>Isolated Multi-User Security</h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  Secure custom HS256 JWT sessions encrypt access, isolating database rows so your project logs remain completely private to your account.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "32px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)", position: "relative", zIndex: 10 }}>
        © {new Date().getFullYear()} QueueFlow. All rights reserved. Built for high-performance builders.
      </footer>
    </div>
  );
}
