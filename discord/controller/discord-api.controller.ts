import { Request, Response } from "express";
import client from "../client";
import { ChannelType } from "discord.js";

/**
 * Fetch with retry for rate limit handling
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retries - Number of retries (default: 3)
 * @returns Response from fetch
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<globalThis.Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = parseFloat(response.headers.get('Retry-After') || '1');
      console.log(`Rate limited. Waiting ${retryAfter} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }
    
    return response;
  }
  throw new Error('Max retries exceeded');
}

/**
 * Get list of servers user belongs to
 * 
 * @param req - Express request
 * @param res - Express response
 */
export async function getUserGuilds(req: Request, res: Response): Promise<void> {
  try {
    const accessToken = (req.session as any)?.discordAccessToken;
    
    if (!accessToken) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    
    const response = await fetchWithRetry('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch user guilds:", errorText);
      res.status(response.status).json({ error: "Failed to fetch guilds" });
      return;
    }
    
    const guilds = await response.json();
    
    // BigInt를 문자열로 변환하는 헬퍼 함수
    const convertBigIntToString = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj;
      }
      if (typeof obj === 'bigint') {
        return obj.toString();
      }
      if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
      }
      if (typeof obj === 'object') {
        const converted: any = {};
        for (const key in obj) {
          converted[key] = convertBigIntToString(obj[key]);
        }
        return converted;
      }
      return obj;
    };
    
    // 봇이 있는 서버만 필터링하고 추가 정보 추가
    const guildsWithBotStatus = guilds.map((guild: any) => {
      const botGuild = client.guilds.cache.get(guild.id);
      // client.guilds.cache에 있으면 봇이 그 서버에 있는 것
      const hasBot = !!botGuild;
      const botMember = botGuild?.members.me;
      const botPermissions = botMember?.permissions.bitfield;
      
      const result: any = {
        ...guild,
        hasBot: hasBot,
      };
      
      // botPermissions가 BigInt인 경우 문자열로 변환
      if (botPermissions !== undefined && botPermissions !== null) {
        result.botPermissions = typeof botPermissions === 'bigint' 
          ? botPermissions.toString() 
          : String(botPermissions);
      }
      
      // 모든 BigInt 값을 문자열로 변환
      return convertBigIntToString(result);
    });
    
    res.json(guildsWithBotStatus);
  } catch (error) {
    console.error("Error fetching user guilds:", error);
    res.status(500).json({ error: "Failed to fetch guilds" });
  }
}

// 특정 서버에 봇이 있는지 확인
export function getBotStatus(req: Request, res: Response): void {
  try {
    const { guildId } = req.params;
    
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
      res.json({ 
        hasBot: false, 
        reason: 'Bot not in guild' 
      });
      return;
    }
    
    const botMember = guild.members.me;
    const hasVoicePermission = botMember?.permissions.has('Connect') && 
                               botMember?.permissions.has('Speak');
    
    res.json({ 
      hasBot: true, 
      hasVoicePermission,
      botPermissions: botMember?.permissions.bitfield,
      guildName: guild.name,
    });
  } catch (error) {
    console.error("Error checking bot status:", error);
    res.status(500).json({ error: "Failed to check bot status" });
  }
}

// 서버의 음성 채널 목록 가져오기
export function getVoiceChannels(req: Request, res: Response): void {
  try {
    const { guildId } = req.params;
    
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
      res.status(404).json({ 
        error: 'Bot is not in this guild',
        hasBot: false 
      });
      return;
    }
    
    const voiceChannels = guild.channels.cache
      .filter(channel => channel.type === ChannelType.GuildVoice)
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        userLimit: (channel as any).userLimit,
        bitrate: (channel as any).bitrate,
      }));
    
    res.json(voiceChannels);
  } catch (error) {
    console.error("Error fetching voice channels:", error);
    res.status(500).json({ error: "Failed to fetch voice channels" });
  }
}

// 봇 초대 링크 생성
export function generateInviteLink(req: Request, res: Response): void {
  try {
    const { guildId } = req.params;
    const clientId = process.env.DISCORD_CLIENT_ID;
    
    if (!clientId) {
      res.status(500).json({ error: "DISCORD_CLIENT_ID not configured" });
      return;
    }
    
    // 필요한 권한 (비트 플래그)
    // Connect (1024) + Speak (2097152) + Use Voice Activity (33554432) + Manage Messages (8192)
    const permissions = '35659776'; // 1024 + 2097152 + 33554432 + 8192
    
    const scopes = 'bot%20applications.commands';
    
    const inviteUrl = `https://discord.com/api/oauth2/authorize?` +
      `client_id=${clientId}` +
      `&permissions=${permissions}` +
      `&scope=${scopes}` +
      `&guild_id=${guildId}`;
    
    res.json({ inviteUrl });
  } catch (error) {
    console.error("Error generating invite link:", error);
    res.status(500).json({ error: "Failed to generate invite link" });
  }
}

