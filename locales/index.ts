import type { Language } from '../hooks/useTranslation';
import { home } from './home';
import { common } from './common';
import { discord } from './discord';
import { main } from './main';
import { song } from './song';
import { tag } from './tag';

/**
 * Translation structure organized by namespace
 * Each namespace contains translations for all supported languages
 */
export const translations: Record<Language, Record<string, string>> = {
  ko: {
    ...home.ko,
    ...common.ko,
    ...discord.ko,
    ...main.ko,
    ...song.ko,
    ...tag.ko,
  },
  en: {
    ...home.en,
    ...common.en,
    ...discord.en,
    ...main.en,
    ...song.en,
    ...tag.en,
  },
  ja: {
    ...home.ja,
    ...common.ja,
    ...discord.ja,
    ...main.ja,
    ...song.ja,
    ...tag.ja,
  },
};

