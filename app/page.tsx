'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import DiscordPageContent from "./discord-page-content";
import { useTranslation } from "@/hooks/useTranslation";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await axios.get("/api/auth/check", {
          timeout: 10000,
        });
        const authenticated = response.data.authenticated || false;
        setIsAuthenticated(authenticated);

        // Redirect to main page if authenticated
        if (authenticated) {
          router.push("/main");
        }
      } catch (error: any) {
        // API 요청 실패 시에도 페이지는 표시 (에러는 조용히 처리)
        if (error?.code !== 'ECONNABORTED' && error?.message !== 'timeout of 10000ms exceeded') {
          console.error("Auth check failed:", error?.message || error);
        }
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    
    // 즉시 로딩 완료로 표시하고, 백그라운드에서 인증 확인
    setLoading(false);
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div style={{ 
        padding: "20px", 
        textAlign: "center",
        color: "#e0e0e0",
        minHeight: "400px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        Loading...
      </div>
    );
  }

  // Display Discord page content + description if not authenticated
  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      <DiscordPageContent />

      <div style={{ marginTop: "60px", padding: "40px", backgroundColor: "#1a1a1a", borderRadius: "8px" }}>
        <h2 style={{ color: "#e0e0e0", marginBottom: "20px" }}>{t('home.title')}</h2>
        <div style={{ color: "#aaa", lineHeight: "1.8" }}>
          <p style={{ marginBottom: "15px" }}>
            {t('home.description1')}
          </p>
          <p style={{ marginBottom: "15px" }}>
            {t('home.description2')}
          </p>
          <p style={{ marginBottom: "15px" }}>
            {t('home.description3')}
          </p>
        </div>
      </div>
    </div>
  );
}
