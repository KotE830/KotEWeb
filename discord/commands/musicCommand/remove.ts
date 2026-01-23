import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/command";
import { sendError, sendMessage, getGuildAndShoukaku, getQueue, removeFromQueue, updateQueueMessage, type Track } from "../../utils";

class RemoveCommand implements Command {
  readonly title = "Remove";
  readonly description = "Remove a track from the queue or stop current track";
  readonly data: SlashCommandBuilder;

  constructor() {
    this.data = new SlashCommandBuilder()
      .setName(this.title.toLowerCase())
      .setDescription(this.description)
      .addIntegerOption((option) =>
        option
          .setName("index")
          .setDescription("Track number to remove from queue (leave empty to stop current track)")
          .setRequired(false)
          .setMinValue(1)
      ) as SlashCommandBuilder;
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

    // 인덱스 가져오기 (선택적)
    const index = interaction.options.getInteger("index");

    if (index !== null) {
      // 숫자가 제공된 경우: 큐에서 해당 인덱스의 트랙 제거
      const queue = getQueue(guild.id);
      
      // 인덱스 유효성 검사 (1부터 큐 길이까지)
      if (index < 1 || index > queue.length) {
        await sendError(
          this.title,
          `Invalid index. Please provide a number between 1 and ${queue.length}.`,
          interaction
        );
        return;
      }

      // 큐 인덱스는 0부터 시작하므로 (index - 1)
      const removedTrack = removeFromQueue(guild.id, index - 1);
      
      if (!removedTrack) {
        await sendError(this.title, "Failed to remove track from queue.", interaction);
        return;
      }

      await sendMessage(
        this.title,
        `🗑️ Removed track ${index}: **${removedTrack.info.title}**\nby ${(removedTrack.info as any).artist || (removedTrack.info as any).author || "Unknown"}`,
        interaction
      );
    } else {
      // 숫자가 없는 경우: 현재 노래를 멈추고 다음으로 넘어가기
      // (반복 모드일 때는 큐에 다시 넣지 않음)
      const currentTrack = (player as any)._currentTrack as Track | undefined;
      
      if (!currentTrack) {
        await sendError(this.title, "No track is currently playing.", interaction);
        return;
      }

      try {
        // 현재 트랙 중지 (end 이벤트 발생하여 자동으로 다음 트랙 재생)
        // 반복 모드에서도 큐에 다시 넣지 않음 (skip과 다름)
        (player as { stop?: () => void | Promise<void> }).stop?.();

        await sendMessage(
          this.title,
          `⏹️ Stopped: **${currentTrack.info.title}**\nby ${(currentTrack.info as any).artist || (currentTrack.info as any).author || "Unknown"}`,
          interaction
        );

        // Queue 메시지 업데이트
        await updateQueueMessage(guild.id);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to stop track";
        await sendError(this.title, errorMsg, interaction);
      }
    }
    
    // Queue 메시지 업데이트
    await updateQueueMessage(guild.id);
  }
}

export default new RemoveCommand();

