import { prisma } from '../client';
import type { Prisma, TrackSource } from '@prisma/client';

export interface CreateTrackData {
  title: string;
  artist: string;
  // Length in seconds (required; use 0 if unknown)
  length: number;
  // Canonical original URL
  uri: string;
  source: TrackSource;
  sourceId: string;
  userId?: string;
  tagIds?: string[];
}

export class TrackRepository {
  /**
   * Find a track by ID
   * 
   * @param id - Track ID
   * @returns Track information with tags or null if not found
   */
  async findById(id: string) {
    return prisma.track.findUnique({
      where: { id },
      include: { tags: true },
    });
  }

  /**
   * Create a new track
   * 
   * @param data - Track data to create
   * @returns Created track information with tags
   */
  async create(data: CreateTrackData) {
    return prisma.track.create({
      data: {
        title: data.title,
        artist: data.artist,
        length: data.length,
        uri: data.uri,
        source: data.source,
        sourceId: data.sourceId,
        userId: data.userId,
        tags: data.tagIds
          ? {
              connect: data.tagIds.map((id) => ({ id })),
            }
          : undefined,
      } as Prisma.TrackUncheckedCreateInput,
      include: { tags: true },
    });
  }

  /**
   * Find all tracks
   * 
   * @param userId - Optional user ID to filter tracks by owner
   * @returns Array of tracks with tags, ordered by creation date (newest first)
   */
  async findAll(userId?: string) {
    return prisma.track.findMany({
      where: userId ? { userId } : undefined,
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Search tracks by title and/or artist
   * 
   * @param title - Track title to search (optional, case-insensitive partial match)
   * @param artist - Track artist to search (optional, case-insensitive partial match)
   * @param userId - Optional user ID to filter tracks by owner
   * @returns Array of matching tracks with tags, ordered by creation date (newest first)
   */
  async search(title?: string, artist?: string, userId?: string) {
    return prisma.track.findMany({
      where: {
        ...(title && { title: { contains: title, mode: 'insensitive' } }),
        ...(artist && { artist: { contains: artist, mode: 'insensitive' } }),
        ...(userId && { userId }),
      },
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a track by title and artist (exact match)
   * 
   * @param title - Track title
   * @param artist - Track artist
   * @param userId - Optional user ID to filter tracks by owner
   * @returns Track information with tags or null if not found
   */
  async findByTitleAndArtist(title: string, artist: string, userId?: string) {
    return prisma.track.findFirst({
      where: {
        title,
        artist,
        ...(userId && { userId }),
      },
      include: { tags: true },
    });
  }

  /**
   * Update a track
   * 
   * @param id - Track ID
   * @param data - Partial track data to update
   * @returns Updated track information with tags
   */
  async update(id: string, data: Partial<CreateTrackData>) {
    return prisma.track.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.artist && { artist: data.artist }),
        ...(data.length !== undefined && { length: data.length }),
        ...(data.uri !== undefined && { uri: data.uri }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.sourceId !== undefined && { sourceId: data.sourceId }),
        ...(data.userId !== undefined && { userId: data.userId }),
        ...(data.tagIds && {
          tags: {
            set: data.tagIds.map((tagId) => ({ id: tagId })),
          },
        }),
      },
      include: { tags: true },
    });
  }

  /**
   * Delete a track
   * 
   * @param id - Track ID
   * @returns Deleted track information
   */
  async delete(id: string) {
    return prisma.track.delete({
      where: { id },
    });
  }

  /**
   * Add tags to a track
   * 
   * @param trackId - Track ID
   * @param tagIds - Array of tag IDs to add
   * @returns Updated track information with tags
   */
  async addTags(trackId: string, tagIds: string[]) {
    return prisma.track.update({
      where: { id: trackId },
      data: {
        tags: {
          connect: tagIds.map((id) => ({ id })),
        },
      },
      include: { tags: true },
    });
  }

  /**
   * Remove tags from a track
   * 
   * @param trackId - Track ID
   * @param tagIds - Array of tag IDs to remove
   * @returns Updated track information with tags
   */
  async removeTags(trackId: string, tagIds: string[]) {
    return prisma.track.update({
      where: { id: trackId },
      data: {
        tags: {
          disconnect: tagIds.map((id) => ({ id })),
        },
      },
      include: { tags: true },
    });
  }

  /**
   * Upsert a track by (source, sourceId)
   * 
   * @param data - Track data (source/sourceId/uri/length required)
   * @returns Upserted track information with tags
   */
  async upsertBySourceAndId(data: CreateTrackData) {
    // Prisma generates a compound unique selector name based on @@unique([source, sourceId])
    // Use `as any` to avoid type drift issues across client generations.
    return prisma.track.upsert({
      where: { source_sourceId: { source: data.source, sourceId: data.sourceId } } as any,
      create: {
        title: data.title,
        artist: data.artist,
        length: data.length,
        uri: data.uri,
        source: data.source,
        sourceId: data.sourceId,
        userId: data.userId,
        tags: data.tagIds
          ? {
              connect: data.tagIds.map((id) => ({ id })),
            }
          : undefined,
      } as Prisma.TrackUncheckedCreateInput,
      update: {
        // Keep metadata fresh
        title: data.title,
        artist: data.artist,
        length: data.length,
        uri: data.uri,
        // Update userId if provided (allows transferring ownership)
        ...(data.userId !== undefined && { userId: data.userId }),
      },
      include: { tags: true },
    });
  }
}

