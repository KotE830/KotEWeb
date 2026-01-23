import type { Language } from '../hooks/useTranslation';

/**
 * Home page translations
 */
export const home: Record<Language, Record<string, string>> = {
  ko: {
    'home.title': 'KotE - Discord Music Bot',
    'home.description1': 'KotE는 Discord 서버에서 음악을 재생하고 관리할 수 있는 음악 봇입니다.',
    'home.description2': 'Discord 계정으로 로그인하여 서버를 관리하고, 음성 채널에 봇을 초대하여 사용할 수 있습니다.',
    'home.description3': '로그인 후에는 노래와 태그를 관리하고, 현재 재생 중인 음악과 큐를 확인할 수 있습니다.',
  },
  en: {
    'home.title': 'KotE - Discord Music Bot',
    'home.description1': 'KotE is a music bot that can play and manage music on Discord servers.',
    'home.description2': 'Log in with your Discord account to manage servers and invite the bot to voice channels.',
    'home.description3': 'After logging in, you can manage songs and tags, and check the currently playing music and queue.',
  },
  ja: {
    'home.title': 'KotE - Discord Music Bot',
    'home.description1': 'KotEは、Discordサーバーで音楽を再生・管理できる音楽ボットです。',
    'home.description2': 'Discordアカウントでログインしてサーバーを管理し、ボイスチャンネルにボットを招待して使用できます。',
    'home.description3': 'ログイン後は、曲やタグを管理し、現在再生中の音楽とキューを確認できます。',
  },
};

