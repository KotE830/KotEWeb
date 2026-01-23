import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../types/command";
import { sendError, sendMessage, getGuildAndShoukaku, getQueue, type Track } from "../../utils";
import client from "../../client";

class LeaveCommand implements Command {
  readonly title = "Leave";
  readonly description = "Leave the voice channel";
  readonly data: SlashCommandBuilder;

  constructor() {
    this.data = new SlashCommandBuilder()
      .setName(this.title.toLowerCase())
      .setDescription(this.description);
  }

  async execute(interaction?: ChatInputCommandInteraction): Promise<void> {
    const result = await getGuildAndShoukaku(this.title, interaction);
    if (!result) {
      return;
    }

    const { guild, shoukaku } = result;
    const player = shoukaku.players.get(guild.id);

    if (!player) {
      await sendError(this.title, "Not connected to any voice channel", interaction);
      return;
    }

    try {
      // Save current playback position to database before leaving
      const currentTrack = (player as any)._currentTrack as Track | null;
      const queueArray = getQueue(guild.id);
      
      // Use player.position directly (convert milliseconds to seconds)
      let position: number | undefined = undefined;
      if (currentTrack) {
        const playerPosition = (player as { position?: number }).position;
        if (playerPosition !== undefined && playerPosition !== null) {
          position = Math.floor(playerPosition / 1000); // in seconds
        }
      }

      // Save currently playing track info and position to database
      if (currentTrack || queueArray.length > 0) {
        try {
          const { QueueService } = await import("../../../database");
          const queueService = new QueueService();
          await queueService.saveQueue(guild.id, currentTrack, queueArray, position);
          console.log(`✓ Saved playback position ${position !== undefined ? `${position}s` : 'N/A'} and queue for guild ${guild.id}`);
        } catch (error) {
          console.error(`Failed to save playback position when leaving:`, error);
        }
      }

      await shoukaku.leaveVoiceChannel(guild.id);
      
      if (interaction) {
        await sendMessage(this.title, "Left the voice channel", interaction);
      } else {
        console.log(`✓ Left voice channel for guild ${guild.id}`);
      }
    } catch (error) {
      console.error(`Error leaving voice channel for guild ${guild.id}:`, error);
      const errorMsg = error instanceof Error ? error.message : "Failed to leave voice channel";
      await sendError(this.title, errorMsg, interaction);
    }
  }
}

export default new LeaveCommand();
