import { Message } from "discord.js";

/**
 * Guild별 Queue 메시지 ID를 저장하는 매니저
 */
class QueueMessageManager {
  private queueMessages = new Map<string, Message | null>();

  /**
   * Guild의 Queue 메시지 저장
   */
  setQueueMessage(guildId: string, message: Message | null): void {
    this.queueMessages.set(guildId, message);
  }

  /**
   * Get queue message for a guild
   * 
   * @param guildId - Discord server (guild) ID
   * @returns Queue message or null if not found
   */
  getQueueMessage(guildId: string): Message | null {
    return this.queueMessages.get(guildId) || null;
  }

  /**
   * Clear queue message for a guild
   * 
   * @param guildId - Discord server (guild) ID
   */
  clearQueueMessage(guildId: string): void {
    this.queueMessages.delete(guildId);
  }

  /**
   * Attempt to delete previous queue message
   * 
   * @param guildId - Discord server (guild) ID
   */
  async deletePreviousMessage(guildId: string): Promise<void> {
    const previousMessage = this.getQueueMessage(guildId);
    if (previousMessage) {
      try {
        await previousMessage.delete();
      } catch (error) {
        // 메시지가 이미 삭제되었거나 삭제할 수 없는 경우 무시
        console.warn(`Failed to delete previous queue message for guild ${guildId}:`, error);
      }
    }
  }
}

const queueMessageManager = new QueueMessageManager();

/**
 * Store queue message for a guild
 * 
 * @param guildId - Discord server (guild) ID
 * @param message - Queue message or null
 */
export function setQueueMessage(guildId: string, message: Message | null): void {
  queueMessageManager.setQueueMessage(guildId, message);
}

/**
 * Get queue message for a guild
 * 
 * @param guildId - Discord server (guild) ID
 * @returns Queue message or null if not found
 */
export function getQueueMessage(guildId: string): Message | null {
  return queueMessageManager.getQueueMessage(guildId);
}

/**
 * Clear queue message for a guild
 * 
 * @param guildId - Discord server (guild) ID
 */
export function clearQueueMessage(guildId: string): void {
  queueMessageManager.clearQueueMessage(guildId);
}

/**
 * Attempt to delete previous queue message
 * 
 * @param guildId - Discord server (guild) ID
 */
export async function deletePreviousQueueMessage(guildId: string): Promise<void> {
  await queueMessageManager.deletePreviousMessage(guildId);
}

