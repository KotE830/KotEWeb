import { Request, Response } from "express";
import client from "../client";
import pingCommand from "../commands/basicCommand/ping";

/**
 * Check if bot is on
 * 
 * @param req - Express request
 * @param res - Express response
 */
function isBotOn(req: Request, res: Response): void {
  try {
    const isReady = client.isReady();
    const hasLavalink =
      client.shoukaku !== null && client.shoukaku !== undefined;

    let isActive = false;
    if (isReady && hasLavalink && client.shoukaku) {
      try {
        // Lavalink 연결 상태 확인
        const nodes = Array.from(client.shoukaku.nodes.values());
        isActive = nodes.some((node) => {
          // Shoukaku의 노드 상태 확인 (CONNECTED 상태)
          const nodeObj = node as { state?: number };
          return nodeObj.state === 2; // 2 = CONNECTED
        });
      } catch (error) {
        isActive = isReady;
      }
    }

    res.send(isReady && (isActive || hasLavalink) ? "On" : "Off");
  } catch (error) {
    console.error("Error checking bot status:", error);
    res.send("Off");
  }
}

/**
 * Turn bot on
 * 
 * @param req - Express request
 * @param res - Express response
 */
async function botOn(req: Request, res: Response): Promise<void> {
  try {
    if (!process.env.DISCORD_TOKEN) {
      res.status(500).send("Discord DISCORD_TOKEN not configured");
      return;
    }

    if (!client.shoukaku) {
      res.status(500).send("Lavalink is not initialized");
      return;
    }

    // 클라이언트가 준비되지 않은 경우 로그인
    if (!client.isReady()) {
      client
        .login(process.env.DISCORD_TOKEN)
        .then(() => {
          console.log("✓ Discord bot logged in successfully");
          res.send("On");
        })
        .catch((error: Error) => {
          console.error("❌ Discord bot login failed:", error.message);
          console.error("Error stack:", error.stack);
          res.status(500).send(`Failed to login: ${error.message}`);
        });
    } else {
      res.send("On");
    }
  } catch (error) {
    console.error("❌ Error in botOn function:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).send(`Error: ${errorMessage}`);
  }
}

function botOff(req: Request, res: Response): void {
  try {
    // Lavalink 연결 정리
    if (client.shoukaku) {
      try {
        // 모든 플레이어 정리
        const players = client.shoukaku.players;
        players.forEach((player, guildId) => {
          try {
            // 플레이어 정리
            // shoukaku Player는 destroy 메서드를 가지고 있음
            (player as { destroy?: () => void }).destroy?.();
            client.shoukaku?.players.delete(guildId);
          } catch (playerError) {
            console.error(
              `Error cleaning player for guild ${guildId}:`,
              playerError
            );
          }
        });
        console.log("✓ All Lavalink players cleaned");
      } catch (lavalinkError) {
        console.error("Error destroying Lavalink:", lavalinkError);
      }
    }

    // 모든 음성 연결 종료
    if (client.isReady()) {
      try {
        if (client.voice && client.voice.adapters) {
          const adapters = client.voice.adapters;
          adapters.forEach((adapter, guildId) => {
            try {
              adapter.destroy();
            } catch (adapterError) {
              console.error(
                `Error destroying adapter for guild ${guildId}:`,
                adapterError
              );
            }
          });
        }
        console.log("✓ All connections cleaned, bot remains logged in");
      } catch (cleanupError) {
        console.error("Error cleaning up connections:", cleanupError);
      }
    }

    res.send("Off");
  } catch (error) {
    console.error("❌ Error turning off bot:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).send(`Failed to turn off bot: ${errorMessage}`);
  }
}

async function ping(req: Request, res: Response): Promise<void> {
  try {
    try {
      await pingCommand.execute();
    } catch (discordError) {
      console.error("Error sending Discord message:", discordError);
      res.status(500).send("Error sending Discord message");
    }
  } catch (error) {
    console.error("Error pinging:", error);
    res.status(500).send("Error pinging");
  }
}

/**
 * Get bot configuration (for frontend)
 * Returns whether bot control button should be shown
 * 
 * @param req - Express request
 * @param res - Express response
 */
function getBotConfig(req: Request, res: Response): void {
  try {
    res.json({
      showBotControl: true, // Always show control button
      autoStart: false,
    });
  } catch (error) {
    console.error("Error getting bot config:", error);
    res.json({
      showBotControl: true, // Default to showing control on error
      autoStart: false,
    });
  }
}

export default {
  isBotOn,
  botOn,
  botOff,
  ping,
  getBotConfig,
};
