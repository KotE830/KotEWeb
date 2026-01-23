'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useTranslation, LANGUAGE_OPTIONS } from "@/hooks/useTranslation";

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isBotRunning, setIsBotRunning] = useState("waiting...");
  const { language, setLanguage } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await axios.get("/api/auth/check");
        setIsAuthenticated(response.data.authenticated || false);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    async function checkBotStatus() {
      try {
        const result = await axios.get("/api/isboton");
        setIsBotRunning(result.data || "Off");
      } catch (error) {
        setIsBotRunning("Off");
      }
    }

    checkAuth();
    checkBotStatus();

    // Check bot status periodically (every 2 seconds)
    const botInterval = setInterval(checkBotStatus, 2000);

    return () => {
      clearInterval(botInterval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!langRef.current) return;
      if (e.target instanceof Node && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLangOption =
    LANGUAGE_OPTIONS.find((o) => o.code === language) ?? LANGUAGE_OPTIONS[0];

  return (
    <div className="header">
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <h1 style={{ margin: 0 }}>
          <a 
            href={isAuthenticated ? "/main" : "/"} 
            onClick={(e) => {
              e.preventDefault();
              const targetPath = isAuthenticated ? "/main" : "/";
              window.location.href = targetPath;
            }}
            style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}
          >
            KotE
          </a>
        </h1>
        {!loading && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            padding: "8px 16px",
            backgroundColor: "#1a1a1a",
            borderRadius: "6px",
            border: `2px solid ${isBotRunning === "Off" ? "#f44336" : "#4caf50"}`,
          }}>
            <div 
              className={isBotRunning !== "Off" ? "status-indicator-online" : "status-indicator-offline"}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: isBotRunning === "Off" ? "#f44336" : "#4caf50",
                boxShadow: isBotRunning === "Off" 
                  ? "0 0 8px rgba(244, 67, 54, 0.6)" 
                  : "0 0 8px rgba(76, 175, 80, 0.6)",
              }} 
            />
            <span style={{ color: "#aaa", fontSize: "13px", fontWeight: "500" }}>Bot:</span>
            <span style={{ 
              color: isBotRunning === "Off" ? "#f44336" : "#4caf50",
              fontWeight: "bold",
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              {isBotRunning === "Off" ? "Offline" : "Online"}
            </span>
          </div>
        )}
      </div>
      <div style={{ position: "absolute", top: "50%", right: "20px", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "12px" }}>
        {!loading && isAuthenticated && isBotRunning !== "Off" && (
          <div className="menu" style={{ position: "static", transform: "none" }}>
            <Link href="/song" className="link">
              Song
            </Link>
            <Link href="/tag" className="link">
              Tag
            </Link>
            <Link href="/discord" className="link">
              Discord
            </Link>
          </div>
        )}
        <div ref={langRef} style={{ position: "relative", marginLeft: "12px" }}>
          <button
            onClick={() => setLangOpen((v) => !v)}
            style={{
              padding: "8px 12px",
              background: "linear-gradient(135deg, #2a2a3e 0%, #252538 100%)",
              color: "#a0c4ff",
              border: "1px solid #4a5568",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #35354a 0%, #2f2f44 100%)";
              e.currentTarget.style.borderColor = "#6b8dd6";
              e.currentTarget.style.color = "#c5d8ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #2a2a3e 0%, #252538 100%)";
              e.currentTarget.style.borderColor = "#4a5568";
              e.currentTarget.style.color = "#a0c4ff";
            }}
          >
            <img 
              src={currentLangOption.flag} 
              alt={currentLangOption.label}
              style={{ width: '20px', height: '15px', objectFit: 'cover' }}
            />
            <span>{currentLangOption.label}</span>
            <span style={{ opacity: 0.9 }}>{langOpen ? "▲" : "▼"}</span>
          </button>

          {langOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: "180px",
                background: "#1e1e2e",
                border: "1px solid #4a5568",
                borderRadius: "8px",
                boxShadow: "0 10px 24px rgba(0, 0, 0, 0.35)",
                overflow: "hidden",
                zIndex: 9999,
              }}
            >
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = opt.code === language;
                return (
                  <button
                    key={opt.code}
                    onClick={() => {
                      setLanguage(opt.code);
                      setLangOpen(false);
                    }}
                    className="language-option"
                    data-active={active}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      background: active ? "#2a2a3e" : "transparent",
                      color: active ? "#ffffff" : "#c5d8ff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: active ? "700" : "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (active) {
                        e.currentTarget.style.background = "#35354a";
                      } else {
                        e.currentTarget.style.background = "rgba(197, 216, 255, 0.08)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (active) {
                        e.currentTarget.style.background = "#2a2a3e";
                      } else {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <img 
                      src={opt.flag} 
                      alt={opt.label}
                      style={{ width: '24px', height: '18px', objectFit: 'cover' }}
                    />
                    <span>{opt.label}</span>
                    {active && <span style={{ color: "#4a9eff", marginLeft: "auto" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

