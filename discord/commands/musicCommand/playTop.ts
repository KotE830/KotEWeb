import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../types/command";
import { sendError, sendMessage, getVoiceChannel, getGuildAndShoukaku, getTrack, addToFront, setupPlayerQueueListener, type Track } from "../../utils";
import joinCommand from "../basicCommand/join";
// TrackRepository import removed - tracks are no longer auto-saved to DB

type TrackSource = "youtube" | "soundcloud" | "spotify" | "other";
import { detectTrackSource } from "../../../shared/track-source";

// Source detection is shared in `shared/track-source.ts`

class PlayTopCommand implements Command {
  readonly title = "PlayTop";
  readonly description = "Add a song to the top of the queue (play next)";
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
    // Discord: execute(interaction) - interaction에서 query 추출
    // Web: execute(query) - query를 직접 전달
    let query: string;
    let interaction: ChatInputCommandInteraction | undefined;

    if (typeof queryOrInteraction === "string") {
      // Web에서 호출: query를 직접 전달
      query = queryOrInteraction;
      interaction = undefined;
    } else if (queryOrInteraction) {
      // Discord에서 호출: interaction 전달
      interaction = queryOrInteraction;
      query = interaction.options.getString("query", true) || "";
    } else {
      // 둘 다 없으면 에러
      throw new Error("Query or interaction is required");
    }

    if (!query) {
      await sendError(this.title, "Query is required", interaction);
      return;
    }

    // Bot, Lavalink, Guild 초기화 확인 (에러 메시지 자동 전송)
    const initResult = await getGuildAndShoukaku(this.title, interaction);
    if (!initResult) {
      return;
    }

    const { guild, shoukaku } = initResult;

    // 트랙 검색
    const track = await getTrack(query, shoukaku, this.title, interaction);
    if (!track) {
      return;
    }

    const { encoded, info } = track;
    const { title, artist, length, uri } = info as any;

    // Track is not persisted to DB here - user must use "Add to DB" button on web interface

    // 음성 채널 찾기
    const voiceChannel = await getVoiceChannel(this.title, interaction);

    if (!voiceChannel) {
      return;
    }

    // Player 가져오기 또는 생성
    let player = shoukaku.players.get(guild.id);
    if (!player) {
      // Player가 없으면 joinVoiceChannel을 호출하여 연결
      try {
        await joinCommand.execute(interaction);
        // joinVoiceChannel이 성공하면 player를 다시 가져오기
        player = shoukaku.players.get(guild.id);

        // Player에 큐 리스너 설정
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
      // 기존 player에도 큐 리스너가 없을 수 있으므로 설정
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

    // 현재 재생 중인지 확인
    const currentTrack = (player as { track?: any }).track;
    const isPlaying = currentTrack !== undefined && currentTrack !== null;

    try {
      if (isPlaying) {
        // 재생 중이면 큐 맨 앞에 추가 (다음에 재생될 트랙)
        addToFront(guild.id, track);
        await sendMessage(
          this.title,
          `Added to top of queue (next): **${title}**\nby ${artist || "Unknown"}`,
          interaction
        );
      } else {
        // 재생 중이 아니면 바로 재생 (큐에 추가하지 않음)
        await player.playTrack({ track: { encoded } });
        // Player에 현재 트랙 정보 저장
        const currentTrack: Track = {
          encoded,
          info: { title, artist, length, uri } as any,
        };
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
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to add track to queue";
      await sendError(this.title, errorMsg, interaction);
    }
  }
}

export default new PlayTopCommand();

