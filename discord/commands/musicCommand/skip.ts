import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/command";
import { sendError, sendMessage, getGuildAndShoukaku, isRepeating, addToQueue, updateQueueMessage, type Track } from "../../utils";

class SkipCommand implements Command {
  readonly title = "Skip";
  readonly description = "Skip the current song";
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

    // 현재 재생 중인 트랙 확인
    const currentTrack = (player as any)._currentTrack as Track | undefined;
    if (!currentTrack) {
      await sendError(this.title, "No track is currently playing.", interaction);
      return;
    }

    try {
      // 반복 모드일 때 현재 트랙을 큐 맨 뒤에 추가
      if (isRepeating(guild.id)) {
        addToQueue(guild.id, currentTrack);
      }

      // 현재 트랙 중지 (end 이벤트 발생하여 자동으로 다음 트랙 재생)
      (player as { stop?: () => void | Promise<void> }).stop?.();

      await sendMessage(
        this.title,
        `⏭️ Skipped: **${currentTrack.info.title}**\nby ${(currentTrack.info as any).artist || (currentTrack.info as any).author || "Unknown"}`,
        interaction
      );

      // Queue 메시지 업데이트
      await updateQueueMessage(guild.id);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to skip track";
      await sendError(this.title, errorMsg, interaction);
    }
  }
}

export default new SkipCommand();

