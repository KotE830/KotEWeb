import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/command";
import { sendError, sendMessage, getGuildAndShoukaku } from "../../utils";

class PauseCommand implements Command {
  readonly title = "Pause";
  readonly description = "Pause the current song";
  readonly data: SlashCommandBuilder;

  constructor() {
    this.data = new SlashCommandBuilder()
      .setName(this.title.toLowerCase())
      .setDescription(this.description) as SlashCommandBuilder;
  }

  async execute(interaction?: ChatInputCommandInteraction): Promise<void> {
    if (!interaction) {
      return;
    }

    // Bot, Lavalink, Guild 초기화 확인
    const initResult = await getGuildAndShoukaku(this.title, interaction);
    if (!initResult) {
      return;
    }

    const { guild, shoukaku } = initResult;

    // Player 가져오기
    const player = shoukaku.players.get(guild.id);
    if (!player) {
      await sendError(this.title, "No player found. Please join a voice channel first.", interaction);
      return;
    }

    // 현재 재생 중인지 확인
    const currentTrack = (player as { track?: any }).track;
    if (!currentTrack) {
      await sendError(this.title, "No track is currently playing.", interaction);
      return;
    }

    // 이미 일시정지 중인지 확인
    const isPaused = (player as { paused?: boolean }).paused || (player as any)._isPaused || false;
    if (isPaused) {
      await sendError(this.title, "The track is already paused.", interaction);
      return;
    }

    try {
      // Shoukaku player 일시정지
      await player.setPaused(true);
      
      // 일시정지 상태 표시
      (player as any)._isPaused = true;
      
      // 일시정지 시작 시간 저장
      (player as any)._pauseStartTime = Date.now();
      
      await sendMessage(
        this.title,
        "⏸️ Paused the current track.",
        interaction
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to pause track";
      await sendError(this.title, errorMsg, interaction);
    }
  }
}

export default new PauseCommand();

