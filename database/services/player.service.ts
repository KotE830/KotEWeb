import { PlayerRepository } from '../repositories/player.repository';
import type { Track } from '../../discord/utils/music/track';

export class PlayerService {
  private playerRepo = new PlayerRepository();

  /**
   * Get currently playing track
   * 
   * @param guildId - Discord server (guild) ID
   * @returns Currently playing track or null if not found
   */
  async getCurrentTrack(guildId: string): Promise<Track | null> {
    try {
      const player = await this.playerRepo.findById(guildId);
      if (!player || !player.currentTrack) {
        return null;
      }
      return player.currentTrack as unknown as Track;
    } catch (error) {
      console.error(`Failed to get current track for guild ${guildId}:`, error);
      return null;
    }
  }

  /**
   * Update currently playing track
   * Creates player if it doesn't exist
   * 
   * @param guildId - Discord server (guild) ID
   * @param currentTrack - Currently playing track or null
   */
  async updateCurrentTrack(guildId: string, currentTrack: Track | null): Promise<void> {
    try {
      const player = await this.playerRepo.findById(guildId);
      await this.playerRepo.upsert(
        guildId,
        currentTrack,
        (player?.queue as unknown as Track[]) ?? []
      );
    } catch (error) {
      console.error(`Failed to update current track for guild ${guildId}:`, error);
    }
  }

  /**
   * Get repeat mode status
   * 
   * @param guildId - Discord server (guild) ID
   * @returns Whether repeat mode is enabled (default: false)
   */
  async getRepeating(guildId: string): Promise<boolean> {
    try {
      const player = await this.playerRepo.findById(guildId);
      return player?.isRepeating ?? false;
    } catch (error) {
      console.error(`Failed to get repeating for guild ${guildId}:`, error);
      return false;
    }
  }
}

