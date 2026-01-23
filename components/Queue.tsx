'use client';

import "../app/styles/song.css";
import TrackAddButton from "@/components/TrackAddButton";

interface QueueProps {
  track: string | any;
  index?: number;
  onRemove?: (index: number) => void;
}

export default function Queue({ track, index, onRemove }: QueueProps) {
  if (typeof track === "string") {
    return (
      <li className="queue-item">
        <div>{track}</div>
      </li>
    );
  }

  if (track && typeof track === "object") {
    const formatTime = (seconds?: number): string => {
      if (!seconds) return "";
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const title = track.title || track.name || track.song || JSON.stringify(track);
    const timeStr = formatTime(track.length);
    const uri = track.uri;

    return (
      <li className="queue-item">
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          gap: "15px",
          flexWrap: "wrap"
        }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ fontWeight: "500", marginBottom: "4px" }}>
              {title}
            </div>
            {(track.artist || track.author) && (
              <div style={{ color: "#aaa", fontSize: "14px", marginBottom: "4px" }}>
                by {track.artist || track.author}
              </div>
            )}
            <div style={{ color: "#888", fontSize: "13px" }}>
              ⏱️ {timeStr || "N/A"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {uri && (
              <a
                href={uri}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 158, 255, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(74, 158, 255, 0.3)";
                }}
                style={{
                  padding: "6px 12px",
                  background: "linear-gradient(135deg, #4a9eff 0%, #357abd 100%)",
                  boxShadow: "0 2px 8px rgba(74, 158, 255, 0.3)",
                  borderRadius: "4px",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <span>🔗</span>
                <span>Open URL</span>
              </a>
            )}
            <TrackAddButton
              track={{
                title: track.title,
                artist: track.artist || track.author || "Unknown",
                uri: track.uri,
                length: track.length,
              }}
            />
            {onRemove && index !== undefined && (
              <button
                onClick={() => onRemove(index)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(244, 67, 54, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(244, 67, 54, 0.3)";
                }}
                style={{
                  padding: "6px 12px",
                  background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                  boxShadow: "0 2px 8px rgba(244, 67, 54, 0.3)",
                  borderRadius: "4px",
                  border: "none",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
                title="Remove from queue"
              >
                <span>🗑️</span>
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="queue-item">
      <div>{String(track)}</div>
    </li>
  );
}

