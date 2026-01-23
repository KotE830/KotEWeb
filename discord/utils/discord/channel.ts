import { ChatInputCommandInteraction, GuildChannel, ChannelType } from "discord.js";
import client from "../../client";
import { sendError } from "./message";

/**
 * This function finds the voice channel the bot will join.
 * 1. If interaction is provided, the user's voice channel is prioritized.
 * 2. If no interaction is provided, the voice channel with the most members is prioritized.
 * 3. If no voice channel is found, null is returned.
 */
export async function getVoiceChannel(
  title: string,
  interaction?: ChatInputCommandInteraction
): Promise<GuildChannel | null> {
  if (!client || !client.isReady()) {
    await sendError(title, "Discord bot is not ready", interaction);
    return null;
  }

  if (!client.shoukaku) {
    await sendError(title, "Shoukaku is not initialized", interaction);
    return null;
  }

  // Use guild from interaction if available, otherwise use first guild
  const guild = interaction?.guild || client.guilds.cache.first();
  if (!guild) {
    await sendError(title, "No guild found", interaction);
    return null;
  }

  let voiceChannel: GuildChannel | null = null;

  if (interaction) {
    // If interaction exists, prioritize user's channel
    const member = guild.members.cache.get(interaction.user.id);
    if (member?.voice?.channel) {
      voiceChannel = member.voice.channel;
    }
  }

  // Auto-select if user channel is not available or no interaction
  if (!voiceChannel) {
    // Prioritize voice channels with members
    const voiceChannels = Array.from(guild.channels.cache.values()).filter(
      (ch) => ch.type === ChannelType.GuildVoice && ch.isVoiceBased()
    );

    const channelsWithMembers = voiceChannels.filter((ch) => {
      if (ch.isVoiceBased() && "members" in ch) {
        const members = ch.members as any;
        return members && typeof members.size === "number" && members.size > 0;
      }
      return false;
    });

    if (channelsWithMembers.length > 0) {
      // Select channel with most members
      voiceChannel = channelsWithMembers.reduce((prev, curr) => {
        const prevSize = (prev.members as any)?.size || 0;
        const currSize = (curr.members as any)?.size || 0;
        return currSize > prevSize ? curr : prev;
      });
    } else if (voiceChannels.length > 0) {
      voiceChannel = voiceChannels[0];
    }
  }

  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    await sendError(title, "No voice channel found or you must be in a voice channel", interaction);
    return null;
  }

  return voiceChannel;
}

