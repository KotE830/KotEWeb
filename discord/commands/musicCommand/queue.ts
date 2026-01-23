import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { Command } from "../types/command";
import { getGuildAndShoukaku, getQueue, deletePreviousQueueMessage, setQueueMessage, updateQueueMessage, sendError, sendMessage, createEmbed, isRepeating, type Track } from "../../utils";
import { EmbedColors, QueueConfig, UIConfig, DefaultValues, TimeConstants } from "../../config";

class QueueCommand implements Command {
  readonly title = "Queue";
  readonly description = "Show the current music queue";
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

    // 시간 포맷 함수 (밀리초를 mm:ss 형식으로)
    const formatTime = (ms: number | undefined): string => {
      if (!ms || ms < 0) return "0:00";
      const totalSeconds = Math.floor(ms / TimeConstants.MS_TO_SECONDS);
      const minutes = Math.floor(totalSeconds / TimeConstants.SECONDS_TO_MINUTES);
      const seconds = totalSeconds % TimeConstants.SECONDS_TO_MINUTES;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };
    
    // 현재 재생 진행 시간 계산 함수
    const getCurrentPosition = (): number => {
      const currentTrack = (player as any)._currentTrack as Track | undefined;
      const trackStartTime = (player as any)._trackStartTime as number | undefined;
      const pausedTime = (player as any)._pausedTime as number | undefined; // 일시정지된 총 시간 (밀리초)
      const pauseStartTime = (player as any)._pauseStartTime as number | undefined; // 현재 일시정지 시작 시간
      const currentTrackLength = currentTrack?.info?.length;
      
      if (!trackStartTime || !currentTrackLength) {
        return 0;
      }
      
      // 현재 일시정지 중인지 확인 (player.paused 또는 _isPaused)
      const isPaused = (player as { paused?: boolean }).paused || (player as any)._isPaused || false;
      
      // 일시정지된 총 시간 계산
      let totalPausedTime = pausedTime || 0;
      if (isPaused && pauseStartTime) {
        // 현재 일시정지 중이면 일시정지 시작 시간부터 현재까지의 시간 추가
        totalPausedTime += Date.now() - pauseStartTime;
      }
      
      // 실제 재생 시간 = 경과 시간 - 일시정지된 총 시간
      const elapsedTime = Date.now() - trackStartTime;
      const actualPlayTime = elapsedTime - totalPausedTime;
      
      const position = Math.floor(actualPlayTime / TimeConstants.MS_TO_SECONDS) * TimeConstants.MS_TO_SECONDS;
      return Math.max(0, Math.min(position, currentTrackLength));
    };
    
    // 큐 가져오기
    const queue = getQueue(guild.id);
    const totalTracks = queue.length;
    const itemsPerPage = QueueConfig.ITEMS_PER_PAGE;
    const totalPages = Math.max(1, Math.ceil(totalTracks / itemsPerPage));

    // 현재 페이지 (기본값: 1)
    let currentPage = 1;

    // 큐 메시지 생성 함수
    const createQueueMessage = (page: number) => {
      // 현재 재생 중인 트랙 정보 (최신 정보 가져오기)
      const currentTrack = (player as any)._currentTrack as Track | undefined;
      const currentTrackTitle = currentTrack?.info?.title || DefaultValues.NO_TRACK_TITLE;
      const currentTrackArtist = currentTrack?.info?.artist || (currentTrack?.info as any)?.author || "";
      const currentTrackLength = currentTrack?.info?.length;
      // Thumbnail is no longer stored
      
      // 현재 재생 진행 시간 계산 (최신 시간)
      const currentPosition = getCurrentPosition();
      
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalTracks);
      const pageTracks = queue.slice(startIndex, endIndex);

      let description = `**Now Playing:** ${currentTrackTitle}`;
      if (currentTrackArtist) {
        description += ` by ${currentTrackArtist}`;
      }
      
      // 현재 재생 진행 시간 표시
      if (currentTrackLength && currentPosition >= 0) {
        const currentTime = formatTime(currentPosition);
        const totalTime = formatTime(currentTrackLength);
        description += `\n⏱️ ${currentTime} / ${totalTime}`;
      } else if (currentTrackLength) {
        description += `\n⏱️ ${formatTime(currentTrackLength)}`;
      }
      
      // Repeat 상태 표시
      const repeatStatus = isRepeating(guild.id);
      description += `\n${repeatStatus ? "🔁 Repeat: **On**" : "⏸️ Repeat: **Off**"}`;
      
      description += `\n\n`;

      if (totalTracks === 0) {
        description += "Queue is empty.";
      } else {
        description += `**Queue (${totalTracks} track${totalTracks !== 1 ? "s" : ""}):**\n\n`;
        pageTracks.forEach((track, index) => {
          const queueIndex = startIndex + index + 1;
          description += `${queueIndex}. **${track.info.title}**\n   by ${track.info.artist || (track.info as any).author || "Unknown"}`;
          if (track.info.length) {
            description += ` • ${formatTime(track.info.length)}`;
          }
          description += `\n`;
        });
      }

      description += `\n**Page ${page}/${totalPages}**`;

      const embed = createEmbed(
        this.title,
        description,
        EmbedColors.INFO
      );
      
      // 강조를 위한 타임스탬프 추가
      embed.setTimestamp();
      
      return embed;
    };

    // 버튼 생성 함수
    const createButtons = (page: number) => {
      const components: ActionRowBuilder<ButtonBuilder>[] = [];
      
      // 페이지네이션 버튼 (페이지가 2개 이상일 때만)
      if (totalPages > 1) {
        const navRow = new ActionRowBuilder<ButtonBuilder>();
        const prevButton = new ButtonBuilder()
          .setCustomId("queue_prev")
          .setLabel("◀ Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page <= 1);

        const nextButton = new ButtonBuilder()
          .setCustomId("queue_next")
          .setLabel("Next ▶")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page >= totalPages);

        navRow.addComponents(prevButton, nextButton);
        components.push(navRow);
      }
      
      return components;
    };

    // 1. 이전 Queue 메시지 삭제
    await deletePreviousQueueMessage(guild.id);

    // 초기 메시지 전송
    const embed = createQueueMessage(currentPage);
    const buttons = createButtons(currentPage);

    const response = await interaction.reply({
      embeds: [embed],
      components: buttons,
      fetchReply: true,
    });

    // 2. 새 Queue 메시지 ID 저장
    setQueueMessage(guild.id, response);

    // 버튼 클릭 리스너
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: UIConfig.BUTTON_COLLECTOR_TIMEOUT,
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content: "You can't use this button.",
          ephemeral: true,
        });
        return;
      }

      // 페이지네이션 버튼 처리
      if (buttonInteraction.customId === "queue_prev") {
        currentPage = Math.max(1, currentPage - 1);
      } else if (buttonInteraction.customId === "queue_next") {
        currentPage = Math.min(totalPages, currentPage + 1);
      }

      const updatedEmbed = createQueueMessage(currentPage);
      const updatedButtons = createButtons(currentPage);

      await buttonInteraction.update({
        embeds: [updatedEmbed],
        components: updatedButtons,
      });
    });

    collector.on("end", async () => {
      // 버튼 비활성화
      const disabledButtons = createButtons(currentPage);
      disabledButtons.forEach((row) => {
        row.components.forEach((button) => {
          button.setDisabled(true);
        });
      });

      try {
        await interaction.editReply({
          embeds: [createQueueMessage(currentPage)],
          components: disabledButtons,
        });
      } catch (error) {
        // 메시지가 이미 삭제되었거나 수정할 수 없는 경우 무시
      }
    });
  }
}

export default new QueueCommand();

