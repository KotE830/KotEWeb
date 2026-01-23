import { Request, Response } from "express";
import { TrackRepository } from "../../database/repositories/track.repository";
import { detectTrackSource } from "../../shared/track-source";

const trackRepository = new TrackRepository();

/**
 * Get all tracks
 */
async function getTracks(req: Request, res: Response): Promise<void> {
  try {
    const tracks = await trackRepository.findAll();
    res.json(tracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
}

/**
 * Get a track by ID
 */
async function getTrackById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const track = await trackRepository.findById(id);
    
    if (!track) {
      res.status(404).json({ error: "Track not found" });
      return;
    }
    
    res.json(track);
  } catch (error) {
    console.error("Error fetching track:", error);
    res.status(500).json({ error: "Failed to fetch track" });
  }
}

/**
 * Create a new track
 */
async function createTrack(req: Request, res: Response): Promise<void> {
  try {
    const { title, artist, uri, length, tagIds } = req.body;

    // Check if required fields are provided and not empty
    if (!title || title.trim() === "" || !artist || artist.trim() === "" || !uri || uri.trim() === "") {
      res.status(400).json({ error: "Title, artist, and URI are required" });
      return;
    }

    // Detect track source from URI
    const { source, sourceId, canonicalUri } = detectTrackSource(uri);

    // Create track
    const track = await trackRepository.create({
      title,
      artist,
      uri: canonicalUri,
      length: length || 0,
      source,
      sourceId,
      tagIds: tagIds || [],
    });

    res.status(201).json(track);
  } catch (error) {
    console.error("Error creating track:", error);
    res.status(500).json({ error: "Failed to create track" });
  }
}

/**
 * Update a track
 */
async function updateTrack(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, artist, uri, length, tagIds } = req.body;

    // Check if track exists
    const existingTrack = await trackRepository.findById(id);
    if (!existingTrack) {
      res.status(404).json({ error: "Track not found" });
      return;
    }

    // If URI is provided, detect source
    let source, sourceId, canonicalUri;
    if (uri) {
      const detected = detectTrackSource(uri);
      source = detected.source;
      sourceId = detected.sourceId;
      canonicalUri = detected.canonicalUri;
    }

    // Update track
    const track = await trackRepository.update(id, {
      ...(title && { title }),
      ...(artist && { artist }),
      ...(uri && { uri: canonicalUri, source, sourceId }),
      ...(length !== undefined && { length }),
      ...(tagIds && { tagIds }),
    });

    res.json(track);
  } catch (error) {
    console.error("Error updating track:", error);
    res.status(500).json({ error: "Failed to update track" });
  }
}

/**
 * Delete a track
 */
async function deleteTrack(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const track = await trackRepository.findById(id);
    if (!track) {
      res.status(404).json({ error: "Track not found" });
      return;
    }

    await trackRepository.delete(id);
    res.json({ message: "Track deleted successfully" });
  } catch (error) {
    console.error("Error deleting track:", error);
    res.status(500).json({ error: "Failed to delete track" });
  }
}

/**
 * Check if a track exists by title and artist
 */
async function checkTrack(req: Request, res: Response): Promise<void> {
  try {
    const { title, artist } = req.body;

    if (!title || !artist) {
      res.status(400).json({ error: "Title and artist are required" });
      return;
    }

    const track = await trackRepository.findByTitleAndArtist(title, artist);
    res.json({ exists: !!track });
  } catch (error) {
    console.error("Error checking track:", error);
    res.status(500).json({ error: "Failed to check track" });
  }
}

export default {
  getTracks,
  getTrackById,
  createTrack,
  updateTrack,
  deleteTrack,
  checkTrack,
};

