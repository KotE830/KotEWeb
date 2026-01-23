// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

// Read version from package.json
import packageJson from "../package.json";

// Embed Colors
export const EmbedColors = {
  SUCCESS: 0x00ff00,
  ERROR: 0xff0000,
  INFO: 0x5865f2,
  HELP: 0x0099ff,
  WARNING: 0xffa500,
} as const;

// Lavalink Configuration
// Validate required environment variables
if (!process.env.LAVALINK_HOST) {
  throw new Error('LAVALINK_HOST is required');
}
if (!process.env.LAVALINK_PORT) {
  throw new Error('LAVALINK_PORT is required');
}
if (!process.env.LAVALINK_PASSWORD) {
  throw new Error('LAVALINK_PASSWORD is required');
}

export const LavalinkConfig = {
  /** Lavalink node configuration */
  NODES: [
    {
      name: process.env.LAVALINK_NODE_NAME,
      url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
      auth: process.env.LAVALINK_PASSWORD,
    },
  ] as Array<{ name: string; url: string; auth: string }>,

  /** Shoukaku options */
  SHOUKAKU_OPTIONS: {
    moveOnDisconnect: false,
    resume: false,
    reconnectTries: 5,
    restTimeout: 10000,
    userAgent: `KotEBot/${packageJson.version} (discord_bot)`,
  },
} as const;

// Queue Configuration
export const QueueConfig = {
  /** Number of tracks to display per page */
  ITEMS_PER_PAGE: 10,
} as const;

// UI Configuration
export const UIConfig = {
  /** Maximum number of buttons per row (Discord limit) */
  MAX_BUTTONS_PER_ROW: 5,

  /** Button collector auto-close timeout (milliseconds) */
  BUTTON_COLLECTOR_TIMEOUT: 60000, // 60 seconds
} as const;

// Time Constants
export const TimeConstants = {
  /** Constant to convert milliseconds to seconds */
  MS_TO_SECONDS: 1000,

  /** Constant to convert seconds to minutes */
  SECONDS_TO_MINUTES: 60,
} as const;

// Default Values
export const DefaultValues = {
  /** Title to display when no track is currently playing */
  NO_TRACK_TITLE: "None",

  /** Default category emoji */
  DEFAULT_CATEGORY_EMOJI: "📁",
} as const;

// Search Configuration
export const SearchConfig = {
  YOUTUBE_SEARCH_PREFIX: "ytsearch:",
  URL_PROTOCOLS: ["http://", "https://"],
} as const;

// Lavalink Node States
export const LavalinkNodeState = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  RECONNECTING: 3,
} as const;

