'use client';

import useFetch from "@/hooks/useFetch";
import useRequireAuth from "@/hooks/useRequireAuth";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import Tag, { ITag } from "@/components/Tag";
import { useTranslation } from "@/hooks/useTranslation";

export default function TagList() {
  const { loading: authLoading, isAuthenticated } = useRequireAuth();
  const { t } = useTranslation();
  const { data: tags, loading } = useFetch<ITag[]>("/api/tags");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortMode, setSortMode] = useState<"default" | "newest" | "nameAsc" | "nameDesc">("default");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const tagList = tags ?? [];

  const filteredAndSortedTags = useMemo(() => {
    // Filter
    let filtered = tagList;
    if (debouncedQuery) {
      filtered = tagList.filter((tag) => {
        const name = (tag.name || "").toLowerCase();
        return name.includes(debouncedQuery);
      });
    }

    // Sort
    const sorted = [...filtered];
    switch (sortMode) {
      case "newest":
        sorted.sort((a, b) => {
          const aDate = (a as any).createdDate || (a as any).createdAt || 0;
          const bDate = (b as any).createdDate || (b as any).createdAt || 0;
          return bDate - aDate;
        });
        break;
      case "nameAsc":
        sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "nameDesc":
        sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "default":
      default:
        sorted.sort((a, b) => {
          const aDate = (a as any).createdDate || (a as any).createdAt || 0;
          const bDate = (b as any).createdDate || (b as any).createdAt || 0;
          return aDate - bDate;
        });
        break;
    }
    return sorted;
  }, [tagList, debouncedQuery, sortMode]);

  // Show loading screen if loading or not authenticated
  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <span>{t('tag.loading')}</span>
      </div>
    );
  }

  if (loading) {
    return <span>{t('tag.loading.short')}</span>;
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, marginBottom: "20px" }}>{t('tag.title')}</h1>
        <div className="search" style={{ display: "flex", gap: "8px", alignItems: "stretch", marginBottom: "20px" }}>
          <div className="input_area" style={{ marginBottom: 0, flex: 1, maxWidth: "400px" }}>
            <input
              type="text"
              placeholder={t('tag.search.placeholder')}
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
            <option value="default">{t('tag.sort.default')}</option>
            <option value="newest">{t('tag.sort.newest')}</option>
            <option value="nameAsc">{t('tag.sort.nameAsc')}</option>
            <option value="nameDesc">{t('tag.sort.nameDesc')}</option>
          </select>
          <Link href="/tag/create" style={{ marginLeft: "auto" }}>
            <button className="btn-primary" style={{ height: "40px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {t('tag.button.add')}
            </button>
          </Link>
        </div>
      </div>
      {filteredAndSortedTags.length === 0 ? (
        <div style={{ padding: "20px", color: "#888" }}>
          {tagList.length === 0 ? t('tag.empty.noTags') : t('tag.empty.noMatching')}
        </div>
      ) : (
        <ul className="list_tag" style={{ listStyle: "none", padding: 0 }}>
          {filteredAndSortedTags.map((tag) => (
            <Tag tag={tag} key={tag.id} />
          ))}
        </ul>
      )}
    </div>
  );
}

