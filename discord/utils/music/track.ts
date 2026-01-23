import { ChatInputCommandInteraction } from "discord.js";
import { Shoukaku } from "shoukaku";
import { sendError } from "../discord/message";
import { SearchConfig, LavalinkNodeState } from "../../config";
import { detectTrackSource } from "../../../shared/track-source";

/**
 * Track interface representing a music track
 */
export interface Track {
  /** Lavalink encoded track string */
  encoded: string;
  info: {
    /** Track title */
    title: string;
    /** Track artist */
    artist: string;
    /** Track length in milliseconds */
    length?: number;
    /** Track URI */
    uri?: string;
  };
}

/**
 * Search and extract a track from Lavalink node
 *
 * @param query - Search query (URL or search term)
 * @param shoukaku - Shoukaku instance
 * @param trackTitle - Command title for error messages
 * @param interaction - Optional ChatInputCommandInteraction (for sending error messages)
 * @returns Track information or null if failed
 */
export async function getTrack(
  query: string,
  shoukaku: Shoukaku,
  trackTitle: string,
  interaction?: ChatInputCommandInteraction
): Promise<Track | null> {
  // Lavalink 노드 가져오기
  const nodes = Array.from(shoukaku.nodes.values());

  // 노드 상태 확인 및 디버깅
  if (nodes.length === 0) {
    console.error("Lavalink nodes:", nodes.length);
    await sendError(
      trackTitle,
      "No Lavalink nodes configured. Please check your Lavalink configuration.",
      interaction
    );
    return null;
  }

  // 노드 상태 로그
  nodes.forEach((n) => {
    const nodeState = (n as { state?: number }).state;
    const nodeName = (n as { name?: string }).name || "unknown";
    console.log(
      `Lavalink node ${nodeName} state: ${nodeState} (0=DISCONNECTED, 1=CONNECTING, 2=CONNECTED, 3=RECONNECTING)`
    );
  });

  // CONNECTED 상태인 노드 찾기
  let node = nodes.find((n) => (n as { state?: number }).state === LavalinkNodeState.CONNECTED);

  // CONNECTED 노드가 없으면 첫 번째 노드 사용 (연결 중일 수 있음)
  if (!node) {
    node = nodes[0];
    const nodeState = (node as { state?: number }).state;
    const nodeName = (node as { name?: string }).name || "unknown";

    if (nodeState !== LavalinkNodeState.CONNECTED) {
      console.warn(
        `Lavalink node ${nodeName} is not fully connected (state: ${nodeState}). Attempting to use it anyway...`
      );
    }
  }

  if (!node) {
    await sendError(
      trackTitle,
      "No Lavalink node available. Please ensure Lavalink server is running and connected.",
      interaction
    );
    return null;
  }

  // 트랙 검색 (URL인지 검색어인지 확인)
  let result: any;
  try {
    const isUrl = SearchConfig.URL_PROTOCOLS.some(protocol => query.startsWith(protocol));
    let search: string;
    
    if (isUrl) {
      // URL인 경우 정규화하여 불필요한 파라미터 제거 (예: YouTube의 list, index, t, start 등)
      const { canonicalUri } = detectTrackSource(query);
      search = canonicalUri;
    } else {
      search = `${SearchConfig.YOUTUBE_SEARCH_PREFIX}${query}`;
    }
    
    result = await node.rest.resolve(search);
  } catch (error) {
    await sendError(trackTitle, "Failed to search for tracks", interaction);
    return null;
  }

  if (!result) {
    await sendError(trackTitle, "No tracks found", interaction);
    return null;
  }

  // LoadType에 따라 트랙 추출
  const loadType = result.loadType;
  let track: any;
  let encoded: string | undefined;
  let title = "Unknown";
  let artist = "Unknown";
  let length: number | undefined;
  let uri: string | undefined;

  switch (loadType) {
    case "track":
    case "TRACK_LOADED":
      track = result.data;
      break;
    case "search":
    case "SEARCH_RESULT":
      if (Array.isArray(result.data) && result.data.length > 0) {
        track = result.data[0];
      }
      break;
    case "playlist":
    case "PLAYLIST_LOADED":
      // 1곡만 추가
      if (Array.isArray(result.data) && result.data.length > 0) {
        track = result.data.tracks[0];
      }
      break;
    case "empty":
    case "NO_MATCHES": {
      await sendError(trackTitle, "No tracks found", interaction);
      return null;
    }
    case "error":
    case "LOAD_FAILED":
    default: {
      await sendError(trackTitle, "load failed", interaction);
      return null;
    }
  }
  encoded = track.encoded;
  title = track.info.title;
  artist = track.info.author;
  length = track.info.length;
  const rawUri = track.info.uri;

  if (!encoded) {
    await sendError(trackTitle, "No tracks found", interaction);
    return null;
  }

  // Normalize URI to remove unnecessary parameters (e.g., YouTube's list, index, t, start, etc.)
  // This ensures consistent storage and prevents errors from Lavalink
  const normalizedUri = rawUri ? detectTrackSource(rawUri).canonicalUri : undefined;

  return {
    encoded,
    info: {
      title,
      artist,
      length,
      uri: normalizedUri,
    },
  };
}

