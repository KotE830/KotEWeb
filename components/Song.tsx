'use client';

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../app/styles/song.css";
import axios from "axios";

interface IProps {
  song: ISong;
  onSongClick?: (song: ISong) => void;
}

export interface ISong {
  id: string;
  title: string;
  artist: string;
  uri: string;
  source?: string;
  sourceId?: string;
  tagIds: string[];
  isPlaying: boolean;
  createdDate: number;
  length: number;
  // Legacy fields for backward compatibility
  song?: string;
  singer?: string;
}

interface ITag {
  id: string;
  name: string;
}

export default function Song({ song: s, onSongClick }: IProps) {
  const [song, setSong] = useState(s);
  const [isInQueue, setIsInQueue] = useState(false);
  const [tags, setTags] = useState<ITag[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch tag data
    async function fetchTags() {
      try {
        const response = await axios.get("/api/tags");
        // Ensure response.data is an array
        const tagsData = Array.isArray(response.data) ? response.data : [];
        setTags(tagsData);
      } catch (error) {
        console.error("Error fetching tags:", error);
        setTags([]); // Set empty array on error
      }
    }
    fetchTags();
  }, []);

  // Find tag names corresponding to song.tagIds
  // Ensure tags is an array and song.tagIds exists and is an array
  const songTagIds = Array.isArray(song.tagIds) ? song.tagIds : [];
  const songTags = Array.isArray(tags) 
    ? tags.filter(tag => songTagIds.includes(tag.id))
    : [];

  const thumbnail =
    (song.source === "youtube" && song.sourceId
      ? `https://i.ytimg.com/vi/${song.sourceId}/hqdefault.jpg`
      : "");

  async function toggleQueue() {
    try {
      if (isInQueue) {
        const params = new URLSearchParams();
        params.append("url", song.uri);
        await axios.post("/api/songs/removequeue", null, { params });
        setIsInQueue(false);
      } else {
        const params = new URLSearchParams();
        params.append("song", song.uri || song.title || song.song);
        const response = await axios.post("/api/songs/addqueue", null, { params });

        if (response.data.success) {
          setIsInQueue(true);
          console.log(`"${song.title || song.song}" has been added to the queue and will play.`);
        } else {
          alert("Failed to add to queue.");
        }
      }
    } catch (error: any) {
      console.error("Error toggling queue:", error);
      alert("Failed to manipulate queue: " + (error.response?.data?.message || error.message));
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/song/edit/${song.id}`);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete?")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/songs/${song.id}`
        : `/api/songs/${song.id}`;

      fetch(apiUrl, {
        method: "DELETE",
      }).then((res) => {
        if (res.ok) {
          setSong({
            ...song,
            id: "",
          });
        }
      });
    }
  }

  function handleLinkClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  if (song.id === "") {
    return null;
  }

  return (
    <div className="song-item">
      <li key={song.id} className={`song-card ${isInQueue ? "in-queue" : ""}`}>
        <div className="song-content" onClick={() => {
          if (onSongClick) {
            onSongClick(song);
          } else {
            toggleQueue();
          }
        }}>
          {thumbnail ? (
            <img src={thumbnail} className="thumbnail" alt={`${song.title || song.song} by ${song.artist || song.singer}`} />
          ) : (
            <div className="thumbnail" style={{ backgroundColor: "#222" }} />
          )}
          <div className="song-info">
            <h3>{song.title || song.song}</h3>
            <p>{song.artist || song.singer}</p>
            {songTags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px", marginBottom: "8px" }}>
                {songTags.map((tag) => (
                  <span
                    key={tag.id}
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      backgroundColor: "#4a9eff",
                      color: "#fff",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
              {song.length && (
                <span className="length" style={{ color: "#888", fontSize: "14px" }}>
                  Length: {Math.floor(song.length / 60)}:{(song.length % 60).toString().padStart(2, "0")}
                </span>
              )}
              {isInQueue && <span className="queue-badge">In Queue</span>}
            </div>
          </div>
        </div>
        <div className="song-actions">
          <a
            href={song.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link"
            onClick={handleLinkClick}
          >
            🔗 Link
          </a>
          <button
            className="btn-edit"
            onClick={handleEdit}
          >
            ✏️ Edit
          </button>
          <button
            className="btn-delete"
            onClick={handleDelete}
          >
            🗑️ Delete
          </button>
        </div>
      </li>
    </div>
  );
}

