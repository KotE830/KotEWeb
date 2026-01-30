import { Request, Response } from "express";
import crypto from "crypto";

/** OAuth2 콜백 URL. Next.js rewrites로 /api가 백엔드로 가므로, 사용자 브라우저가 도착하는 주소(프론트 도메인) + /api/auth/callback 이어야 함. */
function getRedirectUri(): string {
  if (process.env.DISCORD_REDIRECT_URI) {
    return process.env.DISCORD_REDIRECT_URI;
  }

  const base = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (base) {
    return base.replace(/\/$/, '') + '/api/auth/callback';
  }

  return process.env.NODE_ENV === 'production'
    ? 'https://koteweb.vercel.app/api/auth/callback'
    : 'http://localhost:3000/api/auth/callback';
}

/**
 * Start Discord OAuth2 login
 *
 * @param req - Express request
 * @param res - Express response
 */
export function login(req: Request, res: Response): void {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({ error: "DISCORD_CLIENT_ID not configured in environment variables" });
      return;
    }

    const redirectUri = getRedirectUri();
    
    const scopes = 'identify guilds';
    
    // CSRF 방지를 위한 state 생성
    const state = crypto.randomBytes(16).toString('hex');
    (req.session as any).oauthState = state;
    
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${state}`;
    
    res.json({ authUrl: discordAuthUrl });
  } catch (error) {
    console.error("Error generating OAuth2 URL:", error);
    res.status(500).json({ error: "Failed to generate OAuth2 URL" });
  }
}

/**
 * Handle Discord OAuth2 callback
 * 
 * @param req - Express request
 * @param res - Express response
 */
export async function callback(req: Request, res: Response): Promise<void> {
  try {
    const { code, state } = req.query;
    
    // CSRF 검증
    if (state !== (req.session as any).oauthState) {
      res.status(403).json({ error: "Invalid state parameter" });
      return;
    }
    
    // state 검증 후 삭제
    delete (req.session as any).oauthState;
    
    if (!code) {
      res.status(400).json({ error: "Authorization code not provided" });
      return;
    }
    
    // CLIENT_ID와 CLIENT_SECRET은 env에서 가져오기
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = getRedirectUri();
    
    if (!clientId || !clientSecret) {
      res.status(500).json({ error: "DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET not configured in environment variables" });
      return;
    }
    
    // code를 access_token으로 교환
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Discord token exchange failed:", errorText);
      res.status(500).json({ error: "Failed to exchange authorization code" });
      return;
    }
    
    const tokenData = await tokenResponse.json();
    // { access_token, token_type, expires_in, refresh_token, scope }
    
    // 사용자 정보 가져오기
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    let userInfo: { id?: string; username?: string; discriminator?: string } | null = null;
    if (userResponse.ok) {
      userInfo = await userResponse.json() as { id: string; username: string; discriminator: string };
    }
    
    // 세션에 저장
    (req.session as any).discordAccessToken = tokenData.access_token;
    (req.session as any).discordRefreshToken = tokenData.refresh_token;
    (req.session as any).discordUserId = userInfo?.id;
    (req.session as any).discordUsername = userInfo?.username;
    (req.session as any).discordDiscriminator = userInfo?.discriminator;
    
    // 프론트엔드로 리다이렉트
    // Next.js rewrites를 통해 /api가 백엔드로 프록시되므로, 프론트엔드 URL(포트 3000) 사용
    // 로그인 성공 시 main 페이지로 리다이렉트
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://koteweb.vercel.app'
        : 'http://localhost:3000');
    res.redirect(`${frontendUrl}/main`);
  } catch (error) {
    console.error("Error in OAuth2 callback:", error);
    res.status(500).json({ error: "OAuth2 callback failed" });
  }
}

/**
 * Logout user (destroy web session only)
 * Note: This does NOT affect the Discord bot status.
 * The bot will continue running and playing music even after user logout.
 * 
 * @param req - Express request
 * @param res - Express response
 */
export function logout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ success: true });
  });
}

// 인증 상태 확인
export function checkAuth(req: Request, res: Response): void {
  const accessToken = (req.session as any)?.discordAccessToken;
  const userId = (req.session as any)?.discordUserId;
  const username = (req.session as any)?.discordUsername;
  const discriminator = (req.session as any)?.discordDiscriminator;
  
  res.json({ 
    authenticated: !!accessToken,
    user: accessToken ? {
      id: userId,
      username: username,
      discriminator: discriminator,
      displayName: discriminator === '0' ? username : `${username}#${discriminator}`,
    } : null,
  });
}
