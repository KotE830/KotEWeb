import { Shoukaku } from "shoukaku";
import { Track } from "./track";
import { sendError } from "../discord/message";
import { updateQueueMessage } from "./update-queue-message";
import client from "../../client";

/**
 * Linked list node for queue
 */
class QueueNode {
  track: Track;
  next: QueueNode | null = null;

  constructor(track: Track) {
    this.track = track;
  }
}

/**
 * Linked list-based queue implementation
 */
class LinkedListQueue {
  head: QueueNode | null = null;
  tail: QueueNode | null = null;
  size: number = 0;

  /**
   * Add track to end of queue (O(1))
   * 
   * @param track - Track to add
   */
  enqueue(track: Track): void {
    const newNode = new QueueNode(track);
    
    if (!this.tail) {
      // Queue is empty
      this.head = newNode;
      this.tail = newNode;
    } else {
      // Add to end of queue
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.size++;
  }

  /**
   * Remove track from front of queue (O(1))
   * 
   * @returns Removed track or undefined if queue is empty
   */
  dequeue(): Track | undefined {
    if (!this.head) {
      return undefined;
    }

    const track = this.head.track;
    this.head = this.head.next;
    
    if (!this.head) {
      // Queue is empty
      this.tail = null;
    }
    
    this.size--;
    return track;
  }

  /**
   * Add track to front of queue (O(1))
   * 
   * @param track - Track to add
   */
  enqueueFront(track: Track): void {
    const newNode = new QueueNode(track);
    
    if (!this.head) {
      // Queue is empty
      this.head = newNode;
      this.tail = newNode;
    } else {
      // Add to front of queue
      newNode.next = this.head;
      this.head = newNode;
    }
    this.size++;
  }

  /**
   * Peek first track in queue without removing (O(1))
   * 
   * @returns First track or undefined if queue is empty
   */
  peek(): Track | undefined {
    return this.head?.track;
  }

  /**
   * Convert queue to array (O(n))
   * 
   * @returns Array of tracks in queue order
   */
  toArray(): Track[] {
    const result: Track[] = [];
    let current = this.head;
    while (current) {
      result.push(current.track);
      current = current.next;
    }
    return result;
  }

  /**
   * 특정 인덱스의 트랙 제거 (O(n))
   */
  removeAt(index: number): Track | undefined {
    if (index < 0 || index >= this.size || !this.head) {
      return undefined;
    }

    if (index === 0) {
      // Remove first node
      return this.dequeue();
    }

    // Find node at index position
    let current = this.head;
    for (let i = 0; i < index - 1; i++) {
      if (!current.next) {
        return undefined;
      }
      current = current.next;
    }

    // current.next is the node to remove
    if (!current.next) {
      return undefined;
    }

    const removedNode = current.next;
    current.next = removedNode.next;

    // Update tail if last node was removed
    if (removedNode === this.tail) {
      this.tail = current;
    }

    this.size--;
    return removedNode.track;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  /**
   * Get queue length
   * 
   * @returns Number of tracks in queue
   */
  get length(): number {
    return this.size;
  }
}

/**
 * Queue management class
 * Manages queues for multiple guilds
 */
class QueueManager {
  private queues = new Map<string, LinkedListQueue>();
  private repeatingGuilds = new Map<string, boolean>();

  /**
   * Get existing queue or create new one
   * 
   * @param guildId - Discord server (guild) ID
   * @returns Queue instance for the guild
   */
  private getOrCreateQueue(guildId: string): LinkedListQueue {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, new LinkedListQueue());
    }
    return this.queues.get(guildId)!;
  }

  /**
   * Add track to queue (O(1))
   * 
   * @param guildId - Discord server (guild) ID
   * @param track - Track to add
   */
  addToQueue(guildId: string, track: Track): void {
    const queue = this.getOrCreateQueue(guildId);
    queue.enqueue(track);
    // 큐 변경 시 DB에 저장
    saveQueueToDatabase(guildId);
  }

  /**
   * Peek first track in queue (does not remove) (O(1))
   */
  peekQueue(guildId: string): Track | undefined {
    const queue = this.queues.get(guildId);
    return queue?.peek();
  }

  /**
   * Get first track from queue (removes) (O(1))
   */
  dequeue(guildId: string): Track | undefined {
    const queue = this.queues.get(guildId);
    const track = queue?.dequeue();
    if (track) {
      // Save queue to database when queue changes
      saveQueueToDatabase(guildId);
    }
    return track;
  }

  /**
   * Add track to front of queue (next track to play) (O(1))
   */
  addToFront(guildId: string, track: Track): void {
    const queue = this.getOrCreateQueue(guildId);
    queue.enqueueFront(track);
    // Save queue to database when queue changes
    saveQueueToDatabase(guildId);
  }

  /**
   * Get queue (convert to array) (O(n))
   */
  getQueue(guildId: string): Track[] {
    const queue = this.queues.get(guildId);
    return queue ? queue.toArray() : [];
  }

  /**
   * Clear queue
   */
  clearQueue(guildId: string): void {
    const queue = this.queues.get(guildId);
    if (queue) {
      queue.clear();
    }
    this.queues.delete(guildId);
    // Save queue to database when queue changes
    saveQueueToDatabase(guildId);
  }

  /**
   * Set/unset repeat mode
   */
  setRepeating(guildId: string, isRepeating: boolean): void {
    this.repeatingGuilds.set(guildId, isRepeating);
  }

  /**
   * Check repeat mode status
   */
  isRepeating(guildId: string): boolean {
    return this.repeatingGuilds.get(guildId) || false;
  }

  /**
   * Toggle repeat mode
   */
  toggleRepeating(guildId: string): boolean {
    const current = this.isRepeating(guildId);
    this.setRepeating(guildId, !current);
    return !current;
  }

  /**
   * Remove track at specific index from queue (O(n))
   */
  removeFromQueue(guildId: string, index: number): Track | undefined {
    const queue = this.queues.get(guildId);
    if (!queue) {
      return undefined;
    }
    const track = queue.removeAt(index);
    if (track !== undefined) {
      // Save queue to database when queue changes
      saveQueueToDatabase(guildId);
    }
    return track;
  }

  /**
   * Setup queue listener on Shoukaku's ready event
   * Listen to Player's end event to auto-play next track
   */
  setupQueueListener(shoukaku: Shoukaku): void {
    // Setup end event listener for each player
    shoukaku.on("ready", () => {
      // Add end event listener for all players
      shoukaku.players.forEach((player) => {
        this.setupPlayerQueueListener(player);
      });
    });
  }

  /**
   * Setup queue listener for individual player
   */
  setupPlayerQueueListener(player: any): void {
    // Check if listener is already set (prevent duplicates)
    if ((player as { _queueListenerSet?: boolean })._queueListenerSet) {
      return;
    }
    
    player.on("end", async (track: any) => {
      const guildId = player.guildId;
      
      // end event receives TrackEndEvent object
      // Structure: { op: 'event', type: 'TrackEndEvent', track: { encoded, info }, reason }
      const trackData = track?.track;
      const trackEncoded = trackData?.encoded;
      const trackInfo = trackData?.info;
      
      // If repeat mode is enabled and track info exists, add to end of queue
      if (this.isRepeating(guildId) && trackEncoded) {
        const trackToRepeat: Track = {
          encoded: trackEncoded,
          info: {
            title: trackInfo?.title || "Unknown",
            artist: trackInfo?.author || trackInfo?.artist || "Unknown",
          },
        };
        this.addToQueue(guildId, trackToRepeat);
      }

      const nextTrack = this.dequeue(guildId);

      if (nextTrack) {
        // Play if there's a next track in queue
        player.playTrack({ track: { encoded: nextTrack.encoded } }).then(async () => {
          // Save current track info to Player on successful playback
          (player as any)._currentTrack = nextTrack;
          // Save playback start time
          (player as any)._trackStartTime = Date.now();
          // Initialize pause-related variables
          (player as any)._pausedTime = 0;
          (player as any)._pauseStartTime = null;
          
          // Save queue to database when queue changes (track playback started)
          await saveQueueToDatabase(guildId);
          
          // Update queue message
          await updateQueueMessage(guildId);
        }).catch((error: { message: any; }) => {
          const errorMsg =
            error instanceof Error ? error.message : "Failed to play track";
          sendError("Queue", errorMsg);
        });
      } else {
        // Remove player.track if there's no next track in queue
        (player as { track?: any }).track = null;
        // 저장된 트랙 정보도 제거
        (player as any)._currentTrack = null;
        
        // 큐 변경 시 DB에 저장 (재생 종료)
        await saveQueueToDatabase(guildId);
        
        // Queue 메시지 업데이트
        await updateQueueMessage(guildId);
      }
    });
    
    // 리스너가 설정되었음을 표시
    (player as { _queueListenerSet?: boolean })._queueListenerSet = true;
  }
}

// Singleton instance
const queueManager = new QueueManager();

// Export functions for compatibility
/**
 * Add track to queue
 * 
 * @param guildId - Discord server (guild) ID
 * @param track - Track to add
 */
export function addToQueue(guildId: string, track: Track): void {
  queueManager.addToQueue(guildId, track);
}

export function peekQueue(guildId: string): Track | undefined {
  return queueManager.peekQueue(guildId);
}

export function dequeue(guildId: string): Track | undefined {
  return queueManager.dequeue(guildId);
}

export function addToFront(guildId: string, track: Track): void {
  queueManager.addToFront(guildId, track);
}

export function getQueue(guildId: string): Track[] {
  return queueManager.getQueue(guildId);
}

export function clearQueue(guildId: string): void {
  queueManager.clearQueue(guildId);
}

export function removeFromQueue(guildId: string, index: number): Track | undefined {
  return queueManager.removeFromQueue(guildId, index);
}

export function setupQueueListener(shoukaku: Shoukaku): void {
  queueManager.setupQueueListener(shoukaku);
}

export function setupPlayerQueueListener(player: any): void {
  queueManager.setupPlayerQueueListener(player);
}

export function setRepeating(guildId: string, isRepeating: boolean): void {
  queueManager.setRepeating(guildId, isRepeating);
}

export function isRepeating(guildId: string): boolean {
  return queueManager.isRepeating(guildId);
}

export function toggleRepeating(guildId: string): boolean {
  return queueManager.toggleRepeating(guildId);
}

// 클래스 인스턴스도 export (직접 사용 가능)
export { queueManager };

/**
 * Get current playback position in seconds
 * Uses Shoukaku Player's position property
 * 
 * @param player - Shoukaku player instance
 * @returns Current position in seconds
 */
function getCurrentPosition(player: any): number {
  const playerPosition = (player as { position?: number }).position;
  if (playerPosition !== undefined && playerPosition !== null) {
    // 밀리초 → 초 변환
    return Math.floor(playerPosition / 1000);
  }
  return 0;
}

/**
 * Save queue for a specific channel to database (automatically called when queue changes)
 * 
 * @param guildId - Discord server (guild) ID
 */
async function saveQueueToDatabase(guildId: string): Promise<void> {
  try {
    const { QueueService } = await import("../../../database");
    const queueService = new QueueService();
    const queueArray = queueManager.getQueue(guildId);
    
    if (queueArray.length === 0 && !client.shoukaku?.players.get(guildId)) {
      // 큐가 비어있고 player도 없으면 저장하지 않음
      return;
    }
    
    // 현재 재생 중인 트랙 가져오기 (player에서)
    let currentTrack: Track | null = null;
    let position: number | undefined = undefined;
    
    if (client.shoukaku) {
      const player = client.shoukaku.players.get(guildId);
      if (player) {
        currentTrack = (player as any)._currentTrack as Track | null;
        if (currentTrack) {
          // 재생 위치 계산 (초 단위)
          position = getCurrentPosition(player);
        }
      }
    }
    
    // 비동기로 저장 (논블로킹)
    queueService.saveQueue(guildId, currentTrack, queueArray, position).catch((error) => {
      console.error(`Failed to save queue for guild ${guildId}:`, error);
    });
  } catch (error) {
    console.error(`Failed to save queue for guild ${guildId}:`, error);
  }
}

/**
 * Save all queues to database (for backup when bot shuts down)
 */
export async function saveAllQueuesToDatabase(): Promise<void> {
  try {
    const { QueueService } = await import("../../../database");
    const queueService = new QueueService();
    
    // 모든 guild의 큐 저장 (player가 있는 guild만)
    if (client.shoukaku) {
      for (const [guildId, player] of client.shoukaku.players.entries()) {
        const queueArray = queueManager.getQueue(guildId);
        
        // 현재 재생 중인 트랙 가져오기
        const currentTrack = (player as any)._currentTrack as Track | null;
        
        try {
          await queueService.saveQueue(guildId, currentTrack, queueArray);
          console.log(`✓ Saved queue for guild ${guildId} (${queueArray.length} tracks)`);
        } catch (error) {
          console.error(`Failed to save queue for guild ${guildId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Failed to save queues:", error);
  }
}

/**
 * Restore queue from database and load into memory
 * 
 * @param guildId - Discord server (guild) ID
 * @returns Object with restored status and optional playback position
 */
export async function restoreQueueFromDatabase(guildId: string): Promise<{ restored: boolean; position?: number }> {
  try {
    const { QueueService } = await import("../../../database");
    const queueService = new QueueService();
    
    const savedData = await queueService.loadQueue(guildId);
    if (!savedData || (!savedData.currentTrack && savedData.queue.length === 0)) {
      return { restored: false };
    }
    
    // 큐 복원
    if (savedData.queue.length > 0) {
      queueManager.clearQueue(guildId);
      savedData.queue.forEach((track) => {
        queueManager.addToQueue(guildId, track);
      });
    }
    
    // 반복 모드 복원
    if (savedData.isRepeating) {
      queueManager.setRepeating(guildId, true);
    }
    
    // 현재 트랙 정보 저장 (player에 설정하기 위해)
    if (client.shoukaku) {
      const player = client.shoukaku.players.get(guildId);
      if (player && savedData.currentTrack) {
        (player as any)._currentTrack = savedData.currentTrack;
      }
    }
    
    console.log(`✓ Restored queue for guild ${guildId} (${savedData.queue.length} tracks)`);
    return { restored: true, position: savedData.position };
  } catch (error) {
    console.error(`Failed to restore queue for guild ${guildId}:`, error);
    return { restored: false };
  }
}

