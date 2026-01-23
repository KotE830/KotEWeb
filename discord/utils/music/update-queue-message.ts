import client from "../../client";
import { getQueue, getQueueMessage } from "../index";
import { createEmbed } from "../discord/message";
import { EmbedColors, QueueConfig, DefaultValues, TimeConstants } from "../../config";
import type { Track } from "./track";

/**
 * Update queue message
 * Called from other commands or events to automatically update the queue message
 * 
 * @param guildId - Discord server (guild) ID
 */
export async function updateQueueMessage(guildId: string): Promise<void> {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return;
  }

  const queueMessage = getQueueMessage(guildId);
  if (!queueMessage) {
    // Queue 메시지가 없으면 업데이트하지 않음
    return;
  }

  try {
    // Player 가져오기
    if (!client.shoukaku) {
      return;
    }

    const player = client.shoukaku.players.get(guildId);
    if (!player) {
      return;
    }

    // 시간 포맷 함수
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
      const pausedTime = (player as any)._pausedTime as number | undefined;
      const pauseStartTime = (player as any)._pauseStartTime as number | undefined;
      const currentTrackLength = currentTrack?.info?.length;

      if (!trackStartTime || !currentTrackLength) {
        return 0;
      }

      const isPaused = (player as { paused?: boolean }).paused || (player as any)._isPaused || false;

      let totalPausedTime = pausedTime || 0;
      if (isPaused && pauseStartTime) {
        totalPausedTime += Date.now() - pauseStartTime;
      }

      const elapsedTime = Date.now() - trackStartTime;
      const actualPlayTime = elapsedTime - totalPausedTime;

      const position = Math.floor(actualPlayTime / TimeConstants.MS_TO_SECONDS) * TimeConstants.MS_TO_SECONDS;
      return Math.max(0, Math.min(position, currentTrackLength));
    };

    // 큐 가져오기
    const queue = getQueue(guildId);
    const totalTracks = queue.length;
    const itemsPerPage = QueueConfig.ITEMS_PER_PAGE;
    const totalPages = Math.max(1, Math.ceil(totalTracks / itemsPerPage));

    // 현재 재생 중인 트랙 정보
    const currentTrack = (player as any)._currentTrack as Track | undefined;
    const currentTrackTitle = currentTrack?.info?.title || DefaultValues.NO_TRACK_TITLE;
    const currentTrackArtist = currentTrack?.info?.artist || (currentTrack?.info as any)?.author || "";
    const currentTrackLength = currentTrack?.info?.length;
  // Thumbnail is no longer stored
    const currentPosition = getCurrentPosition();

    // 첫 페이지만 표시 (페이지네이션은 사용자가 버튼으로 변경)
    const startIndex = 0;
    const endIndex = Math.min(itemsPerPage, totalTracks);
    const pageTracks = queue.slice(startIndex, endIndex);

    let description = `**Now Playing:** ${currentTrackTitle}`;
    if (currentTrackArtist) {
      description += ` by ${currentTrackArtist}`;
    }

    if (currentTrackLength && currentPosition >= 0) {
      const currentTime = formatTime(currentPosition);
      const totalTime = formatTime(currentTrackLength);
      description += `\n⏱️ ${currentTime} / ${totalTime}`;
    } else if (currentTrackLength) {
      description += `\n⏱️ ${formatTime(currentTrackLength)}`;
    }

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

    description += `\n**Page 1/${totalPages}**`;

    const embed = createEmbed(
      "Queue",
      description,
      EmbedColors.INFO
    );
    
    // 강조를 위한 타임스탬프 추가
    embed.setTimestamp();

    // Thumbnail is no longer stored

    // 메시지 업데이트
    await queueMessage.edit({
      embeds: [embed],
    });
  } catch (error) {
    // 메시지가 이미 삭제되었거나 수정할 수 없는 경우 무시
    console.warn(`Failed to update queue message for guild ${guildId}:`, error);
  }
}

