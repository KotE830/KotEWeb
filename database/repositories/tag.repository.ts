import { prisma } from '../client';

export class TagRepository {
  /**
   * Find a tag by ID
   * 
   * @param id - Tag ID
   * @returns Tag information with associated tracks or null if not found
   */
  async findById(id: string) {
    return prisma.tag.findUnique({
      where: { id },
      include: { tracks: true },
    });
  }

  /**
   * Find a tag by name
   * 
   * @param name - Tag name
   * @returns Tag information with associated tracks or null if not found
   */
  async findByName(name: string) {
    return prisma.tag.findUnique({
      where: { name },
      include: { tracks: true },
    });
  }

  /**
   * Create a new tag
   * 
   * @param name - Tag name
   * @returns Created tag information
   */
  async create(name: string) {
    return prisma.tag.create({
      data: { name },
    });
  }

  /**
   * Find all tags
   * 
   * @returns Array of all tags with associated tracks, ordered by name (ascending)
   */
  async findAll() {
    return prisma.tag.findMany({
      include: { tracks: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update a tag (change name)
   * 
   * @param id - Tag ID
   * @param name - New tag name
   * @returns Updated tag information
   */
  async update(id: string, name: string) {
    return prisma.tag.update({
      where: { id },
      data: { name },
    });
  }

  /**
   * Delete a tag
   * 
   * @param id - Tag ID
   * @returns Deleted tag information
   */
  async delete(id: string) {
    return prisma.tag.delete({
      where: { id },
    });
  }
}

