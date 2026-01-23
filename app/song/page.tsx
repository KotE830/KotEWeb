'use client';

import useFetch from "@/hooks/useFetch";
import useRequireAuth from "@/hooks/useRequireAuth";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Song, { ISong } from "@/components/Song";
import axios from "axios";
import { useTranslation } from "@/hooks/useTranslation";

export default function SongList() {
  const { loading: authLoading, isAuthenticated } = useRequireAuth();
  const { t } = useTranslation();
  const { data: songs, loading } = useFetch<ISong[]>("/api/songs");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"all" | "title" | "artist">("all");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortMode, setSortMode] = useState<"default" | "newest" | "titleAsc" | "titleDesc" | "artistAsc" | "artistDesc">("default");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const songList = songs ?? [];

  const filteredAndSortedSongs = useMemo(() => {
    // Filter
    let filtered = songList;
    if (debouncedQuery) {
      filtered = songList.filter((s) => {
        const title = (s.title || s.song || "").toLowerCase();
        const artist = (s.artist || s.singer || "").toLowerCase();
        if (searchMode === "all") {
          return title.includes(debouncedQuery) || artist.includes(debouncedQuery);
        } else if (searchMode === "title") {
          return title.includes(debouncedQuery);
        } else {
          return artist.includes(debouncedQuery);
        }
      });
    }

    // Sort
    const sorted = [...filtered];
    switch (sortMode) {
      case "newest":
        sorted.sort((a, b) => (b.createdDate || 0) - (a.createdDate || 0));
        break;
      case "titleAsc":
        sorted.sort((a, b) => (a.title || a.song || "").localeCompare(b.title || b.song || ""));
        break;
      case "titleDesc":
        sorted.sort((a, b) => (b.title || b.song || "").localeCompare(a.title || a.song || ""));
        break;
      case "artistAsc":
        sorted.sort((a, b) => (a.artist || a.singer || "").localeCompare(b.artist || b.singer || ""));
        break;
      case "artistDesc":
        sorted.sort((a, b) => (b.artist || b.singer || "").localeCompare(a.artist || a.singer || ""));
        break;
      case "default":
      default:
        sorted.sort((a, b) => (a.createdDate || 0) - (b.createdDate || 0));
        break;
    }
    return sorted;
  }, [songList, debouncedQuery, searchMode, sortMode]);

  async function handleSongClick(song: ISong) {
    try {
      // Check if there is a current channel selected
      const controlResponse = await axios.get("/api/get-current-control");
      const hasChannel = controlResponse.data.guildId && controlResponse.data.channelId;
      
      if (!hasChannel) {
        // Check active channels as fallback
        try {
          const channelsResponse = await axios.get("/api/active-channels");
          const channels = channelsResponse.data.channels || [];
          if (channels.length === 0) {
            alert(t('song.alert.noChannelSelected'));
            return;
          }
        } catch {
          alert(t('song.alert.noChannelSelected'));
          return;
        }
      }

      const params = new URLSearchParams();
      const songParam = song.uri || song.title || song.song || "";
      params.append("song", songParam);
      const response = await axios.post("/api/songs/addqueue", null, { params });
      
      if (response.data.success) {
        console.log(`"${song.title || song.song}" has been added to the queue and will play.`);
      } else {
        alert(t('song.alert.addToQueueFailed'));
      }
    } catch (error: any) {
      console.error("Error adding song to queue:", error);
      alert(t('song.alert.addToQueueFailed') + ": " + (error.response?.data?.message || error.message));
    }
  }

  // Show loading screen if loading or not authenticated
  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <span>{t('song.loading')}</span>
      </div>
    );
  }

  if (loading) {
    return <span>{t('song.loading.short')}</span>;
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, marginBottom: "20px" }}>{t('song.title')}</h1>
        <div className="search" style={{ display: "flex", gap: "8px", alignItems: "stretch", marginBottom: "20px" }}>
          <div className="input_area" style={{ marginBottom: 0, flex: 1, maxWidth: "400px" }}>
            <input
              type="text"
              placeholder={searchMode === "all" ? t('song.search.placeholder.all') : searchMode === "title" ? t('song.search.placeholder.title') : t('song.search.placeholder.artist')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                height: "40px", 
                borderTopRightRadius: 0, 
                borderBottomRightRadius: 0,
                width: "100%",
                maxWidth: "none"
              }}
            />
          </div>
          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as "all" | "title" | "artist")}
            className="btn-primary"
            style={{
              padding: "8px 12px",
              height: "40px",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderLeft: "none",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              flexShrink: 0,
            }}
            aria-label="Search mode"
          >
            <option value="all">{t('song.search.mode.all')}</option>
            <option value="title">{t('song.search.mode.title')}</option>
            <option value="artist">{t('song.search.mode.artist')}</option>
          </select>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
            className="btn-primary"
            style={{
              padding: "8px 12px",
              height: "40px",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderLeft: "none",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              flexShrink: 0,
            }}
            aria-label="Sort mode"
          >
            <option value="default">{t('song.sort.default')}</option>
            <option value="newest">{t('song.sort.newest')}</option>
            <option value="titleAsc">{t('song.sort.titleAsc')}</option>
            <option value="titleDesc">{t('song.sort.titleDesc')}</option>
            <option value="artistAsc">{t('song.sort.artistAsc')}</option>
            <option value="artistDesc">{t('song.sort.artistDesc')}</option>
          </select>
          <Link href="/song/create" style={{ marginLeft: "auto" }}>
            <button className="btn-primary" style={{ height: "40px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {t('song.button.add')}
            </button>
          </Link>
        </div>
      </div>
      {filteredAndSortedSongs.length === 0 ? (
        <div style={{ padding: "20px", color: "#888" }}>
          {songList.length === 0 ? t('song.empty.noSongs') : t('song.empty.noMatching')}
        </div>
      ) : (
        <ul className="list_song">
          {filteredAndSortedSongs.map((song) => (
            <Song song={song} key={song.id} onSongClick={handleSongClick} />
          ))}
        </ul>
      )}
    </div>
  );
}

