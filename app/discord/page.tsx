'use client';

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import DiscordLoginPrompt from "@/components/DiscordLoginPrompt";
import ActiveGuildCard from "./components/ActiveGuildCard";
import InactiveGuildRow from "./components/InactiveGuildRow";
import "@/app/styles/discord.css";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  hasBot: boolean;
  botPermissions?: number;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  displayName: string;
}

interface ActiveChannel {
  guildId: string;
  guildName: string;
  channelId: string;
  channelName: string;
}

export default function DiscordPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [activeChannels, setActiveChannels] = useState<ActiveChannel[]>([]);
  const [currentGuildId, setCurrentGuildId] = useState<string | null>(null);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);

  useEffect(() => {
    // Initial loading: load data in parallel with authentication check
    async function loadInitialData() {
      setAuthLoading(true);
      
      try {
        // Check authentication
        const authResponse = await axios.get("/api/auth/check");
        
        if (authResponse.data.authenticated) {
          setIsAuthenticated(true);
          setUser(authResponse.data.user);
          
          // After authentication check, call remaining APIs in parallel
          setGuildsLoading(true);
          
          await Promise.all([
            fetchGuilds(),
            fetchActiveChannels(),
            fetchCurrentControl(),
          ]).catch((error: any) => {
            // If authentication error, redirect immediately
            if (error.response?.status === 401 || error.response?.status === 403) {
              router.push("/");
              return;
            }
            console.error("Error loading initial data:", error);
          });
        } else {
          setIsAuthenticated(false);
          setUser(null);
          // Redirect to home if not logged in
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
        setUser(null);
        // Redirect to home on authentication error
        router.push("/");
      } finally {
        setAuthLoading(false);
      }
    }

    loadInitialData();
  }, [router]);

  // Periodically check authentication and update active channel information (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        // Check authentication status
        const authResponse = await axios.get("/api/auth/check");
        if (!authResponse.data.authenticated) {
          // Authentication lost, redirect immediately
          router.push("/");
          return;
        }
        // Update active channels if still authenticated
        fetchActiveChannels();
      } catch (error: any) {
        // If 401 or auth error, redirect immediately
        if (error.response?.status === 401 || error.response?.status === 403) {
          router.push("/");
          return;
        }
        // For other errors, just log and continue
        console.error("Error checking auth or fetching channels:", error);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, router]);

  async function fetchCurrentControl() {
    try {
      const response = await axios.get("/api/get-current-control");
      if (response.data.guildId && response.data.channelId) {
        setCurrentGuildId(response.data.guildId);
        setCurrentChannelId(response.data.channelId);
      }
    } catch (error: any) {
      // If authentication error, redirect immediately
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push("/");
        return;
      }
      console.error("Error fetching current control:", error);
    }
  }

  async function handleLogin() {
    try {
      const response = await axios.get("/api/auth/login");
      // Redirect to OAuth2 URL
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error("Error initiating login:", error);
      alert(t('discord.alert.loginFailed'));
    }
  }

  async function handleLogout() {
    try {
      await axios.get("/api/auth/logout");
      // Redirect immediately after logout
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      // Redirect even if logout fails
      router.push("/");
    }
  }

  async function fetchGuilds() {
    try {
      const response = await axios.get("/api/discord/guilds");
      setGuilds(response.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Authentication lost, redirect immediately
        setIsAuthenticated(false);
        router.push("/");
      } else {
        console.error("Error fetching guilds:", error);
        alert(t('discord.alert.fetchServerListFailed'));
      }
    } finally {
      setGuildsLoading(false);
    }
  }

  async function fetchActiveChannels() {
    try {
      const response = await axios.get("/api/active-channels");
      const channels = response.data.channels || [];
      setActiveChannels(channels);
      
      // Auto-set if only one active channel and no current selection
      if (channels.length === 1 && !currentGuildId && !currentChannelId) {
        const channel = channels[0];
        setCurrentGuildId(channel.guildId);
        setCurrentChannelId(channel.channelId);
        // Save to session
        await axios.post("/api/set-current-control", {
          guildId: channel.guildId,
          channelId: channel.channelId,
        }).catch(err => console.error("Error setting current control:", err));
      }
    } catch (error: any) {
      // If authentication error, redirect immediately
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push("/");
        return;
      }
      console.error("Error fetching active channels:", error);
    }
  }

  function handleGuildToggle(guild: Guild) {
    // Toggle (close) if same server is clicked again
    if (selectedGuild?.id === guild.id) {
      setSelectedGuild(null);
    } else {
      setSelectedGuild(guild);
    }
  }

  function handleJoinSuccess(guildId: string, channelId: string) {
    setCurrentGuildId(guildId);
    setCurrentChannelId(channelId);
    fetchActiveChannels();
  }

  // Checking authentication
  if (authLoading) {
    return (
      <div className="discord-loading">
        <span>{t('discord.loading')}</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <DiscordLoginPrompt onLogin={handleLogin} />
    );
  }

  // Classify only servers with hasBot explicitly true as servers with bot
  const guildsWithBot = guilds.filter(g => g.hasBot === true);
  const guildsWithoutBot = guilds.filter(g => g.hasBot !== true);

  return (
    <div className="discord-page">
      {/* Header */}
      <div className="discord-header">
        <div>
          <h1 className="discord-header-title">{t('discord.title')}</h1>
          {user && (
            <p className="discord-header-account">
              {t('discord.logged.in.account')} <strong>{user.discriminator === '0' ? user.username : `${user.username}#${user.discriminator}`}</strong>
            </p>
          )}
        </div>
        <button 
          onClick={handleLogout}
          className="discord-btn-logout"
        >
          {t('discord.logout.button')}
        </button>
      </div>

      {/* Active channels */}
      {activeChannels.length > 0 && (
        <div className="discord-section-box">
          <h2 className="discord-section-title">{t('discord.section.activeChannels')}</h2>
          <div className="discord-list">
            {activeChannels.map((channel) => (
              <div
                key={`${channel.guildId}-${channel.channelId}`}
                className={currentGuildId === channel.guildId && currentChannelId === channel.channelId 
                  ? "discord-channel-card discord-channel-card-current" 
                  : "discord-channel-card"}
              >
                <div className="discord-channel-info">
                  <div
                    onClick={() => {
                      setCurrentGuildId(channel.guildId);
                      setCurrentChannelId(channel.channelId);
                      // Save to session
                      axios.post("/api/set-current-control", {
                        guildId: channel.guildId,
                        channelId: channel.channelId,
                      }).catch(err => console.error("Error setting current control:", err));
                    }}
                    style={{ flex: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                  >
                    <span className="discord-channel-icon">🔊</span>
                    <div style={{ flex: 1 }}>
                      <div className="discord-channel-name">
                        {channel.channelName}
                      </div>
                      <div className="discord-channel-server">
                        {t('discord.label.server')}: {channel.guildName}
                      </div>
                    </div>
                    {currentGuildId === channel.guildId && currentChannelId === channel.channelId && (
                      <span className="discord-badge-small">
                        {t('discord.section.currentControl')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(
                        t('discord.confirm.leaveChannel.prefix') +
                          channel.channelName +
                          t('discord.confirm.leaveChannel.suffix')
                      )) {
                        try {
                          const response = await axios.post("/api/leave", {
                            guildId: channel.guildId,
                          });
                          if (response.data.success) {
                            alert(t('discord.alert.leftChannel'));
                            await fetchActiveChannels();
                            // Reset if current selected channel is the one being left
                            if (currentGuildId === channel.guildId && currentChannelId === channel.channelId) {
                              setCurrentGuildId(null);
                              setCurrentChannelId(null);
                            }
                          } else {
                            alert(t('discord.alert.leaveFailedPrefix') + response.data.message);
                          }
                        } catch (error: any) {
                          console.error("Error leaving channel:", error);
                          alert(t('discord.alert.leaveFailedPrefix') + (error.response?.data?.message || error.message));
                        }
                      }
                    }}
                    className="discord-btn-leave"
                  >
                    {t('discord.button.leave')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List of servers with bot */}
      {guildsWithBot.length > 0 && (
        <div className="discord-section">
          <h2 className="discord-section-title-active">
            {t('discord.section.activeServers')} ({guildsWithBot.length})
          </h2>
          <div className="discord-list">
            {guildsWithBot.map((guild) => (
              <ActiveGuildCard
                key={guild.id}
                guild={guild}
                isSelected={selectedGuild?.id === guild.id}
                onToggleSelect={() => handleGuildToggle(guild)}
                onJoinSuccess={handleJoinSuccess}
              />
            ))}
          </div>
        </div>
      )}

      {/* List of servers without bot */}
      {guildsWithoutBot.length > 0 && (
        <div className="discord-section">
          <h2 className="discord-section-title-inactive">
            {t('discord.section.inactiveServers')} ({guildsWithoutBot.length})
          </h2>
          <p className="discord-section-description">
            {t('discord.inactiveServers.description')}
          </p>
          <div className="discord-list">
            {guildsWithoutBot.map((guild) => (
              <InactiveGuildRow
                key={guild.id}
                guild={guild}
              />
            ))}
          </div>
        </div>
      )}

      {guildsLoading && guilds.length === 0 && (
        <div className="discord-empty">
          {t('discord.loading.serverList')}
        </div>
      )}

      {!guildsLoading && guilds.length === 0 && (
        <div className="discord-empty">
          {t('discord.empty.servers')}
        </div>
      )}
    </div>
  );
}

