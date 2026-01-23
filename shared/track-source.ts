import crypto from "crypto";

export type TrackSource = "youtube" | "soundcloud" | "spotify" | "other";

export interface SourceDetectionResult {
  source: TrackSource;
  sourceId: string;
  canonicalUri: string;
}

/**
 * Detect track source + stable sourceId and return a canonical URI to store in DB.
 *
 * YouTube canonicalization:
 * - Keep only the video id (`v` parameter).
 * - Drop all unnecessary parameters:
 *   - Playlist: `list`, `index`
 *   - Start time: `t`, `start`, `time_continue`
 *   - Other: `si`, `feature`, and any other query parameters
 *
 * This means inputs like:
 * - https://www.youtube.com/watch?v=odDxJliW2Fg&list=RDMM...&index=11&t=30
 * - https://www.youtube.com/watch?v=odDxJliW2Fg&start=60
 * become:
 * - https://www.youtube.com/watch?v=odDxJliW2Fg
 */
export function detectTrackSource(inputUri: string): SourceDetectionResult {
  const trimmed = (inputUri || "").trim();
  if (!trimmed) {
    return {
      source: "other",
      sourceId: crypto.createHash("md5").update("").digest("hex"),
      canonicalUri: `unknown:${Date.now()}`,
    };
  }

  // Spotify URI: spotify:track:{id}
  const spotifyUriMatch = trimmed.match(/^spotify:track:([A-Za-z0-9]+)$/);
  if (spotifyUriMatch) {
    const id = spotifyUriMatch[1];
    return {
      source: "spotify",
      sourceId: id,
      canonicalUri: `https://open.spotify.com/track/${id}`,
    };
  }

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();

    // YouTube (including youtu.be, music.youtube.com, shorts)
    if (host.includes("youtube.com") || host === "youtu.be" || host.includes("music.youtube.com")) {
      const videoId = extractYoutubeVideoId(u);
      if (videoId) {
        // Canonical: keep only v=VIDEO_ID (drop list/index/etc.)
        return {
          source: "youtube",
          sourceId: videoId,
          canonicalUri: `https://www.youtube.com/watch?v=${videoId}`,
        };
      }
    }

    // Spotify URL: open.spotify.com/track/{id}
    if (host.includes("open.spotify.com")) {
      const m = u.pathname.match(/^\/track\/([A-Za-z0-9]+)/);
      if (m?.[1]) {
        return {
          source: "spotify",
          sourceId: m[1],
          canonicalUri: `https://open.spotify.com/track/${m[1]}`,
        };
      }
    }

    // SoundCloud: use host+path as stable-ish ID
    if (host.includes("soundcloud.com")) {
      const sid = `${host}${u.pathname}`.toLowerCase();
      return {
        source: "soundcloud",
        sourceId: sid,
        canonicalUri: u.toString(),
      };
    }

    // Other: canonical is the URL itself
    return {
      source: "other",
      sourceId: crypto.createHash("md5").update(u.toString()).digest("hex"),
      canonicalUri: u.toString(),
    };
  } catch {
    // Not a URL
    return {
      source: "other",
      sourceId: crypto.createHash("md5").update(trimmed).digest("hex"),
      canonicalUri: trimmed,
    };
  }
}

function extractYoutubeVideoId(u: URL): string | null {
  const host = u.hostname.toLowerCase();

  if (host === "youtu.be") {
    return u.pathname.replace("/", "") || null;
  }

  // /shorts/{id}
  if (u.pathname.startsWith("/shorts/")) {
    return u.pathname.split("/")[2] || null;
  }

  // /watch?v={id}
  const v = u.searchParams.get("v");
  if (v) return v;

  return null;
}


