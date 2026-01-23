import type { Language } from '../hooks/useTranslation';

/**
 * Common translations used across the application
 * Add more common translations here as needed
 */
export const common: Record<Language, Record<string, string>> = {
  ko: {
    'footer.description': 'KotE는 Discord 음악 봇을 위한 웹 관리 인터페이스입니다.',
    'footer.rights': 'All rights reserved.',
  },
  en: {
    'footer.description': 'KotE is a web management interface for Discord music bot.',
    'footer.rights': 'All rights reserved.',
  },
  ja: {
    'footer.description': 'KotEはDiscord音楽ボット用のWeb管理インターフェースです。',
    'footer.rights': 'All rights reserved.',
  },
};

