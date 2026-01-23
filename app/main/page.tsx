'use client';

import { useEffect, useState } from "react";
import Queue from "@/components/Queue";
import TrackAddButton from "@/components/TrackAddButton";
import axios from "axios";
import useRequireAuth from "@/hooks/useRequireAuth";
import { useTranslation } from "@/hooks/useTranslation";

interface TrackInfo {
  title: string;
  artist: string;
  length?: number;
  thumbnail?: string;
  uri?: string;
}

export default function Main() {
  const { loading, isAuthenticated } = useRequireAuth();
  const { t } = useTranslation();
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [queue, setQueue] = useState<TrackInfo[]>([]);
  const [isBotRunning, setIsBotRunning] = useState("waiting...");
  const [isInChannel, setIsInChannel] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<{ guildName: string; channelName: string } | null>(null);
  const [isRepeating, setIsRepeating] = useState(false);
  const [showBotControl, setShowBotControl] = useState(true);

  useEffect(() => {
    // Load data only if authenticated
    if (!isAuthenticated || loading) return;

    async function fetchData() {
      try {
        const resultQueue = await axios.get("/api/queue");
        const resultBot = await axios.get("/api/isboton");
        const resultChannel = await axios.get("/api/isinchannel");
        
        // API response format: { currentTrack: {...}, queue: [...], isRepeating: boolean }
        if (resultQueue.data) {
          setCurrentTrack(resultQueue.data.currentTrack || null);
          setQueue(resultQueue.data.queue || []);
          setIsRepeating(resultQueue.data.isRepeating || false);
        } else {
          // Compatibility with previous format (array)
          setCurrentTrack(null);
          setQueue(Array.isArray(resultQueue.data) ? resultQueue.data : []);
          setIsRepeating(false);
        }
        
        setIsBotRunning(resultBot.data || "Off");
        setIsInChannel(resultChannel.data?.isInChannel || false);
        
        // Always show bot control button
        setShowBotControl(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsBotRunning("Off");
        setCurrentTrack(null);
        setQueue([]);
        setIsInChannel(false);
        setShowBotControl(true);
      }
    }

    fetchData();
    fetchCurrentChannel();

    // Check channel status periodically (every 2 seconds)
    const channelInterval = setInterval(async () => {
      try {
        const resultChannel = await axios.get("/api/isinchannel");
        setIsInChannel(resultChannel.data?.isInChannel || false);
        await fetchCurrentChannel();
      } catch (error) {
        console.error("Error checking channel status:", error);
      }
    }, 2000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(channelInterval);
    };
  }, [isAuthenticated, loading]);

  // Show loading screen if loading or not authenticated
  if (loading || !isAuthenticated) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <span>{t('main.loading')}</span>
      </div>
    );
  }

  async function botOnOff() {
    try {
      let result;
      if (isBotRunning === "Off") {
        result = await axios.get("/api/boton");
      } else {
        result = await axios.get("/api/botoff");
      }
      setIsBotRunning(result.data || "Off");
    } catch (error) {
      console.error("Error toggling bot:", error);
      alert(t('main.alert.botStatusFailed'));
    }
  }

  async function toggleChannel() {
    try {
      if (isInChannel) {
        const result = await axios.post("/api/leave");
        if (!result.data || !result.data.success) {
          alert(t('main.alert.leaveChannelFailed'));
        }
        // Periodic polling will automatically update the status
      } else {
        const result = await axios.post("/api/join");
        if (!result.data || !result.data.success) {
          alert(t('main.alert.joinChannelFailed'));
        }
        // Periodic polling will automatically update the status
      }
    } catch (error) {
      console.error("Error toggling channel:", error);
      alert(t('main.alert.requestFailed') + " " + ((error as any).response?.data?.message || (error as any).message));
    }
  }

  async function ping() {
    try {
      const result = await axios.get("/api/ping");
      console.log(result.data);
    } catch (error) {
      console.error("Error pinging:", error);
    }
  }

  async function toggleRepeat() {
    try {
      const newRepeatState = !isRepeating;
      const result = await axios.post("/api/repeat", { isRepeating: newRepeatState });
      if (result.data.success) {
        setIsRepeating(newRepeatState);
      } else {
        alert(t('main.alert.repeatToggleFailed'));
      }
    } catch (error) {
      console.error("Error toggling repeat:", error);
      alert(t('main.alert.repeatToggleFailed'));
    }
  }

  async function fetchCurrentChannel() {
    try {
      // Get Discord current control information
      const controlResponse = await axios.get("/api/get-current-control");
      if (controlResponse.data.guildId && controlResponse.data.channelId) {
        // Try to find in active channels first
        const channelsResponse = await axios.get("/api/active-channels");
        const channels = channelsResponse.data.channels || [];
        const channel = channels.find(
          (c: any) => c.guildId === controlResponse.data.guildId && c.channelId === controlResponse.data.channelId
        );
        
        if (channel) {
          // Found in active channels
          setCurrentChannel({
            guildName: channel.guildName,
            channelName: channel.channelName,
          });
        } else {
          // Current control exists but not in active channels (bot not in channel)
          // Still display it if we have guild/channel info from control response
          if (controlResponse.data.guildName && controlResponse.data.channelName) {
            setCurrentChannel({
              guildName: controlResponse.data.guildName,
              channelName: controlResponse.data.channelName,
            });
          } else {
            // Fallback: try to get from all guilds
            try {
              const guildsResponse = await axios.get("/api/guilds");
              const guilds = guildsResponse.data.guilds || [];
              const guild = guilds.find((g: any) => g.id === controlResponse.data.guildId);
              if (guild) {
                setCurrentChannel({
                  guildName: guild.name,
                  channelName: `Channel ${controlResponse.data.channelId}`,
                });
              } else {
                setCurrentChannel(null);
              }
            } catch {
              setCurrentChannel(null);
            }
          }
        }
      } else {
        // If no current control, use first from active channels
        const channelsResponse = await axios.get("/api/active-channels");
        const channels = channelsResponse.data.channels || [];
        if (channels.length > 0) {
          setCurrentChannel({
            guildName: channels[0].guildName,
            channelName: channels[0].channelName,
          });
        } else {
          setCurrentChannel(null);
        }
      }
    } catch (error) {
      console.error("Error fetching current channel:", error);
      setCurrentChannel(null);
    }
  }

  async function clearQueue() {
    try {
      const result = await axios.post("/api/clear-queue");
      if (result.data.success) {
        setQueue([]);
        alert(t('main.alert.queueCleared'));
      } else {
        alert(t('main.alert.clearQueueFailed'));
      }
    } catch (error) {
      console.error("Error clearing queue:", error);
      alert(t('main.alert.clearQueueFailed'));
    }
  }

  async function removeFromQueue(index: number) {
    try {
      const result = await axios.post(`/api/songs/removequeue?index=${index}`);
      if (result.data.success) {
        // Refresh queue data
        const queueResponse = await axios.get("/api/queue");
        if (queueResponse.data) {
          setQueue(queueResponse.data.queue || []);
        }
      } else {
        alert(t('main.alert.removeTrackFailed'));
      }
    } catch (error) {
      console.error("Error removing from queue:", error);
      alert(t('main.alert.removeTrackFailed'));
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ margin: 0 }}>{t('main.title')}</h1>
        {showBotControl && (
        <button 
          onClick={botOnOff}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = isBotRunning === "Off"
              ? "0 6px 16px rgba(76, 175, 80, 0.4)"
              : "0 6px 16px rgba(244, 67, 54, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = isBotRunning === "Off"
              ? "0 4px 12px rgba(76, 175, 80, 0.3)"
              : "0 4px 12px rgba(244, 67, 54, 0.3)";
          }}
          style={{
            padding: "10px 20px",
            background: isBotRunning === "Off" 
              ? "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)"
              : "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
            boxShadow: isBotRunning === "Off"
              ? "0 4px 12px rgba(76, 175, 80, 0.3)"
              : "0 4px 12px rgba(244, 67, 54, 0.3)",
            borderRadius: "6px",
            border: "none",
            color: "#fff",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          {isBotRunning === "Off" ? t('main.bot.on') : t('main.bot.off')}
        </button>
        )}
      </div>
      
      {/* Display current channel/server being controlled */}
      {currentChannel && (
        <div style={{ 
          marginBottom: "20px", 
          padding: "15px", 
          backgroundColor: "#1a1a1a", 
          borderRadius: "8px", 
          border: "2px solid #4a9eff" 
        }}>
          <div style={{ color: "#4a9eff", fontWeight: "bold", marginBottom: "8px" }}>
            {t('main.currentChannel')}
          </div>
          <div style={{ color: "#e0e0e0" }}>
            <div style={{ marginBottom: "5px" }}>
              <strong>{t('main.label.server')}</strong> {currentChannel.guildName}
            </div>
            <div>
              <strong>{t('main.label.channel')}</strong> {currentChannel.channelName}
            </div>
          </div>
        </div>
      )}

      {/* Show notice only if bot is off */}
      {isBotRunning === "Off" ? (
        <div style={{ 
          padding: "40px", 
          textAlign: "center", 
          backgroundColor: "#1a1a1a", 
          borderRadius: "8px",
          border: "2px solid #f44336"
        }}>
          <h2 style={{ color: "#f44336", marginBottom: "15px" }}>{t('main.bot.off.title')}</h2>
          <p style={{ color: "#aaa", fontSize: "16px" }}>
            {t('main.bot.off.description')}
          </p>
        </div>
      ) : (
        <>
          {/* Discord bot control buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button 
                onClick={toggleChannel}
                disabled={!currentChannel}
                onMouseEnter={(e) => {
                  if (!currentChannel) return;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = isInChannel
                    ? "0 6px 16px rgba(255, 152, 0, 0.4)"
                    : "0 6px 16px rgba(74, 158, 255, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = isInChannel
                    ? "0 4px 12px rgba(255, 152, 0, 0.3)"
                    : "0 4px 12px rgba(74, 158, 255, 0.3)";
                }}
                style={{
                  padding: "10px 20px",
                  background: !currentChannel
                    ? "linear-gradient(135deg, #666 0%, #555 100%)"
                    : isInChannel
                    ? "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)"
                    : "linear-gradient(135deg, #4a9eff 0%, #357abd 100%)",
                  boxShadow: !currentChannel
                    ? "none"
                    : isInChannel
                    ? "0 4px 12px rgba(255, 152, 0, 0.3)"
                    : "0 4px 12px rgba(74, 158, 255, 0.3)",
                  borderRadius: "6px",
                  border: "none",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: !currentChannel ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  opacity: !currentChannel ? 0.6 : 1,
                }}
              >
                {isInChannel ? t('main.button.leaveChannel') : t('main.button.joinChannel')}
              </button>
              <button 
                onClick={ping}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(156, 39, 176, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(156, 39, 176, 0.3)";
                }}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)",
                  boxShadow: "0 4px 12px rgba(156, 39, 176, 0.3)",
                  borderRadius: "6px",
                  border: "none",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {t('main.button.ping')}
              </button>
            </div>
            {isInChannel && (
              <button 
                onClick={clearQueue}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(244, 67, 54, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(244, 67, 54, 0.3)";
                }}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                  boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
                  borderRadius: "6px",
                  border: "none",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {t('main.button.clearQueue')}
              </button>
            )}
          </div>
          
          {/* Now Playing */}
          <div style={{ marginTop: "30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0 }}>{t('main.nowPlaying')}</h2>
              {isInChannel && (
                <button
                  onClick={toggleRepeat}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = isRepeating
                      ? "0 6px 16px rgba(156, 39, 176, 0.4)"
                      : "0 6px 16px rgba(100, 100, 100, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isRepeating
                      ? "0 4px 12px rgba(156, 39, 176, 0.3)"
                      : "0 4px 12px rgba(100, 100, 100, 0.3)";
                  }}
                  style={{
                    padding: "8px 16px",
                    background: isRepeating
                      ? "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)"
                      : "linear-gradient(135deg, #666 0%, #555 100%)",
                    boxShadow: isRepeating
                      ? "0 4px 12px rgba(156, 39, 176, 0.3)"
                      : "0 4px 12px rgba(100, 100, 100, 0.3)",
                    borderRadius: "6px",
                    border: "none",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  title={isRepeating ? t('main.repeat.on') : t('main.repeat.off')}
                >
                  <span style={{ fontSize: "18px" }}>🔁</span>
                  <span>{isRepeating ? t('main.repeat.on') : t('main.repeat.off')}</span>
                </button>
              )}
            </div>
            {currentTrack ? (
              <div style={{ 
                padding: "15px", 
                backgroundColor: "#1a1a1a", 
                borderRadius: "8px",
                border: "2px solid #4a9eff"
              }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
                  {currentTrack.title}
                </div>
                <div style={{ color: "#aaa", marginBottom: "8px" }}>
                  {t('main.label.by')} {currentTrack.artist}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px", flexWrap: "wrap" }}>
                  <div style={{ color: "#888", fontSize: "14px" }}>
                    ⏱️ {t('main.label.length')} {currentTrack.length 
                      ? `${Math.floor(currentTrack.length / 60)}:${(currentTrack.length % 60).toString().padStart(2, "0")}`
                      : "N/A"}
                  </div>
                  {currentTrack.uri && (
                    <a
                      href={currentTrack.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 158, 255, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(74, 158, 255, 0.3)";
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "linear-gradient(135deg, #4a9eff 0%, #357abd 100%)",
                        boxShadow: "0 2px 8px rgba(74, 158, 255, 0.3)",
                        borderRadius: "4px",
                        color: "#fff",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span>🔗</span>
                      <span>{t('main.button.openUrl')}</span>
                    </a>
                  )}
                  <TrackAddButton track={currentTrack} />
                </div>
                {currentTrack.thumbnail && (
                  <img 
                    src={currentTrack.thumbnail} 
                    alt={currentTrack.title}
                    style={{ 
                      maxWidth: "200px", 
                      marginTop: "10px", 
                      borderRadius: "4px" 
                    }}
                  />
                )}
              </div>
            ) : (
              <div style={{ padding: "15px", color: "#888" }}>
                {t('main.empty.noTrack')}
              </div>
            )}
          </div>
          
          {/* Queue */}
          <div style={{ marginTop: "30px", marginBottom: "40px" }}>
            <h2>{t('main.queue')}</h2>
            {queue.length > 0 ? (
              <>
                {(() => {
                  const totalLength = queue.reduce((sum, track) => sum + (track.length || 0), 0);
                  const totalMinutes = Math.floor(totalLength / 60);
                  const totalSeconds = totalLength % 60;
                  const totalTimeStr = totalLength > 0 
                    ? `${totalMinutes}:${totalSeconds.toString().padStart(2, "0")}` 
                    : "";
                  
                  return (
                    <div style={{ marginBottom: "15px", color: "#aaa", fontSize: "14px" }}>
                      {t('main.label.totalLength')} {totalTimeStr || "N/A"} ({queue.length} {t('main.label.tracks')})
                    </div>
                  );
                })()}
                <ul className="queue">
                  {queue.map((track, index) => (
                    <Queue key={index} track={track} index={index} onRemove={removeFromQueue} />
                  ))}
                </ul>
              </>
            ) : (
              <div style={{ padding: "15px", color: "#888" }}>
                {t('main.queue.empty')}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

