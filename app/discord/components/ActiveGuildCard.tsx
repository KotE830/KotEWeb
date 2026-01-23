'use client';

import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "@/hooks/useTranslation";
import "@/app/styles/discord.css";

interface VoiceChannel {
  id: string;
  name: string;
}

interface Props {
  guild: {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    hasBot: boolean;
  };
  isSelected: boolean;
  onToggleSelect: () => void;
  onJoinSuccess?: (guildId: string, channelId: string) => void;
}

export default function ActiveGuildCard({
  guild,
  isSelected,
  onToggleSelect,
  onJoinSuccess,
}: Props) {
  const { t } = useTranslation();
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");

  useEffect(() => {
    if (isSelected && guild.hasBot) {
      fetchVoiceChannels();
    } else if (!isSelected) {
      // Reset when deselected
      setVoiceChannels([]);
      setSelectedChannel("");
    }
  }, [isSelected, guild.id]);

  async function fetchVoiceChannels() {
    setLoadingChannels(true);
    try {
      const response = await axios.get(`/api/discord/guilds/${guild.id}/channels`);
      setVoiceChannels(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        alert(t('discord.alert.botNotInServer'));
      } else {
        console.error("Error fetching voice channels:", error);
        alert(t('discord.alert.fetchVoiceChannelListFailed'));
      }
    } finally {
      setLoadingChannels(false);
    }
  }

  async function handleJoinChannel() {
    if (!selectedChannel) {
      alert(t('discord.alert.selectServerAndChannel'));
      return;
    }

    try {
      const response = await axios.post("/api/join", {
        guildId: guild.id,
        channelId: selectedChannel,
      });
      
      if (response.data.success) {
        // 성공 알림 제거 - 실패 알림만 표시
        if (onJoinSuccess) {
          onJoinSuccess(guild.id, selectedChannel);
        }
      }
    } catch (error: any) {
      console.error("Error joining channel:", error);
      alert(t('discord.alert.joinFailedPrefix') + (error.response?.data?.message || error.message));
    }
  }
  return (
    <div
      className={isSelected ? "discord-guild-card discord-guild-card-selected" : "discord-guild-card"}
      onClick={onToggleSelect}
    >
      <div className="discord-guild-info">
        {guild.icon && (
          <img
            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
            alt={guild.name}
            className="discord-guild-icon"
          />
        )}
        <div style={{ flex: 1 }}>
          <div className="discord-guild-name">
            {guild.name}
          </div>
          <div className="discord-guild-role">
            {guild.owner ? t("discord.guild.role.owner") : t("discord.guild.role.member")}
          </div>
        </div>
        <span className="discord-badge">
          {t("discord.badge.botAvailable")}
        </span>
      </div>

      {isSelected && (
        <div
          className="discord-channel-select-container"
          onClick={(e) => e.stopPropagation()}
        >
          {loadingChannels ? (
            <div className="discord-loading-text">{t("discord.loading.channelList")}</div>
          ) : voiceChannels.length > 0 ? (
            <div className="discord-channel-select-wrapper">
              <div style={{ flex: 1 }}>
                <label className="discord-channel-select-label">
                  {t("discord.label.selectVoiceChannel")}
                </label>
                <select
                  value={selectedChannel}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSelectedChannel(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="discord-channel-select"
                >
                  <option value="">{t("discord.placeholder.selectChannel")}</option>
                  {voiceChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedChannel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinChannel();
                  }}
                  className="discord-btn-join"
                >
                  {t("discord.button.joinChannel")}
                </button>
              )}
            </div>
          ) : (
            <div className="discord-empty-text">{t("discord.empty.voiceChannels")}</div>
          )}
        </div>
      )}
    </div>
  );
}


