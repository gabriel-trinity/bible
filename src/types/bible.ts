export type Testament = 'OT' | 'NT';

export type BookCategory =
  | 'pentateuch'
  | 'history'
  | 'poetry'
  | 'major_prophets'
  | 'minor_prophets'
  | 'gospels'
  | 'acts'
  | 'paul_epistles'
  | 'general_epistles'
  | 'revelation';

export interface BibleBook {
  id: string; // e.g. "GEN"
  nameEn: string; // "Genesis"
  nameZh: string; // "创世记"
  nameZhTrad: string; // "創世記"
  namePinyin?: string; // "chuàng shì jì"
  abbrEn: string; // "Gen"
  abbrZh: string; // "创"
  testament: Testament;
  category: BookCategory;
  categoryNameZh: string;
  categoryNameEn: string;
  categoryPinyin?: string; // e.g. "lǜ fǎ shū"
  chaptersCount: number;
}

export interface PericopeItem {
  start: number;
  end?: number;
  titleEn?: string;
  titleZh?: string;
  titlePinyin?: string;
}

export type TranslationId =
  | 'CNVS'  // Chinese New Version Simplified (新译本 简体)
  | 'ESV'   // English Standard Version
  | 'NASB'  // New American Standard Bible
  | 'NIV'   // New International Version
  | 'NKJV'  // New King James Version
  | 'NLT';  // New Living Translation

export interface TranslationMeta {
  id: TranslationId;
  name: string;
  shortName: string;
  lang: 'en' | 'zh';
  description: string;
  hasPinyin: boolean;
}

export interface VerseItem {
  number: number;
  textZh: string; // Default Chinese (CNVS)
  textZhCnvs?: string;
  textZhCuv?: string;
  textEnNiv?: string;
  textEnNlt?: string;
  textEnNasb?: string;
  textEnEsv?: string;
  textEnNkjv?: string;
  textEn?: string; // Generic fallback English
  hasRedLetter?: boolean;
  notes?: string;
}

export interface ChapterContent {
  bookId: string;
  chapter: number;
  titleZh?: string;
  titleEn?: string;
  pericopes?: PericopeItem[];
  verses: VerseItem[];
}

export type ReadingMode = 'split' | 'interlinear' | 'single';

export type PinyinDisplayMode = 'below' | 'inline' | 'above' | 'off';

export type PinyinSize = 'sm' | 'base' | 'lg';

export type AppTheme = 'light' | 'dark';

export type HighlightColor = 'gold' | 'emerald' | 'sky' | 'rose';

export interface UserHighlight {
  verseKey: string; // e.g. "GEN.1.1"
  color: HighlightColor;
  updatedAt: number;
}

export interface UserBookmark {
  id: string;
  verseKey: string; // e.g. "GEN.1.1"
  bookId: string;
  chapter: number;
  verseNumber: number;
  textZh: string;
  textEn: string;
  translation1: TranslationId;
  translation2: TranslationId;
  categoryTag?: string; // e.g. "Faith", "Peace", "Comfort", "Study"
  note?: string;
  createdAt: number;
}

export interface UserNote {
  verseKey: string;
  content: string;
  updatedAt: number;
}

export interface PinyinCharToken {
  char: string;
  pinyin: string;
  tone: number; // 0..4
  isZh: boolean;
  isRed?: boolean;
}
