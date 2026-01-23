'use client';

import { useEffect, useRef, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function CreateSong() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useRequireAuth();
  const [textSong, setSong] = useState("");
  const [textSinger, setSinger] = useState("");
  const [textUrl, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedTitle, setResolvedTitle] = useState<string | null>(null);
  const [resolvedArtist, setResolvedArtist] = useState<string | null>(null);

  function onChangeSong(event: React.ChangeEvent<HTMLInputElement>) {
    setSong(event.target.value);
  }

  function onChangeSinger(event: React.ChangeEvent<HTMLInputElement>) {
    setSinger(event.target.value);
  }

  function onChangeUrl(event: React.ChangeEvent<HTMLInputElement>) {
    setUrl(event.target.value);
  }

  useEffect(() => {
    async function tryAutofillFromUrl() {
      const url = textUrl.trim();
      if (!url) {
        // Clear resolved data when URL is removed
        setResolvedTitle(null);
        setResolvedArtist(null);
        return;
      }

      try {
        const res = await fetch(`/api/tracks/resolve?uri=${encodeURIComponent(url)}`);
        if (!res.ok) {
          setResolvedTitle(null);
          setResolvedArtist(null);
          return;
        }
        const data = await res.json();
        // Store resolved data for placeholder (don't fill actual input)
        const title = data?.title || null;
        const artist = data?.artist || null;
        setResolvedTitle(title);
        setResolvedArtist(artist);
        // Don't set actual values - only use as placeholder
      } catch (error) {
        console.error("Failed to resolve track metadata:", error);
        setResolvedTitle(null);
        setResolvedArtist(null);
      }
    }

    // Debounce a bit
    const t = setTimeout(() => {
      tryAutofillFromUrl();
    }, 400);
    return () => clearTimeout(t);
  }, [textUrl]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoading && songRef.current) {
      setIsLoading(true);

      let title = songRef.current.value.trim();
      let artist = singerRef.current?.value.trim() || "";
      const url = urlRef.current?.value.trim();
      
      if (!url) {
        alert("Url is required.");
        setIsLoading(false);
        return;
      }
      
      // If title or artist is empty, use resolved data from URL
      if (!title && resolvedTitle) {
        title = resolvedTitle;
      }
      if (!artist && resolvedArtist) {
        artist = resolvedArtist;
      }
      
      if (!title) {
        alert("Song title is required.");
        setIsLoading(false);
        return;
      }
      
      if (!artist) {
        alert("Artist is required.");
        setIsLoading(false);
        return;
      }

      const apiUrl = "/api/songs/";

      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          artist,
          uri: url,
          length: 0,
          tagIds: [],
        }),
      }).then(async (res) => {
        if (res.ok) {
          alert("Creation completed.");
          setIsLoading(false);
          router.push("/song");
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(`Failed to create: ${errorData.error || res.statusText}`);
          setIsLoading(false);
        }
      }).catch((error) => {
        console.error("Error creating song:", error);
        alert(`Failed to create: ${error.message}`);
        setIsLoading(false);
      });
    }

    setSong("");
    setSinger("");
    setUrl("");
  }

  const songRef = useRef<HTMLInputElement>(null);
  const singerRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  // Show loading screen if loading or not authenticated
  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="input_area">
        <label>Song</label>
        <input
          type="text"
          value={textSong}
          placeholder={resolvedTitle || "song"}
          ref={songRef}
          onChange={onChangeSong}
        />
      </div>
      <div className="input_area">
        <label>Singer</label>
        <input
          type="text"
          value={textSinger}
          placeholder={resolvedArtist || "singer"}
          ref={singerRef}
          onChange={onChangeSinger}
        />
      </div>
      <div className="input_area">
        <label>Url</label>
        <input
          type="url"
          value={textUrl}
          placeholder="url"
          ref={urlRef}
          onChange={onChangeUrl}
          required
        />
      </div>
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
    </form>
  );
}

