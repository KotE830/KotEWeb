import { Events, VoiceState, ChannelType } from "discord.js";
import client from "../client";
import { getQueue, setQueueMessage, deletePreviousQueueMessage, restoreQueueFromDatabase } from "../utils";
import { createEmbed } from "../utils";
import { EmbedColors, QueueConfig, DefaultValues, TimeConstants } from "../config";
import type { Track } from "../utils/music/track";

/**
 * Find default text channel
 * 1. System channel (guild.systemChannel)
 * 2. First text channel
 * 
 * @param guildId - Discord server (guild) ID
 * @returns Default text channel or null if not found
 */
function getDefaultTextChannel(guildId: string) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return null;
  }

  // Prioritize system channel
  if (guild.systemChannel) {
    return guild.systemChannel;
  }

  // Find first text channel
  const textChannels = guild.channels.cache.filter(
    (ch) => ch.type === ChannelType.GuildText && ch.isTextBased()
  );

  if (textChannels.size > 0) {
    return textChannels.first();
  }

  return null;
}

/**
 * Function to create and send queue message
 */
async function sendQueueMessage(guildId: string, player: any): Promise<void> {
  const textChannel = getDefaultTextChannel(guildId);
  if (!textChannel || !textChannel.isTextBased()) {
    console.warn(`No text channel found for guild ${guildId}`);
    return;
  }

  // Time format function
  const formatTime = (ms: number | undefined): string => {
    if (!ms || ms < 0) return "0:00";
    const totalSeconds = Math.floor(ms / TimeConstants.MS_TO_SECONDS);
    const minutes = Math.floor(totalSeconds / TimeConstants.SECONDS_TO_MINUTES);
    const seconds = totalSeconds % TimeConstants.SECONDS_TO_MINUTES;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Function to calculate current playback progress time
  const getCurrentPosition = (): number => {
    const currentTrack = (player as any)._currentTrack as Track | undefined;
    const trackStartTime = (player as any)._trackStartTime as number | undefined;
    const pausedTime = (player as any)._pausedTime as number | undefined;
    const pauseStartTime = (player as any)._pauseStartTime as number | undefined;
    const currentTrackLength = currentTrack?.info?.length;

    if (!trackStartTime || !currentTrackLength) {
      return 0;
    }

    const isPaused = (player as { paused?: boolean }).paused || (player as any)._isPaused || false;

    let totalPausedTime = pausedTime || 0;
    if (isPaused && pauseStartTime) {
      totalPausedTime += Date.now() - pauseStartTime;
    }

    const elapsedTime = Date.now() - trackStartTime;
    const actualPlayTime = elapsedTime - totalPausedTime;

    const position = Math.floor(actualPlayTime / TimeConstants.MS_TO_SECONDS) * TimeConstants.MS_TO_SECONDS;
    return Math.max(0, Math.min(position, currentTrackLength));
  };

  // Get queue
  const queue = getQueue(guildId);
  const totalTracks = queue.length;
  const itemsPerPage = QueueConfig.ITEMS_PER_PAGE;

  // Currently playing track info
  const currentTrack = (player as any)._currentTrack as Track | undefined;
  const currentTrackTitle = currentTrack?.info?.title || DefaultValues.NO_TRACK_TITLE;
  const currentTrackArtist = currentTrack?.info?.artist || (currentTrack?.info as any)?.author || "";
  const currentTrackLength = currentTrack?.info?.length;
  // Thumbnail is no longer stored
  const currentPosition = getCurrentPosition();

  const startIndex = 0;
  const endIndex = Math.min(itemsPerPage, totalTracks);
  const pageTracks = queue.slice(startIndex, endIndex);

  let description = `**Now Playing:** ${currentTrackTitle}`;
  if (currentTrackArtist) {
    description += ` by ${currentTrackArtist}`;
  }

  if (currentTrackLength && currentPosition >= 0) {
    const currentTime = formatTime(currentPosition);
    const totalTime = formatTime(currentTrackLength);
    description += `\n⏱️ ${currentTime} / ${totalTime}`;
  } else if (currentTrackLength) {
    description += `\n⏱️ ${formatTime(currentTrackLength)}`;
  }

  description += `\n\n`;

  if (totalTracks === 0) {
    description += "Queue is empty.";
  } else {
    description += `**Queue (${totalTracks} track${totalTracks !== 1 ? "s" : ""}):**\n\n`;
    pageTracks.forEach((track, index) => {
      const queueIndex = startIndex + index + 1;
      description += `${queueIndex}. **${track.info.title}**\n   by ${track.info.artist || (track.info as any).author || "Unknown"}`;
      if (track.info.length) {
        description += ` • ${formatTime(track.info.length)}`;
      }
      description += `\n`;
    });
  }

  const embed = createEmbed("Queue", description, EmbedColors.INFO);
  embed.setTimestamp();

  if (currentTrackThumbnail) {
    embed.setThumbnail(currentTrackThumbnail);
  }

  // Delete previous queue message
  deletePreviousQueueMessage(guildId);

  // Send and save new queue message
  try {
    const message = await textChannel.send({ embeds: [embed] });
    setQueueMessage(guildId, message);
  } catch (error) {
    console.error(`Failed to send queue message for guild ${guildId}:`, error);
  }
}

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    // Only process bot's state changes
    const isBot = oldState.member?.id === client.user?.id || newState.member?.id === client.user?.id;
    if (!isBot) {
      return;
    }

    // Bot left channel (completely left or moved to different channel)
    if (
      oldState.member?.id === client.user?.id &&
      oldState.channelId &&
      (!newState.channelId || newState.channelId !== oldState.channelId)
    ) {
      const guildId = oldState.guild.id;

      if (!client.shoukaku) {
        return;
      }

      const player = client.shoukaku.players.get(guildId);
      if (!player) {
        return;
      }

      // If track is playing and not paused
      const currentTrack = (player as { track?: any }).track;
      const isPaused = (player as { paused?: boolean }).paused || (player as any)._isPaused || false;

      if (currentTrack && !isPaused) {
        try {
          // Pause
          await player.setPaused(true);
          (player as any)._isPaused = true;
          (player as any)._pauseStartTime = Date.now();
          console.log(`⏸️ Bot left voice channel, paused playback for guild ${guildId}`);
        } catch (error) {
          console.error(`Failed to pause playback when bot left channel:`, error);
        }
      }

      // Save queue to database with playback position before leaving
      try {
        const { QueueService } = await import("../../database");
        const queueService = new QueueService();
        const queueArray = getQueue(guildId);
        const currentTrackForSave = (player as any)._currentTrack as Track | null;
        
        if (currentTrackForSave) {
          // Use player.position directly (convert milliseconds to seconds)
          let position: number | undefined = undefined;
          const playerPosition = (player as { position?: number }).position;
          if (playerPosition !== undefined && playerPosition !== null) {
            position = Math.floor(playerPosition / 1000); // in seconds
          }
          
          // Save to database with playback position
          await queueService.saveQueue(guildId, currentTrackForSave, queueArray, position);
          console.log(`✓ Saved queue with position ${position !== undefined ? `${position}s` : 'N/A'} for guild ${guildId}`);
        } else {
          // Save without position if no track is playing
          await queueService.saveQueue(guildId, null, queueArray);
        }
      } catch (error) {
        console.error(`Failed to save queue when bot left channel:`, error);
      }
    }

    // Bot joined channel (first time joining or moved from different channel)
    if (
      newState.member?.id === client.user?.id &&
      newState.channelId &&
      (!oldState.channelId || newState.channelId !== oldState.channelId)
    ) {
      const guildId = newState.guild.id;

      if (!client.shoukaku) {
        return;
      }

      const player = client.shoukaku.players.get(guildId);
      if (!player) {
        return;
      }

      // Try to restore queue from database (first entry after bot restart)
      const queue = getQueue(guildId);
      let restoredPosition: number | undefined = undefined;
      
      if (queue.length === 0) {
        const restoreResult = await restoreQueueFromDatabase(guildId);
        if (restoreResult.restored) {
          console.log(`✓ Queue restored from database for guild ${guildId}`);
          restoredPosition = restoreResult.position;
        }
      }

      // If paused or restored queue exists
      const isPaused = (player as { paused?: boolean }).paused || (player as any)._isPaused || false;
      let currentTrack = (player as { track?: any }).track || (player as any)._currentTrack;
      const restoredQueue = getQueue(guildId);

      if ((isPaused && currentTrack) || (currentTrack && restoredQueue.length > 0) || (!currentTrack && restoredQueue.length > 0)) {
        try {
          // Output queue message
          await sendQueueMessage(guildId, player);

          // Resume playback only if paused
          if (isPaused) {
            await player.setPaused(false);

            // Accumulate paused time
            const pauseStartTime = (player as any)._pauseStartTime as number | undefined;
            const pausedTime = (player as any)._pausedTime as number | undefined;

            if (pauseStartTime) {
              const pauseDuration = Date.now() - pauseStartTime;
              (player as any)._pausedTime = (pausedTime || 0) + pauseDuration;
            }

            // Clear pause state
            (player as any)._isPaused = false;
            (player as any)._pauseStartTime = null;
          }

          // Start playback if restored queue exists and current track exists but not playing
          if (currentTrack && !isPaused && !(player as { track?: any }).track) {
            try {
              // Play with position option if saved playback position exists
              const positionInMs = restoredPosition !== undefined ? restoredPosition * 1000 : undefined;
              await player.playTrack({ 
                track: { encoded: currentTrack.encoded },
                ...(positionInMs ? { position: positionInMs } : {})
              });
              (player as any)._currentTrack = currentTrack;
              // Set trackStartTime considering position option start position
              (player as any)._trackStartTime = Date.now() - (positionInMs || 0);
              (player as any)._pausedTime = 0;
              (player as any)._pauseStartTime = null;
              
              if (restoredPosition !== undefined) {
                console.log(`✓ Resuming playback from position ${restoredPosition}s`);
              }
            } catch (error) {
              console.error(`Failed to play restored track:`, error);
            }
          } else if (!currentTrack && !isPaused && !(player as { track?: any }).track && restoredQueue.length > 0) {
            // Play first track if no current track and restored queue exists
            try {
              const { dequeue } = await import("../utils");
              const nextTrack = dequeue(guildId);
              if (nextTrack) {
                await player.playTrack({ track: { encoded: nextTrack.encoded } });
                (player as any)._currentTrack = nextTrack;
                (player as any)._trackStartTime = Date.now();
                (player as any)._pausedTime = 0;
                (player as any)._pauseStartTime = null;
              }
            } catch (error) {
              console.error(`Failed to play restored queue track:`, error);
            }
          }

          console.log(`▶️ Bot joined voice channel, resumed playback for guild ${guildId}`);
        } catch (error) {
          console.error(`Failed to resume playback when bot joined channel:`, error);
        }
      }
    }
  },
};

