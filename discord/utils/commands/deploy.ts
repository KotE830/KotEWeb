import 'dotenv/config';
import { REST, Routes, Client } from 'discord.js';
import { getCommandData } from './command';

/**
 * Deploy slash commands to Discord
 * Registers commands for all guilds the bot is in
 * 
 * @param client - Discord client instance
 */
export async function deployCommands(client: Client): Promise<void> {
  const token = process.env.DISCORD_TOKEN;
  const clientId = client.user?.id;

  if (!token) {
    console.error('❌ DISCORD_TOKEN not set');
    return;
  }

  if (!clientId) {
    console.error('❌ Client ID not available (user not logged in)');
    return;
  }

  // getCommands 유틸리티를 통해 command data 가져오기
  const commands = getCommandData();

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`🔄 Registering ${commands.length} application (/) commands...`);

    // 서버별 명령어 등록 (즉시 반영)
    const guilds = client.guilds.cache;
    for (const [guildId, guild] of guilds) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(clientId, guildId),
          { body: commands }
        );
        console.log(`✓ Successfully registered commands for guild: ${guild.name}`);
      } catch (error) {
        console.error(`Error registering commands for guild ${guild.name}:`, error);
      }
    }

    console.log(`✅ Successfully reloaded ${commands.length} application (/) commands.`);
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

// CLI에서 직접 실행할 수 있도록 지원 (client 필요하므로 별도 처리 필요)
if (require.main === module) {
  console.error('❌ deploy.ts는 client 인자가 필요합니다. ready.ts를 통해 자동 실행되거나, client를 직접 전달해야 합니다.');
  process.exit(1);
}

