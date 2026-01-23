import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/command";
import { sendError, sendMessage, getGuildAndShoukaku, isRepeating, addToQueue, getQueue, dequeue, setupPlayerQueueListener, type Track } from "../../utils";

class SkipToCommand implements Command {
  readonly title = "SkipTo";
  readonly description = "Skip to a specific track in the queue";
  readonly data: SlashCommandBuilder;

  constructor() {
    this.data = new SlashCommandBuilder()
      .setName(this.title.toLowerCase())
      .setDescription(this.description)
      .addIntegerOption((option) =>
        option
          .setName("index")
          .setDescription("Track number to skip to (1 = next track)")
          .setRequired(true)
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

    // 현재 재생 중인 트랙 확인
    const currentTrack = (player as any)._currentTrack as Track | undefined;
    if (!currentTrack) {
      await sendError(this.title, "No track is currently playing.", interaction);
      return;
    }

    // 큐 가져오기
    const queue = getQueue(guild.id);
    const targetIndex = interaction.options.getInteger("index", true);

    // 인덱스 유효성 검사 (1부터 큐 길이까지)
    if (targetIndex < 1 || targetIndex > queue.length) {
      await sendError(
        this.title,
        `Invalid index. Please provide a number between 1 and ${queue.length}.`,
        interaction
      );
      return;
    }

    try {
      // 반복 모드일 때 현재 트랙을 큐 맨 뒤에 추가
      if (isRepeating(guild.id)) {
        addToQueue(guild.id, currentTrack);
      }

      // 현재 트랙부터 (targetIndex - 1)개까지의 트랙들을 큐에서 제거
      // 예: targetIndex가 3이면, 큐의 0, 1번째 트랙을 제거하고 2번째 트랙을 재생
      for (let i = 0; i < targetIndex - 1; i++) {
        dequeue(guild.id);
      }

      // targetIndex번째 트랙 가져오기 (이제 큐의 첫 번째가 됨)
      const targetTrack = dequeue(guild.id);
      
      if (!targetTrack) {
        await sendError(this.title, "Failed to get target track from queue.", interaction);
        return;
      }

      // 현재 트랙 중지하고 목표 트랙 재생
      (player as { stop?: () => void | Promise<void> }).stop?.();
      
      // 큐 리스너가 설정되어 있는지 확인
      if (!(player as { _queueListenerSet?: boolean })._queueListenerSet) {
        setupPlayerQueueListener(player);
      }

      // 목표 트랙을 큐 맨 앞에 추가 (end 이벤트에서 자동 재생되도록)
      // 하지만 직접 재생하는 것이 더 나을 수 있음
      await player.playTrack({ track: { encoded: targetTrack.encoded } });
      
      // Player에 현재 트랙 정보 저장
      (player as any)._currentTrack = targetTrack;
      // 재생 시작 시간 저장
      (player as any)._trackStartTime = Date.now();
      // 일시정지 관련 변수 초기화
      (player as any)._pausedTime = 0;
      (player as any)._pauseStartTime = null;

      await sendMessage(
        this.title,
        `⏭️ Skipped to track ${targetIndex}: **${targetTrack.info.title}**\nby ${(targetTrack.info as any).artist || (targetTrack.info as any).author || "Unknown"}`,
        interaction
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to skip to track";
      await sendError(this.title, errorMsg, interaction);
    }
  }
}

export default new SkipToCommand();

