"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" style={{ maxWidth: "420px", width: "100%", padding: "36px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          {/* Logo container */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            {/* Premium SVG QueueFlow Logo Mark */}
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 10px rgba(129, 138, 248, 0.45))" }}>
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
            <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
              <span style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.03em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Queue</span>
              <span style={{ fontSize: "20px", fontWeight: "900", background: "linear-gradient(135deg, #a855f7 30%, #f43f5e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Flow</span>
            </div>
          </div>
          <h1 className="modal-title" style={{ fontSize: "22px", marginBottom: "6px", textAlign: "center" }}>Welcome Back</h1>
          <p className="modal-subtitle">Enter your credentials to access your QueueFlow dashboard</p>
        </div>

        {error && (
          <div style={{ background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "8px", padding: "10px 14px", color: "#fda4af", fontSize: "12px", marginBottom: "20px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }}
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "12px", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "var(--accent-primary)", fontWeight: "600", textDecoration: "none" }}>
            Create one free
          </Link>
        </div>
      </div>
    </div>
  );
}
