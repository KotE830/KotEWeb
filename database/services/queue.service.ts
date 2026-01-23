import { PlayerRepository } from '../repositories/player.repository';
import type { Track } from '../../discord/utils/music/track';

export class QueueService {
  private playerRepo = new PlayerRepository();

  /**
   * Save queue to database (async, non-blocking)
   * Includes position information in currentTrack if provided
   * 
   * @param guildId - Discord server (guild) ID
   * @param currentTrack - Currently playing track or null
   * @param queue - Queue of tracks
   * @param position - Playback position in seconds (optional)
   */
  async saveQueue(
    guildId: string,
    currentTrack: Track | null,
    queue: Track[],
    position?: number
  ): Promise<void> {
    try {
      // Save currentTrack with position information included
      let currentTrackWithPosition: any = currentTrack;
      if (currentTrack && position !== undefined) {
        currentTrackWithPosition = {
          ...currentTrack,
          position, // Playback position in seconds
        };
      }

      await this.playerRepo.upsert(guildId, currentTrackWithPosition, queue);
    } catch (error) {
      console.error(`Failed to save queue for guild ${guildId}:`, error);
    }
  }

  /**
   * Load queue from database (used when bot restarts)
   * Also returns position information if available
   * 
   * @param guildId - Discord server (guild) ID
   * @returns Queue data with current track, queue, repeat mode, and position, or null if not found
   */
  async loadQueue(
    guildId: string
  ): Promise<{ currentTrack: Track | null; queue: Track[]; isRepeating: boolean; position?: number } | null> {
    try {
      const player = await this.playerRepo.findById(guildId);
      if (!player) {
        return null;
      }

      const currentTrackData = player.currentTrack as any;
      let currentTrack: Track | null = null;
      let position: number | undefined = undefined;

      if (currentTrackData) {
        // Separate position field if it exists
        if ('position' in currentTrackData) {
          position = currentTrackData.position as number;
          // Create Track object without position field
          const { position: _, ...trackWithoutPosition } = currentTrackData;
          currentTrack = trackWithoutPosition as Track;
        } else {
          currentTrack = currentTrackData as Track;
        }
      }

      return {
        currentTrack,
        queue: (player.queue as unknown as Track[]) ?? [],
        isRepeating: player.isRepeating,
        position,
      };
    } catch (error) {
      console.error(`Failed to load queue for guild ${guildId}:`, error);
      return null;
    }
  }

  /**
   * Set repeat mode
   * 
   * @param guildId - Discord server (guild) ID
   * @param isRepeating - Whether to enable repeat mode
   * @throws Error if operation fails
   */
  async setRepeating(guildId: string, isRepeating: boolean): Promise<void> {
    try {
      await this.playerRepo.setRepeating(guildId, isRepeating);
    } catch (error) {
      console.error(`Failed to set repeating for guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Delete player (when bot leaves server)
   * 
   * @param guildId - Discord server (guild) ID
   */
  async deletePlayer(guildId: string): Promise<void> {
    try {
      await this.playerRepo.delete(guildId);
    } catch (error) {
      console.error(`Failed to delete player for guild ${guildId}:`, error);
    }
  }
}

