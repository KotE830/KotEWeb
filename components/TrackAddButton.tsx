'use client';

import { useState, useEffect } from "react";
import axios from "axios";

interface TrackAddButtonProps {
  track: {
    title: string;
    artist: string;
    uri?: string;
    length?: number;
  };
}

export default function TrackAddButton({ track }: TrackAddButtonProps) {
  const [exists, setExists] = useState<boolean | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if track exists in database
    async function checkTrack() {
      if (!track.title || !track.artist) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await axios.post("/api/songs/check", {
          title: track.title,
          artist: track.artist,
        });
        setExists(response.data.exists);
      } catch (error) {
        console.error("Error checking track:", error);
        setExists(false);
      } finally {
        setIsChecking(false);
      }
    }

    checkTrack();
  }, [track.title, track.artist]);

  async function handleAdd() {
    if (!track.title || !track.artist) return;
    if (!track.uri) {
      alert("URI is required to add track to database.");
      return;
    }

    setIsAdding(true);
    try {
      await axios.post("/api/songs/", {
        title: track.title,
        artist: track.artist,
        uri: track.uri,
        length: track.length || 0,
        tagIds: [],
      });
      setExists(true);
      alert(`"${track.title}" has been added to the database.`);
    } catch (error: any) {
      console.error("Error adding track:", error);
      alert("Failed to add track: " + (error.response?.data?.error || error.message));
    } finally {
      setIsAdding(false);
    }
  }

  // Don't show button if checking or track already exists
  if (isChecking || exists === true) {
    return null;
  }

  return (
    <button
      onClick={handleAdd}
      disabled={isAdding}
      onMouseEnter={(e) => {
        if (!isAdding) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(76, 175, 80, 0.4)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isAdding) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(76, 175, 80, 0.3)";
        }
      }}
      style={{
        padding: "6px 12px",
        background: isAdding
          ? "linear-gradient(135deg, #666 0%, #555 100%)"
          : "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
        boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
        borderRadius: "4px",
        border: "none",
        color: "#fff",
        fontSize: "13px",
        fontWeight: "600",
        cursor: isAdding ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        transition: "all 0.3s ease",
        whiteSpace: "nowrap",
        opacity: isAdding ? 0.6 : 1,
      }}
    >
      <span>{isAdding ? "⏳" : "➕"}</span>
      <span>{isAdding ? "Adding..." : "Add to DB"}</span>
    </button>
  );
}

