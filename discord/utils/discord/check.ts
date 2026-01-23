import { ChatInputCommandInteraction, Guild } from "discord.js";
import client from "../../client";
import { sendError } from "./message";

/**
 * Check if Discord bot and Lavalink are initialized
 * Sends error message and returns false if not ready
 * 
 * @param title - Command title for error messages
 * @param interaction - Optional ChatInputCommandInteraction (for sending error messages)
 * @returns true if initialized, false otherwise
 */
export async function checkBotReady(
  title: string,
  interaction?: ChatInputCommandInteraction
): Promise<boolean> {
  if (!client || !client.isReady()) {
    await sendError(title, "Discord bot is not ready", interaction);
    return false;
  }

  if (!client.shoukaku) {
    await sendError(title, "Lavalink is not initialized", interaction);
    return false;
  }

  return true;
}

/**
 * Check Discord bot and Lavalink initialization, then return Guild
 * Sends error message and returns null if not ready
 * 
 * @param title - Command title for error messages
 * @param interaction - Optional ChatInputCommandInteraction (for sending error messages)
 * @returns Guild object if initialized, null otherwise
 */
export async function getGuild(
  title: string,
  interaction?: ChatInputCommandInteraction
): Promise<Guild | null> {
  // Bot과 Lavalink 초기화 확인
  const isReady = await checkBotReady(title, interaction);
  if (!isReady) {
    return null;
  }

  // Guild 확인
  const guild = client.guilds.cache.first();
  if (!guild) {
    await sendError(title, "No guild found", interaction);
    return null;
  }

  return guild;
}

/**
 * Check Discord bot, Lavalink, Guild, and Shoukaku initialization, then return objects
 * Same as getGuild but explicitly includes Shoukaku check
 * 
 * @param title - Command title for error messages
 * @param interaction - Optional ChatInputCommandInteraction (for sending error messages)
 * @returns Object with guild and shoukaku if initialized, null otherwise
 */
export async function getGuildAndShoukaku(
  title: string,
  interaction?: ChatInputCommandInteraction
): Promise<{ guild: Guild; shoukaku: NonNullable<typeof client.shoukaku> } | null> {
  // Bot과 Lavalink 초기화 확인
  const guild = await getGuild(title, interaction);
  if (!guild) {
    return null;
  }
  
  const shoukaku = client.shoukaku;
  if (!shoukaku) {
    await sendError(title, "Lavalink is not initialized", interaction);
    return null;
  }

  return {
    guild,
    shoukaku,
  };
}

