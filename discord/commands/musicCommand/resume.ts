import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/command";
import { sendError, sendMessage, getGuildAndShoukaku } from "../../utils";

class ResumeCommand implements Command {
  readonly title = "Resume";
  readonly description = "Resume the paused song";
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

    // 일시정지 중인지 확인
    const isPaused = (player as { paused?: boolean }).paused || (player as any)._isPaused || false;
    if (!isPaused) {
      await sendError(this.title, "The track is not paused.", interaction);
      return;
    }

    try {
      // Shoukaku player 재개
      await player.setPaused(false);
      
      // 일시정지된 시간 누적
      const pauseStartTime = (player as any)._pauseStartTime as number | undefined;
      const pausedTime = (player as any)._pausedTime as number | undefined;
      
      if (pauseStartTime) {
        // 일시정지 시작 시간부터 현재까지의 시간을 누적 일시정지 시간에 추가
        const pauseDuration = Date.now() - pauseStartTime;
        (player as any)._pausedTime = (pausedTime || 0) + pauseDuration;
      }
      
      // 일시정지 상태 해제
      (player as any)._isPaused = false;
      (player as any)._pauseStartTime = null;
      
      await sendMessage(
        this.title,
        "▶️ Resumed the current track.",
        interaction
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to resume track";
      await sendError(this.title, errorMsg, interaction);
    }
  }
}

export default new ResumeCommand();

