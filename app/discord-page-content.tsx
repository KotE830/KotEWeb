'use client';

import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "@/hooks/useTranslation";
import DiscordLoginPrompt from "@/components/DiscordLoginPrompt";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  displayName: string;
}

export default function DiscordPageContent() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DiscordUser | null>(null);
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await axios.get("/api/auth/check", {
          timeout: 10000,
        });
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUser(response.data.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error: any) {
        // API 요청 실패 시에도 페이지는 표시 (에러는 조용히 처리)
        if (error?.code !== 'ECONNABORTED' && error?.message !== 'timeout of 10000ms exceeded') {
          console.error("Error checking auth:", error?.message || error);
        }
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    
    // 즉시 로딩 완료로 표시하고, 백그라운드에서 인증 확인
    setLoading(false);
    checkAuth();
  }, []);

  async function handleLogin() {
    try {
      const response = await axios.get("/api/auth/login", {
        timeout: 10000,
      });
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        console.error("Invalid response from login endpoint:", response.data);
        alert(t('discord.alert.loginFailed') + ': Invalid response');
      }
    } catch (error: any) {
      console.error("Error initiating login:", error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error';
      alert(t('discord.alert.loginFailed') + ': ' + errorMessage);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <span>{t('discord.loading')}</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <DiscordLoginPrompt onLogin={handleLogin} />
    );
  }

  return null; // If authenticated, handled by actual Discord page
}

