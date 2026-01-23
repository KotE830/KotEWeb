import type { Language } from '../hooks/useTranslation';

/**
 * Tag page translations
 */
export const tag: Record<Language, Record<string, string>> = {
  ko: {
    'tag.title': '태그',
    'tag.button.add': '태그 추가',
    'tag.search.placeholder': '태그 이름으로 검색...',
    'tag.empty.noTags': '등록된 태그가 없습니다.',
    'tag.empty.noMatching': '일치하는 태그가 없습니다.',
    'tag.loading': '로딩 중...',
    'tag.loading.short': '로딩 중..',
    'tag.sort.default': '등록일 (오래된 순)',
    'tag.sort.newest': '등록일 (최신 순)',
    'tag.sort.nameAsc': '이름 (A-Z)',
    'tag.sort.nameDesc': '이름 (Z-A)',
  },
  en: {
    'tag.title': 'Tags',
    'tag.button.add': 'Add Tag',
    'tag.search.placeholder': 'Search by tag name...',
    'tag.empty.noTags': 'No tags registered.',
    'tag.empty.noMatching': 'No matching tags.',
    'tag.loading': 'Loading...',
    'tag.loading.short': 'Loading..',
    'tag.sort.default': 'Date Added (Oldest)',
    'tag.sort.newest': 'Date Added (Newest)',
    'tag.sort.nameAsc': 'Name (A-Z)',
    'tag.sort.nameDesc': 'Name (Z-A)',
  },
  ja: {
    'tag.title': 'タグ',
    'tag.button.add': 'タグを追加',
    'tag.search.placeholder': 'タグ名で検索...',
    'tag.empty.noTags': '登録されたタグがありません。',
    'tag.empty.noMatching': '一致するタグがありません。',
    'tag.loading': '読み込み中...',
    'tag.loading.short': '読み込み中..',
    'tag.sort.default': '登録日 (古い順)',
    'tag.sort.newest': '登録日 (最新順)',
    'tag.sort.nameAsc': '名前 (A-Z)',
    'tag.sort.nameDesc': '名前 (Z-A)',
  },
};

