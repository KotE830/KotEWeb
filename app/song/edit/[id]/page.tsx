'use client';

import { useRef, useState, useEffect } from "react";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import useRequireAuth from "@/hooks/useRequireAuth";

interface ITag {
  id: string;
  name: string;
}

export default function EditSong() {
  const params = useParams();
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useRequireAuth();
  const [song, setSong] = useState<any>(null);
  const [textSong, setTextSong] = useState("");
  const [textSinger, setTextSinger] = useState("");
  const [textUrl, setTextUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<ITag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // useRef must be called before conditional rendering (Hooks rules)
  const songRef = useRef<HTMLInputElement>(null);
  const singerRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load data only if authenticated
    if (!isAuthenticated || authLoading) return;

    // Fetch tag list
    async function fetchTags() {
      try {
        const response = await axios.get("/api/tags");
        setTags(response.data || []);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    }
    fetchTags();

    // Get song ID from URL and load data
    const fetchSong = async () => {
      try {
        const response = await axios.get("/api/songs");
        const songs = response.data;
        const foundSong = songs.find((s: any) => s.id === params.id || s.title === params.id);
        if (foundSong) {
          setSong(foundSong);
          setTextSong(foundSong.title || foundSong.song || "");
          setTextSinger(foundSong.artist || foundSong.singer || "");
          setTextUrl(foundSong.uri || foundSong.url || "");
          setSelectedTagIds(foundSong.tagIds || []);
        }
      } catch (error) {
        console.error("Error fetching song:", error);
      }
    };
    fetchSong();
  }, [params.id, isAuthenticated, authLoading]);

  // Show loading screen if loading or not authenticated
  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <span>Loading...</span>
      </div>
    );
  }

  if (!song) {
    return <div>Loading...</div>;
  }

  function onChangeSong(event: React.ChangeEvent<HTMLInputElement>) {
    setTextSong(event.target.value);
  }

  function onChangeSinger(event: React.ChangeEvent<HTMLInputElement>) {
    setTextSinger(event.target.value);
  }

  function onChangeUrl(event: React.ChangeEvent<HTMLInputElement>) {
    setTextUrl(event.target.value);
  }

  function handleTagToggle(tagId: string) {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoading && songRef.current) {
      setIsLoading(true);

      const title = songRef.current.value;
      const artist = singerRef.current?.value || "";
      const url = urlRef.current?.value;

      const apiUrl = `/api/songs/${song.id}`;

      fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...song,
          title: title,
          artist: artist,
          uri: url,
          tagIds: selectedTagIds,
        }),
      }).then(async (res) => {
        if (res.ok) {
          alert("Update completed.");
          router.push("/song");
          setIsLoading(false);
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(`Failed to update: ${errorData.error || res.statusText}`);
          setIsLoading(false);
        }
      }).catch((error) => {
        console.error("Error updating song:", error);
        alert(`Failed to update: ${error.message}`);
        setIsLoading(false);
      });
    }
  }

  // Generate YouTube thumbnail URL
  const getThumbnail = (url: string) => {
    if (!url) return "";
    try {
      const videoId = url.split(/[?&]/)[1]?.split("=")[1] || url.split("/").pop();
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    } catch {
      return "";
    }
  };

  const thumbnail = getThumbnail(textUrl || song.url);

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="input_area">
          <label>Song</label>
          <input
            type="text"
            value={textSong}
            ref={songRef}
            onChange={onChangeSong}
            required
          />
        </div>
        <div className="input_area">
          <label>Singer</label>
          <input
            type="text"
            value={textSinger}
            ref={singerRef}
            onChange={onChangeSinger}
          />
        </div>
        <div className="input_area">
          <label>Url</label>
          <input type="url" value={textUrl} ref={urlRef} onChange={onChangeUrl} />
        </div>
        <div className="input_area">
          <label>Tags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
            {tags.map((tag) => (
              <div
                key={tag.id}
                onClick={() => handleTagToggle(tag.id)}
                style={{
                  padding: "4px 12px",
                  backgroundColor: selectedTagIds.includes(tag.id) ? "#4a9eff" : "#2a2a2a",
                  color: selectedTagIds.includes(tag.id) ? "#fff" : "#e0e0e0",
                  borderRadius: "16px",
                  cursor: "pointer",
                  border: `1px solid ${selectedTagIds.includes(tag.id) ? "#4a9eff" : "#444"}`,
                  transition: "all 0.2s",
                  fontSize: "14px",
                  userSelect: "none",
                }}
              >
                {tag.name}
              </div>
            ))}
          </div>
          {tags.length === 0 && (
            <p style={{ color: "#888", fontSize: "14px", marginTop: "8px" }}>
              No tags registered. <a href="/tag/create" style={{ color: "#4a9eff" }}>Create tag</a>
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(74, 158, 255, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            style={{
              transition: "all 0.3s ease",
            }}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/song")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 152, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 152, 0, 0.3)";
            }}
            style={{
              background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
              boxShadow: "0 4px 12px rgba(255, 152, 0, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            Back
          </button>
        </div>
      </div>
      {thumbnail && (
        <div style={{ 
          flexShrink: 0, 
          minWidth: "400px", 
          maxWidth: "500px", 
          width: "100%", 
          marginTop: "10px",
        }}>
          <div style={{ 
            position: "sticky", 
            top: "20px",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid #444",
            width: "100%",
          }}>
            <img
              src={thumbnail}
              alt={`${textSong || song.title || song.song || ""} thumbnail`}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      )}
    </form>
  );
}

