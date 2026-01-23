import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/command";
import client from "../../client";
import { sendMessage, sendError, getVoiceChannel, getQueue, restoreQueueFromDatabase, setupPlayerQueueListener } from "../../utils";

class JoinCommand implements Command {
  readonly title = "Join";
  readonly description = "Join the voice channel";
  readonly data: SlashCommandBuilder;

  constructor() {
    this.data = new SlashCommandBuilder()
      .setName(this.title.toLowerCase())
      .setDescription(this.description);
  }

  async execute(interaction?: ChatInputCommandInteraction): Promise<void> {
    const voiceChannel = await getVoiceChannel(this.title, interaction);

    if (!voiceChannel) {
      return;
    }

    // Check if client.shoukaku exists (also checked in getVoiceChannel but explicit check for TypeScript)
    if (!client.shoukaku) {
      await sendError(this.title, "Shoukaku is not initialized", interaction);
      return;
    }

    // Check if already connected
    const existingPlayer = client.shoukaku.players.get(voiceChannel.guild.id);
    if (existingPlayer) {
      await sendMessage(
        this.title,
        `Already connected to ${voiceChannel.name}`,
        interaction
      );
      return;
    }

    // Connect via Shoukaku
    try {
      const player = await client.shoukaku.joinVoiceChannel({
        guildId: voiceChannel.guild.id,
        channelId: voiceChannel.id,
        shardId: 0,
        deaf: true,
        mute: false,
      });

      if (player) {
        // Setup queue listener on Player
        setupPlayerQueueListener(player);

        // Try to restore queue from database (if memory queue is empty)
        const queue = getQueue(voiceChannel.guild.id);
        if (queue.length === 0) {
          const restoreResult = await restoreQueueFromDatabase(voiceChannel.guild.id);
          if (restoreResult.restored) {
            console.log(`✓ Queue restored from database for guild ${voiceChannel.guild.id}`);
            
            const currentTrack = (player as any)._currentTrack;
            const restoredQueue = getQueue(voiceChannel.guild.id);
            
            // Auto-play if there's a saved playing track with position
            if (currentTrack && restoreResult.position !== undefined) {
              const positionInMs = restoreResult.position * 1000; // Convert seconds to milliseconds
              
              // Play track (start from saved position - using position option)
              try {
                await player.playTrack({ 
                  track: { encoded: currentTrack.encoded },
                  position: positionInMs
                });
                (player as any)._currentTrack = currentTrack;
                console.log(`✓ Resuming playback from position ${restoreResult.position}s`);
              } catch (playError) {
                console.error(`Failed to resume playback from saved position:`, playError);
              }
            } 
            // If there's a saved playing track but no position info, play from beginning
            else if (currentTrack) {
              try {
                await player.playTrack({ track: { encoded: currentTrack.encoded } });
                (player as any)._currentTrack = currentTrack;
                console.log(`✓ Resuming playback from beginning`);
              } catch (playError) {
                console.error(`Failed to resume playback:`, playError);
              }
            }
            // If no current track and restored queue exists, play first track
            else if (restoredQueue.length > 0) {
              const { dequeue } = await import("../../utils");
              const nextTrack = dequeue(voiceChannel.guild.id);
              if (nextTrack) {
                try {
                  await player.playTrack({ track: { encoded: nextTrack.encoded } });
                  (player as any)._currentTrack = nextTrack;
                  (player as any)._trackStartTime = Date.now();
                  (player as any)._pausedTime = 0;
                  (player as any)._pauseStartTime = null;
                  console.log(`✓ Started playing first track from restored queue`);
                } catch (playError) {
                  console.error(`Failed to play first track from restored queue:`, playError);
                }
              }
            }
          }
        }

        await sendMessage(
          this.title,
          `Joined ${voiceChannel.name}`,
          interaction
        );
      } else {
        throw new Error("Failed to create Shoukaku player");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to join voice channel with Shoukaku";
      await sendError(this.title, errorMsg, interaction);

      // Throw error if web request
      if (!interaction) {
        throw error instanceof Error ? error : new Error(errorMsg);
      }
    }
  }
}

export default new JoinCommand();
