'use client';

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface IProps {
  tag: ITag;
}

export interface ITag {
  id: string;
  name: string;
  songIds?: string[];
  tracks?: Array<{
    id: string;
    title: string;
    artist: string;
  }>;
}

interface ISong {
  id: string;
  title: string;
  artist: string;
  uri: string;
  tagIds: string[];
  count?: number;
  // Legacy fields for backward compatibility
  song?: string;
  singer?: string;
}

export default function Tag({ tag: t }: IProps) {
  const [tag, setTag] = useState(t);
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);
  const router = useRouter();

  async function handleTagClick() {
    if (isAddingToQueue) return;
    
    setIsAddingToQueue(true);
    try {
      // Fetch all songs
      const songsResponse = await axios.get<ISong[]>("/api/songs");
      const allSongs = songsResponse.data;
      
      // Filter only songs with this tag
      const tagSongs = allSongs.filter(song => song.tagIds.includes(tag.id));
      
      if (tagSongs.length === 0) {
        alert(`No songs found with tag "${tag.name}".`);
        setIsAddingToQueue(false);
        return;
      }
      
      // Add each song to queue
      let successCount = 0;
      let failCount = 0;
      
      for (const song of tagSongs) {
        try {
          const params = new URLSearchParams();
          const songParam = song.uri || song.title || song.song || "";
          params.append("song", songParam);
          const response = await axios.post("/api/songs/addqueue", null, { params });
          
          if (response.data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error: any) {
          console.error(`Error adding song ${song.title || song.song} to queue:`, error);
          failCount++;
        }
      }
      
      if (successCount > 0) {
        alert(`Added ${successCount} song(s) with tag "${tag.name}" to the queue.${failCount > 0 ? ` (${failCount} failed)` : ''}`);
      } else {
        alert(`Failed to add to queue. (${failCount} failed)`);
      }
    } catch (error: any) {
      console.error("Error fetching songs:", error);
      alert("Failed to fetch song list: " + (error.response?.data?.message || error.message));
    } finally {
      setIsAddingToQueue(false);
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/tag/edit/${tag.id}`);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete?")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/tags/${tag.id}`
        : `/api/tags/${tag.id}`;

      fetch(apiUrl, {
        method: "DELETE",
      }).then((res) => {
        if (res.ok) {
          setTag({
            ...tag,
            id: "",
          });
        }
      });
    }
  }

  if (tag.id === "") {
    return null;
  }

  const songs = tag.tracks || [];

  return (
    <div className="tag-item">
      <li key={tag.id} className="tag-card" style={{
        display: "flex",
        flexDirection: "column",
        background: "#2a2a2a",
        borderRadius: "12px",
        overflow: "hidden",
        transition: "all 0.3s ease",
        border: "2px solid transparent",
        marginBottom: "16px",
      }}>
        <div 
          className="tag-content" 
          onClick={handleTagClick}
          style={{
            padding: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            cursor: isAddingToQueue ? "wait" : "pointer",
            opacity: isAddingToQueue ? 0.7 : 1,
          }}
        >
          <div className="tag-info">
            <h3 style={{ margin: 0, fontSize: "18px", color: "#fff", fontWeight: "600" }}>
              {tag.name} {isAddingToQueue && "(Adding...)"}
            </h3>
            <div style={{ marginTop: "8px" }}>
              <span style={{ color: "#888", fontSize: "14px" }}>
                Songs: {songs.length}
              </span>
            </div>
            {songs.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: "8px",
                  marginTop: "8px"
                }}>
                  {songs.map((song) => (
                    <span
                      key={song.id}
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        backgroundColor: "#2a2a2a",
                        color: "#e0e0e0",
                        borderRadius: "16px",
                        fontSize: "13px",
                        border: "1px solid #444",
                      }}
                    >
                      {song.title} {song.artist ? `- ${song.artist}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="tag-actions" style={{
          display: "flex",
          gap: "8px",
          padding: "12px 15px",
          background: "#1a1a1a",
          borderTop: "1px solid #333",
        }}>
          <button 
            className="btn-edit"
            onClick={handleEdit}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(74, 158, 255, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            style={{
              flex: 1,
              padding: "10px 15px",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              background: "linear-gradient(135deg, #4a9eff 0%, #357abd 100%)",
              color: "#fff",
              fontWeight: "600",
              transition: "all 0.3s ease",
            }}
          >
            ✏️ Edit
          </button>
          <button 
            className="btn-delete"
            onClick={handleDelete}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(244, 67, 54, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            style={{
              flex: 1,
              padding: "10px 15px",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
              color: "#fff",
              fontWeight: "600",
              transition: "all 0.3s ease",
            }}
          >
            🗑️ Delete
          </button>
        </div>
      </li>
    </div>
  );
}

