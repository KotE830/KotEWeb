import { Request, Response } from "express";
import { TagRepository } from "../../database/repositories/tag.repository";

const tagRepository = new TagRepository();

/**
 * Get all tags
 */
async function getTags(req: Request, res: Response): Promise<void> {
  try {
    const tags = await tagRepository.findAll();
    res.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
}

/**
 * Get a tag by ID
 */
async function getTagById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tag = await tagRepository.findById(id);
    
    if (!tag) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }
    
    res.json(tag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    res.status(500).json({ error: "Failed to fetch tag" });
  }
}

/**
 * Create a new tag
 */
async function createTag(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      res.status(400).json({ error: "Tag name is required" });
      return;
    }

    const tag = await tagRepository.create(name.trim());
    res.status(201).json(tag);
  } catch (error: any) {
    console.error("Error creating tag:", error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: "Tag with this name already exists" });
    } else {
      res.status(500).json({ error: "Failed to create tag" });
    }
  }
}

/**
 * Update a tag
 */
async function updateTag(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      res.status(400).json({ error: "Tag name is required" });
      return;
    }

    // Check if tag exists
    const existingTag = await tagRepository.findById(id);
    if (!existingTag) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }

    const tag = await tagRepository.update(id, name.trim());
    res.json(tag);
  } catch (error: any) {
    console.error("Error updating tag:", error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: "Tag with this name already exists" });
    } else {
      res.status(500).json({ error: "Failed to update tag" });
    }
  }
}

/**
 * Delete a tag
 */
async function deleteTag(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const tag = await tagRepository.findById(id);
    if (!tag) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }

    await tagRepository.delete(id);
    res.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({ error: "Failed to delete tag" });
  }
}

export default {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
};

