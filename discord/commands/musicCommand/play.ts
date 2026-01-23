import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../types/command";
import { sendError, sendMessage, getVoiceChannel, getGuildAndShoukaku, getTrack, addToQueue, getQueue, updateQueueMessage, setupPlayerQueueListener, type Track } from "../../utils";
import joinCommand from "../basicCommand/join";
// TrackRepository and detectTrackSource imports removed - tracks are no longer auto-saved to DB

// Source detection is shared in `shared/track-source.ts`

class PlayCommand implements Command {
  readonly title = "Play";
  readonly description = "Play a song";
  readonly data: SlashCommandBuilder;

  constructor() {
    this.data = new SlashCommandBuilder()
      .setName(this.title.toLowerCase())
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("query")
          .setDescription("Song name or URL")
          .setRequired(true)
      ) as SlashCommandBuilder;
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void>; // discord
  async execute(query: string): Promise<void>; // web
  async execute(
    queryOrInteraction?: string | ChatInputCommandInteraction
  ): Promise<void> {
    // Discord: execute(interaction) - extract query from interaction
    // Web: execute(query) - pass query directly
    let query: string;
    let interaction: ChatInputCommandInteraction | undefined;

    if (typeof queryOrInteraction === "string") {
      // Called from web: pass query directly
      query = queryOrInteraction;
      interaction = undefined;
    } else if (queryOrInteraction) {
      // Called from Discord: pass interaction
      interaction = queryOrInteraction;
      query = interaction.options.getString("query", true) || "";
    } else {
      // Error if both are missing
      throw new Error("Query or interaction is required");
    }

    if (!query) {
      await sendError(this.title, "Query is required", interaction);
      return;
    }

    // Check Bot, Lavalink, Guild initialization (error messages sent automatically)
    const initResult = await getGuildAndShoukaku(this.title, interaction);
    if (!initResult) {
      return;
    }

    const { guild, shoukaku } = initResult;

    // Search for track
    const track = await getTrack(query, shoukaku, this.title, interaction);
    if (!track) {
      return;
    }

    const { encoded, info } = track;
    const { title, artist, length, uri } = info as any;

    // Find voice channel
    const voiceChannel = await getVoiceChannel(this.title, interaction);

    if (!voiceChannel) {
      return;
    }

    // Get or create Player
    let player = shoukaku.players.get(guild.id);
    if (!player) {
      // If Player doesn't exist, call joinVoiceChannel to connect
      try {
        await joinCommand.execute(interaction);
        // Get player again after joinVoiceChannel succeeds
        player = shoukaku.players.get(guild.id);
        
        // Setup queue listener on Player
        if (player) {
          setupPlayerQueueListener(player);
        }
      } catch (error) {
        await sendError(
          this.title,
          "Failed to join voice channel",
          interaction
        );
        return;
      }
    } else {
      // Setup queue listener even for existing player (may not have one)
      setupPlayerQueueListener(player);
    }

    if (!player) {
      await sendError(
        this.title,
        "Failed to get or create player",
        interaction
      );
      return;
    }

    // 현재 재생 중인지 확인 (player.track이 존재하는지)
    const currentTrack = (player as { track?: any }).track;
    const isPlaying = currentTrack !== undefined && currentTrack !== null;
    
    try {
      if (!isPlaying) {
        // 재생 중이 아니면 바로 재생
        await player.playTrack({ track: { encoded } });
        // Player에 현재 트랙 정보 저장
        const currentTrack: Track = { encoded, info: { title, artist, length, uri } as any };
        (player as any)._currentTrack = currentTrack;
        // 재생 시작 시간 저장
        (player as any)._trackStartTime = Date.now();
        // 일시정지 관련 변수 초기화
        (player as any)._pausedTime = 0;
        (player as any)._pauseStartTime = null;
        await sendMessage(
          this.title,
          `Now Playing: **${title}**\nby ${artist || "Unknown"}`,
          interaction
        );
      } else {
        // 재생 중이고 큐에도 트랙이 있으면 큐에 추가
        addToQueue(guild.id, { encoded, info: { title, artist, length, uri } as any });
        await sendMessage(
          this.title,
          `Added to queue: **${title}**\nby ${artist || "Unknown"}`,
          interaction
        );
        
        // Queue 메시지 업데이트
        await updateQueueMessage(guild.id);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to play track";
      await sendError(this.title, errorMsg, interaction);
    }
  }
}

export default new PlayCommand();
