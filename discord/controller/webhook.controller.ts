import { Request, Response } from "express";
import client from "../client";
import { getQueue, type Track } from "../utils";
import { TrackRepository } from "../../database/repositories/track.repository";

type TrackSource = "youtube" | "soundcloud" | "spotify" | "other";
import { detectTrackSource } from "../../shared/track-source";

import joinCommand from "../commands/basicCommand/join";
import leaveCommand from "../commands/basicCommand/leave";
import playCommand from "../commands/musicCommand/play";

/**
 * Resolve track metadata from URL
 * Used for autofilling song and singer fields in the create song page
 */
async function ResolveTrack(req: Request, res: Response): Promise<void> {
  try {
    const uri = req.query.uri as string;
    if (!uri) {
      res.status(400).send({ 
        error: "URI parameter is required" 
      });
      return;
    }

    if (!client || !client.shoukaku) {
      res.status(500).send({ 
        error: "Discord bot or Shoukaku is not ready" 
      });
      return;
    }

    // Get track information using getTrack function
    const { getTrack } = await import("../utils");
    const track = await getTrack(uri, client.shoukaku, "Resolve", undefined);
    
    if (!track) {
      res.status(404).send({ 
        error: "Track not found" 
      });
      return;
    }

    const { info } = track;
    const { title, author, artist } = info as any;
    const resolvedArtist = artist || author;

    res.send({ 
      title: title || null,
      artist: resolvedArtist || null,
    });
  } catch (error) {
    console.error("Error resolving track:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to resolve track";
    res.status(500).send({ 
      error: errorMessage 
    });
  }
}

/**
 * Track search and playback via Lavalink REST API
 * 
 * @param req - Express request
 * @param res - Express response
 */
async function Play(req: Request, res: Response): Promise<void> {
  try {
    const song = req.query.song as string;
    if (!song) {
      res.status(400).send({ 
        success: false, 
        message: "Song parameter is required" 
      });
      return;
    }

    // Get current guildId from session
    const currentGuildId = (req.session as any)?.currentGuildId;
    
    if (currentGuildId) {
      // Play restricted to specific guildId
      if (!client || !client.shoukaku) {
        res.status(500).send({ 
          success: false, 
          message: "Discord bot or Shoukaku is not ready" 
        });
        return;
      }

      const guild = client.guilds.cache.get(currentGuildId);
      if (!guild) {
        res.status(404).send({ 
          success: false, 
          message: "Guild not found" 
        });
        return;
      }

      // Execute playback logic directly for this guild
      const { getTrack } = await import("../utils");
      const { addToQueue, getQueue, setupPlayerQueueListener, updateQueueMessage } = await import("../utils");
      
      // Search for track
      const track = await getTrack(song, client.shoukaku, "Play", undefined);
      if (!track) {
        res.status(404).send({ 
          success: false, 
          message: "Track not found" 
        });
        return;
      }

      const { encoded, info } = track;
      const { title, author, artist, length, uri } = info as any;
      const resolvedArtist = artist || author;

      // Track is not persisted to DB here - user must use "Add to DB" button on web interface

      // Check and create Player
      let player = client.shoukaku.players.get(currentGuildId);
      if (!player) {
        // If Player doesn't exist, must join first
        res.status(400).send({ 
          success: false, 
          message: "Bot is not connected to a voice channel in this server. Please join a channel first." 
        });
        return;
      }

      // Setup queue listener on Player (if not already set)
      if (!(player as any)._queueListenerSetup) {
        setupPlayerQueueListener(player);
      }

      const isPlaying = !!(player as { track?: any }).track;
      
      try {
        if (!isPlaying) {
          // If not playing, play immediately
          await player.playTrack({ track: { encoded } });
          const currentTrack: any = { encoded, info: { title, artist: resolvedArtist, length, uri } };
          (player as any)._currentTrack = currentTrack;
          (player as any)._trackStartTime = Date.now();
          (player as any)._pausedTime = 0;
          (player as any)._pauseStartTime = null;
        } else {
          // If playing and queue has tracks, add to queue
          addToQueue(currentGuildId, { encoded, info: { title, artist: resolvedArtist, length, uri } });
          await updateQueueMessage(currentGuildId);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to play track";
        res.status(500).send({ 
          success: false, 
          message: errorMsg 
        });
        return;
      }
    } else {
      // If currentGuildId is not in session, execute in existing way
      await playCommand.execute(song);
    }

    res.send({ 
      success: true, 
      message: "Now playing" 
    });
  } catch (error) {
    console.error("Error executing play command:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to execute play command";
    res.status(500).send({ 
      success: false, 
      message: errorMessage 
    });
  }
}

// Source detection is shared in `shared/track-source.ts`

async function RemoveFromQueue(req: Request, res: Response): Promise<void> {
  try {
    if (!client || !client.isReady() || !client.shoukaku) {
      res.status(500).send({ 
        success: false, 
        message: "Discord bot or Shoukaku is not ready" 
      });
      return;
    }

    // Get current guildId from session
    const currentGuildId = (req.session as any)?.currentGuildId;
    const guildId = currentGuildId || client.guilds.cache.first()?.id;

    if (!guildId) {
      res.status(500).send({ 
        success: false, 
        message: "No guild found" 
      });
      return;
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      res.status(500).send({ 
        success: false, 
        message: "Guild not found" 
      });
      return;
    }

    const player = client.shoukaku.players.get(guildId);
    
    if (!player) {
      res.send({ 
        success: false, 
        message: "No active player" 
      });
      return;
    }

    // Remove from queue
    const { getQueue, removeFromQueue, updateQueueMessage } = await import("../utils");
    
    // Support both index and url parameters
    const indexParam = req.query.index as string;
    const urlParam = req.query.url as string;
    
    let trackIndex: number | undefined;
    
    if (indexParam !== undefined) {
      // Use index if provided
      trackIndex = parseInt(indexParam, 10);
      if (isNaN(trackIndex) || trackIndex < 0) {
        res.status(400).send({ 
          success: false, 
          message: "Invalid index parameter" 
        });
        return;
      }
    } else if (urlParam) {
      // Fallback to URL if index not provided
      const queue = getQueue(guildId);
      trackIndex = queue.findIndex(track => track.info?.uri === urlParam);
      if (trackIndex === -1) {
        res.send({ 
          success: false, 
          message: "Track not found in queue" 
        });
        return;
      }
    } else {
      res.status(400).send({ 
        success: false, 
        message: "Index or URL parameter is required" 
      });
      return;
    }
    
    const removedTrack = removeFromQueue(guildId, trackIndex);
    if (removedTrack) {
      await updateQueueMessage(guildId);
      res.send({ 
        success: true, 
        message: "Removed from queue" 
      });
    } else {
      res.send({ 
        success: false, 
        message: "Failed to remove track from queue" 
      });
    }
  } catch (error) {
    console.error("Error removing from queue:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to remove from queue";
    res.status(500).send({ 
      success: false, 
      message: errorMessage 
    });
  }
}

async function Queue(req: Request, res: Response): Promise<void> {
  try {
    if (!client || !client.shoukaku) {
      res.json({ currentTrack: null, queue: [] });
      return;
    }

    // Get current guildId from session
    const currentGuildId = (req.session as any)?.currentGuildId;
    const guildId = currentGuildId || client.guilds.cache.first()?.id;

    if (!guildId) {
      res.json({ currentTrack: null, queue: [] });
      return;
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      res.json({ currentTrack: null, queue: [] });
      return;
    }

    const player = client.shoukaku.players.get(guildId);
    
    if (!player) {
      res.json({ currentTrack: null, queue: [] });
      return;
    }

    // Get currently playing track
    const currentTrack = (player as any)._currentTrack || null;
    
    // Get queue
    const queue = getQueue(guildId);
    
    // Get repeat status
    const { isRepeating } = await import("../utils");
    const repeatStatus = isRepeating(guildId);

    // Normalize URIs to remove unnecessary parameters (e.g., YouTube t=, start=, list=, index=)
    const normalizeUri = (uri: string | undefined): string | undefined => {
      if (!uri) return undefined;
      const { canonicalUri } = detectTrackSource(uri);
      return canonicalUri;
    };

    res.json({
      currentTrack: currentTrack ? {
        title: currentTrack.info?.title || "Unknown",
        artist: currentTrack.info?.artist || (currentTrack.info as any)?.author || "Unknown",
        length: currentTrack.info?.length ? Math.floor(currentTrack.info.length / 1000) : undefined, // Convert milliseconds to seconds
        uri: normalizeUri(currentTrack.info?.uri),
      } : null,
      queue: queue.map(track => ({
        title: track.info?.title || "Unknown",
        artist: track.info?.artist || (track.info as any)?.author || "Unknown",
        length: track.info?.length ? Math.floor(track.info.length / 1000) : undefined, // Convert milliseconds to seconds
        uri: normalizeUri(track.info?.uri),
      })),
      isRepeating: repeatStatus,
    });
  } catch (error) {
    console.error("Error getting queue:", error);
    res.json({ currentTrack: null, queue: [] });
  }
}



async function Join(req: Request, res: Response): Promise<void> {
  try {
    const { guildId, channelId } = req.body;
    
    // If guildId and channelId are provided (from Discord management page)
    if (guildId && channelId) {
      if (!client || !client.shoukaku) {
        res.status(500).send({ 
          success: false, 
          message: "Shoukaku is not initialized" 
        });
        return;
      }

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        res.status(404).send({ 
          success: false, 
          message: "Guild not found or bot is not in this guild" 
        });
        return;
      }

      const channel = guild.channels.cache.get(channelId);
      if (!channel || !channel.isVoiceBased()) {
        res.status(404).send({ 
          success: false, 
          message: "Voice channel not found" 
        });
        return;
      }

      // Check if already connected
      const existingPlayer = client.shoukaku.players.get(guildId);
      if (existingPlayer) {
        // Check if bot is actually in a voice channel in Discord
        const botMember = guild.members.cache.get(client.user?.id || "");
        const botVoiceState = botMember?.voice;
        const isActuallyConnected = botVoiceState?.channelId !== null && botVoiceState?.channelId !== undefined;
        
        if (isActuallyConnected && botVoiceState.channelId === channelId) {
          // Already connected to the same channel
          res.send({ 
            success: true, 
            message: `Already connected to ${channel.name}` 
          });
          return;
        } else if (isActuallyConnected) {
          // Connected to a different channel, leave first
          try {
            await client.shoukaku.leaveVoiceChannel(guildId);
            // Clean up the player
            if (existingPlayer) {
              (existingPlayer as { destroy?: () => void }).destroy?.();
              client.shoukaku.players.delete(guildId);
            }
          } catch (error) {
            console.error("Error leaving previous channel:", error);
            // Continue to try joining new channel
          }
        } else {
          // Player exists but not actually connected (manually disconnected)
          // Clean up the stale player
          try {
            (existingPlayer as { destroy?: () => void }).destroy?.();
            client.shoukaku.players.delete(guildId);
            console.log(`✓ Cleaned up stale player for guild ${guildId}`);
          } catch (error) {
            console.error("Error cleaning up stale player:", error);
            // Continue to try joining
          }
        }
      }

      // Connect via Shoukaku
      const player = await client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: channelId,
        shardId: 0,
        deaf: true,
        mute: false,
      });

      if (player) {
        const { setupPlayerQueueListener, getQueue, restoreQueueFromDatabase } = await import("../utils");
        setupPlayerQueueListener(player);

        // Try to restore queue from database
        const queue = getQueue(guildId);
        if (queue.length === 0) {
          const restoreResult = await restoreQueueFromDatabase(guildId);
          if (restoreResult.restored) {
            console.log(`✓ Queue restored from database for guild ${guildId}`);
            
            const currentTrack = (player as any)._currentTrack;
            const restoredQueue = getQueue(guildId);
            
            if (currentTrack && restoreResult.position !== undefined) {
              const positionInMs = restoreResult.position * 1000;
              try {
                await player.playTrack({ 
                  track: { encoded: currentTrack.encoded },
                  position: positionInMs
                });
                (player as any)._currentTrack = currentTrack;
                (player as any)._trackStartTime = Date.now() - positionInMs;
                (player as any)._pausedTime = 0;
                (player as any)._pauseStartTime = null;
                console.log(`✓ Resuming playback from position ${restoreResult.position}s`);
              } catch (playError) {
                console.error(`Failed to resume playback from saved position:`, playError);
              }
            } else if (currentTrack) {
              try {
                await player.playTrack({ track: { encoded: currentTrack.encoded } });
                (player as any)._currentTrack = currentTrack;
                (player as any)._trackStartTime = Date.now();
                (player as any)._pausedTime = 0;
                (player as any)._pauseStartTime = null;
                console.log(`✓ Resuming playback from beginning`);
              } catch (playError) {
                console.error(`Failed to resume playback:`, playError);
              }
            } else if (restoredQueue.length > 0) {
              const { dequeue } = await import("../utils");
              const nextTrack = dequeue(guildId);
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

        res.send({ 
          success: true, 
          message: `Joined ${channel.name}` 
        });
        return;
      } else {
        throw new Error("Failed to create Shoukaku player");
      }
    } else {
      // 기존 방식: 기본 guild의 첫 번째 음성 채널 사용
      await joinCommand.execute();
      res.send({ 
        success: true, 
        message: "Joined voice channel" 
      });
    }
  } catch (error) {
    console.error("Error executing join command:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to execute join command";
    res.status(500).send({ 
      success: false, 
      message: errorMessage 
    });
  }
}

async function Leave(req: Request, res: Response): Promise<void> {
  try {
    // Get guildId from body, or use currentGuildId from session if not provided
    const guildId = req.body.guildId || (req.session as any)?.currentGuildId;
    
    if (!guildId) {
      res.status(400).send({ 
        success: false, 
        message: "guildId is required" 
      });
      return;
    }

    if (!client || !client.shoukaku) {
      res.status(500).send({ 
        success: false, 
        message: "Discord bot or Shoukaku is not ready" 
      });
      return;
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      res.status(404).send({ 
        success: false, 
        message: "Guild not found" 
      });
      return;
    }

    const player = client.shoukaku.players.get(guildId);
    
      // Save current playback position to database before leaving
      if (player) {
        try {
          const currentTrack = (player as any)._currentTrack as Track | null;
          const queueArray = getQueue(guildId);
          
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
            const { QueueService } = await import("../../database");
            const queueService = new QueueService();
            await queueService.saveQueue(guildId, currentTrack, queueArray, position);
            console.log(`✓ Saved playback position ${position !== undefined ? `${position}s` : 'N/A'} and queue for guild ${guildId}`);
          } catch (error) {
            console.error(`Failed to save playback position when leaving:`, error);
          }
        }
      } catch (error) {
        console.error(`Error saving queue before leaving:`, error);
      }
    }

    await client.shoukaku.leaveVoiceChannel(guildId);
    console.log(`✓ Left voice channel for guild ${guildId}`);
    
    res.send({ 
      success: true, 
      message: "Left the voice channel" 
    });
  } catch (error) {
    console.error("Error executing leave command:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to execute leave command";
    res.status(500).send({ 
      success: false, 
      message: errorMessage 
    });
  }
}

function isInChannel(req: Request, res: Response): void {
  try {
    if (!client || !client.shoukaku) {
      res.send({ isInChannel: false });
      return;
    }

    const guild = client.guilds.cache.first();
    if (!guild) {
      res.send({ isInChannel: false });
      return;
    }

    const player = client.shoukaku.players.get(guild.id);
    const isConnected = player !== undefined && player !== null;

    res.send({ isInChannel: isConnected });
  } catch (error) {
    console.error("Error checking channel status:", error);
    res.send({ isInChannel: false });
  }
}

// Return all channels and servers the bot is currently in
function getAllActiveChannels(req: Request, res: Response): void {
  try {
    if (!client) {
      res.json({ channels: [] });
      return;
    }

    const activeChannels: Array<{
      guildId: string;
      guildName: string;
      channelId: string;
      channelName: string;
    }> = [];

    // Iterate through all guilds
    client.guilds.cache.forEach((guild) => {
      // Check if bot is in a voice channel via Discord.js VoiceState
      const botMember = guild.members.me;
      if (botMember?.voice.channelId) {
        const channel = guild.channels.cache.get(botMember.voice.channelId);
        if (channel && channel.isVoiceBased()) {
          activeChannels.push({
            guildId: guild.id,
            guildName: guild.name,
            channelId: channel.id,
            channelName: channel.name,
          });
        }
      }
    });

    res.json({ channels: activeChannels });
  } catch (error) {
    console.error("Error getting active channels:", error);
    res.status(500).json({ error: "Failed to get active channels" });
  }
}

// Set current channel/server to control
function setCurrentControl(req: Request, res: Response): void {
  try {
    const { guildId, channelId } = req.body;
    if (!guildId || !channelId) {
      res.status(400).json({ error: "guildId and channelId are required" });
      return;
    }

    // Save to session
    (req.session as any).currentGuildId = guildId;
    (req.session as any).currentChannelId = channelId;

    res.json({ success: true, guildId, channelId });
  } catch (error) {
    console.error("Error setting current control:", error);
    res.status(500).json({ error: "Failed to set current control" });
  }
}

// Get current channel/server to control
function getCurrentControl(req: Request, res: Response): void {
  try {
    const guildId = (req.session as any)?.currentGuildId;
    const channelId = (req.session as any)?.currentChannelId;

    let guildName: string | null = null;
    let channelName: string | null = null;

    // Try to get guild and channel names from Discord client
    if (guildId && client) {
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        guildName = guild.name;
        if (channelId) {
          const channel = guild.channels.cache.get(channelId);
          if (channel) {
            channelName = channel.name;
          }
        }
      }
    }

    res.json({ 
      guildId: guildId || null, 
      channelId: channelId || null,
      guildName: guildName || null,
      channelName: channelName || null,
    });
  } catch (error) {
    console.error("Error getting current control:", error);
    res.status(500).json({ error: "Failed to get current control" });
  }
}

async function setRepeat(req: Request, res: Response): Promise<void> {
  try {
    if (!client || !client.shoukaku) {
      res.status(500).json({ 
        success: false, 
        message: "Discord bot or Shoukaku is not ready" 
      });
      return;
    }

    // Get current guildId from session
    const currentGuildId = (req.session as any)?.currentGuildId;
    const guildId = currentGuildId || client.guilds.cache.first()?.id;

    if (!guildId) {
      res.status(400).json({ 
        success: false, 
        message: "No guild ID available" 
      });
      return;
    }

    const { isRepeating } = req.body;
    
    if (typeof isRepeating !== 'boolean') {
      res.status(400).json({ 
        success: false, 
        message: "isRepeating must be a boolean" 
      });
      return;
    }

    // Set repeat mode
    const { setRepeating } = await import("../utils");
    setRepeating(guildId, isRepeating);
    
    // Also update database
    const { QueueService } = await import("../../database/services/queue.service");
    const queueService = new QueueService();
    await queueService.setRepeating(guildId, isRepeating);

    res.json({ 
      success: true, 
      isRepeating 
    });
  } catch (error) {
    console.error("Error setting repeat:", error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to set repeat mode" 
    });
  }
}

async function clearQueue(req: Request, res: Response): Promise<void> {
  try {
    if (!client || !client.shoukaku) {
      res.status(500).json({ 
        success: false, 
        message: "Discord bot or Shoukaku is not ready" 
      });
      return;
    }

    // Get current guildId from session
    const currentGuildId = (req.session as any)?.currentGuildId;
    const guildId = currentGuildId || client.guilds.cache.first()?.id;

    if (!guildId) {
      res.status(400).json({ 
        success: false, 
        message: "No guild ID available" 
      });
      return;
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      res.status(404).json({ 
        success: false, 
        message: "Guild not found" 
      });
      return;
    }

    // Get player
    const player = client.shoukaku.players.get(guildId);
    
    // Stop current track if playing
    if (player) {
      try {
        // Stop playback
        await player.stopTrack();
        // Clear current track info
        (player as any)._currentTrack = null;
        (player as { track?: any }).track = null;
        // Clear playback timing info
        (player as any)._trackStartTime = null;
        (player as any)._pausedTime = 0;
        (player as any)._pauseStartTime = null;
      } catch (error) {
        console.error("Error stopping current track:", error);
        // Continue even if stop fails
      }
    }

    // Clear queue
    const { clearQueue, updateQueueMessage } = await import("../utils");
    clearQueue(guildId);
    
    // Update queue message
    await updateQueueMessage(guildId);
    
    // Also update database
    const { QueueService } = await import("../../database/services/queue.service");
    const queueService = new QueueService();
    await queueService.saveQueue(guildId, null, []);

    res.json({ 
      success: true, 
      message: "Queue cleared and current track stopped" 
    });
  } catch (error) {
    console.error("Error clearing queue:", error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to clear queue" 
    });
  }
}

export default {
  Play,
  Queue,
  Join,
  Leave,
  isInChannel,
  RemoveFromQueue,
  getAllActiveChannels,
  setCurrentControl,
  getCurrentControl,
  setRepeat,
  clearQueue,
  ResolveTrack,
};

