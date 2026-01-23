import path from "path";
import fs from "node:fs";
import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

import { Shoukaku, Connectors } from "shoukaku";
import { LavalinkConfig } from "./config";

dotenv.config();

process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection:', reason);
  // Never add process.exit() here.
});

process.on('uncaughtException', (error) => {
  console.log('❌ Uncaught Exception:', error);
  // Never add process.exit() here.
});

/**
 * Save queues to database when bot exits
 */
async function saveQueuesOnExit() {
  try {
    const { saveAllQueuesToDatabase } = await import("./utils");
    await saveAllQueuesToDatabase();
    console.log("✓ All queues saved to database before exit");
  } catch (error) {
    console.error("Failed to save queues on exit:", error);
  }
}

process.on('SIGINT', async () => {
  console.log("\n⚠️  Received SIGINT, saving queues...");
  await saveQueuesOnExit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log("\n⚠️  Received SIGTERM, saving queues...");
  await saveQueuesOnExit();
  process.exit(0);
});

/**
 * Extend Client type for Lavalink
 */
declare module "discord.js" {
  interface Client {
    shoukaku: Shoukaku | null;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Initialize Lavalink
try {
  // Create Shoukaku instance
  const shoukaku = new Shoukaku(
    new Connectors.DiscordJS(client),
    [],
    LavalinkConfig.SHOUKAKU_OPTIONS
  );

  client.once("ready", () => {
    console.log("ℹ️ Client is ready, adding Lavalink nodes...");
    shoukaku.id = client.user?.id ?? null;
    LavalinkConfig.NODES.forEach((node) => {
      console.log(`[Lavalink] Adding node: name=${node.name}, url=${node.url}`);
      shoukaku.addNode(node);
    });
    
    // Setup queue listener
    import("./utils").then(({ setupQueueListener }) => {
      setupQueueListener(shoukaku);
    });
  });

  // Event Handlers
  shoukaku.on("ready", (name: string) => {
    console.log(`✅ Lavalink node ${name} is ready and connected`);
  });

  shoukaku.on("error", (name: string, error: Error) => {
    console.error(`❌ Lavalink node ${name} error:`, error);
    console.error(
      `💡 Make sure Lavalink server is running: java -jar discord/lavalink/Lavalink.jar`
    );
  });

  shoukaku.on("close", (name: string, code: number, reason: string) => {
    console.log(`⚠️  Lavalink node ${name} closed: ${code} ${reason}`);
  });

  shoukaku.on("disconnect", (name: string, count: number) => {
    console.log(`⚠️  Lavalink node ${name} disconnected (count: ${count})`);
    console.log(`💡 Reconnect will be attempted automatically`);
  });

  shoukaku.on("debug", (name: string, info: string) => {
    console.debug(`🔍 Lavalink node ${name} debug:`, info);
  });

  // Shoukaku connects automatically, so start() method may not exist
  client.shoukaku = shoukaku;
  console.log("✓ Lavalink initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Lavalink:", error);
}

// Load event handlers (using CJS require to avoid top-level await)
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".ts"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  // Synchronous load so ts-node can handle .ts files with require
  const event = require(filePath);
  const eventModule = event.default || event;

  if (eventModule.once) {
    client.once(eventModule.name, (...args: unknown[]) =>
      eventModule.execute(...args)
    );
  } else {
    client.on(eventModule.name, (...args: unknown[]) =>
      eventModule.execute(...args)
    );
  }
}

// Bot will be started manually via /api/boton endpoint
if (process.env.TOKEN) {
  console.log(
    "ℹ️  Discord bot is ready. Use /api/boton to start the bot manually."
  );
} else {
  console.log(
    "⚠️  Discord TOKEN not found. Server will run without Discord bot."
  );
}

// Export client and initializeLavalink for use in controllers
export default client;
