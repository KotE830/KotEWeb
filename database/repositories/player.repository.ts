import { prisma } from '../client';
import type { Track } from '../../discord/utils/music/track';

export class PlayerRepository {
  /**
   * Find a player by guild ID
   * 
   * @param guildId - Discord server (guild) ID
   * @returns Player information or null if not found
   */
  async findById(guildId: string) {
    return prisma.player.findUnique({
      where: { guildId },
    });
  }

  /**
   * Create or update a player (save queue)
   * 
   * @param guildId - Discord server (guild) ID
   * @param currentTrack - Currently playing track or null
   * @param queue - Queue of tracks
   * @returns Created or updated player information
   */
  async upsert(guildId: string, currentTrack: Track | null, queue: Track[]) {
    return prisma.player.upsert({
      where: { guildId },
      update: {
        currentTrack: currentTrack as any,
        queue: queue as any,
        updatedAt: new Date(),
      },
      create: {
        guildId,
        currentTrack: currentTrack as any,
        queue: queue as any,
      },
    });
  }

  /**
   * Set repeat mode for a player
   * 
   * @param guildId - Discord server (guild) ID
   * @param isRepeating - Whether to enable repeat mode
   * @returns Updated player information
   */
  async setRepeating(guildId: string, isRepeating: boolean) {
    return prisma.player.update({
      where: { guildId },
      data: { isRepeating },
    });
  }

  /**
   * Delete a player
   * 
   * @param guildId - Discord server (guild) ID
   * @returns Deleted player information
   */
  async delete(guildId: string) {
    return prisma.player.delete({
      where: { guildId },
    });
  }

  /**
   * Find all players
   * 
   * @returns Array of all players
   */
  async findAll() {
    return prisma.player.findMany();
  }
}

