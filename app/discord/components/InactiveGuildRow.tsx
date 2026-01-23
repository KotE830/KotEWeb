'use client';

import React from "react";
import axios from "axios";
import { useTranslation } from "@/hooks/useTranslation";
import "@/app/styles/discord.css";

interface Props {
  guild: {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
  };
}

export default function InactiveGuildRow({
  guild,
}: Props) {
  const { t } = useTranslation();

  async function handleInviteBot() {
    try {
      const response = await axios.get(`/api/discord/invite/${guild.id}`);
      // Open invite link in new window
      window.open(response.data.inviteUrl, '_blank');
    } catch (error) {
      console.error("Error generating invite link:", error);
      alert(t('discord.alert.generateInviteFailed'));
    }
  }
  return (
    <div className="discord-inactive-guild">
      <div className="discord-guild-info">
        {guild.icon && (
          <img
            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
            alt={guild.name}
            className="discord-guild-icon"
          />
        )}
        <div>
          <div className="discord-guild-name">
            {guild.name}
          </div>
          <div className="discord-guild-role">
            {guild.owner ? t("discord.guild.role.owner") : t("discord.guild.role.member")}
          </div>
        </div>
      </div>
      <button
        onClick={handleInviteBot}
        className="discord-btn-add-bot"
      >
        {t("discord.button.addBot")}
      </button>
    </div>
  );
}


