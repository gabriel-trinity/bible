import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  Globe,
  Menu,
  User,
  Play,
  Pause,
  Bookmark,
  Sparkles,
  Sun,
  Moon,
  Rows,
  Columns,
  AlignLeft,
} from 'lucide-react';
import {
  BibleBook,
  ReadingMode,
  TranslationId,
  PinyinDisplayMode,
  AppTheme,
} from '../types/bible';
import { TRANSLATIONS } from '../data/bibleBooks';
import { AppTab } from './BottomTabBar';

interface BibleHeaderProps {
  currentBook: BibleBook;
  currentChapter: number;
  activeTab: AppTab;
  readingMode: ReadingMode;
  primaryTrans: TranslationId;
  parallelTrans: TranslationId;
  pinyinMode: PinyinDisplayMode;
  theme: AppTheme;
  isPlayingAudio: boolean;
  bookmarkCount: number;
  onOpenBookPicker: () => void;
  onOpenVersionPicker: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenBookmarks: () => void;
  onOpenCustomPassage: () => void;
  onToggleAudio: () => void;
  onChangeReadingMode: (mode: ReadingMode) => void;
  onCyclePinyinMode: () => void;
  onToggleTheme: () => void;
}

export const BibleHeader: React.FC<BibleHeaderProps> = ({
  currentBook,
  currentChapter,
  activeTab,
  readingMode,
  primaryTrans,
  pinyinMode,
  theme,
  isPlayingAudio,
  bookmarkCount,
  onOpenBookPicker,
  onOpenVersionPicker,
  onOpenSettings,
  onOpenSearch,
  onOpenBookmarks,
  onOpenCustomPassage,
  onToggleAudio,
  onChangeReadingMode,
  onCyclePinyinMode,
  onToggleTheme,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [isMenuOpen]);

  const pinyinLabel =
    pinyinMode === 'below'
      ? 'Below'
      : pinyinMode === 'inline'
      ? 'Inline'
      : pinyinMode === 'above'
      ? 'Above'
      : 'Off';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md transition-colors bg-white/95 dark:bg-slate-950/95 text-slate-900 dark:text-slate-100">
      {/* Row 1: Global App Icons */}
      <div className="border-b border-slate-100 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-13 flex items-center justify-end gap-3">
          {/* Right: Search, Globe (Pinyin Cycle), and Capsule [Menu | Library] */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Search Scripture"
              aria-label="Search Scripture"
            >
              <Search className="w-[19px] h-[19px] stroke-[1.9]" />
            </button>

            <button
              type="button"
              onClick={onCyclePinyinMode}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={`Hanyu Pinyin: ${pinyinLabel} (Click to cycle)`}
              aria-label={`Cycle Pinyin display (${pinyinLabel})`}
            >
              <Globe className="w-[19px] h-[19px] stroke-[1.9]" />
            </button>

            {/* Capsule Menu & Saved Library Control */}
            <div className="relative" ref={menuRef}>
              <div className="flex items-center rounded-full bg-[#F2F1F1] dark:bg-slate-800 p-1 gap-0.5">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Tools & Reading Menu"
                  aria-label="Open menu"
                  aria-expanded={isMenuOpen}
                >
                  <Menu className="w-4 h-4 stroke-[2]" />
                </button>
                <button
                  type="button"
                  onClick={onOpenBookmarks}
                  className="relative w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/70 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                  title="Saved Bookmarks, Snippets & Notes"
                  aria-label="Saved Library"
                >
                  <User className="w-4 h-4 stroke-[1.9]" />
                  {bookmarkCount > 0 && (
                    <span className="sr-only">{bookmarkCount} saved items</span>
                  )}
                </button>
              </div>

              {/* Clean Tools Popover Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1.5 z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenBookmarks();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 font-medium">
                      <Bookmark className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      <span>Bookmarks & Snippets</span>
                    </span>
                    {bookmarkCount > 0 && (
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                        {bookmarkCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCustomPassage();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span>Custom Pinyin Annotator</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-600" />
                      )}
                      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Reading Layout
                  </div>
                  <div className="grid grid-cols-3 gap-1 px-1.5 pb-1">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeReadingMode('interlinear');
                        setIsMenuOpen(false);
                      }}
                      className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                        readingMode === 'interlinear'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Rows className="w-3.5 h-3.5" />
                      <span>Stacked</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeReadingMode('split');
                        setIsMenuOpen(false);
                      }}
                      className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                        readingMode === 'split'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Split</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeReadingMode('single');
                        setIsMenuOpen(false);
                      }}
                      className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                        readingMode === 'single'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Single</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Sub-Header Reader Strip (matching Image 1: [Genesis 1 v] ... [NIV] [▶] [AA]) */}
      {activeTab === 'bible' && (
        <div className="border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 h-12 flex items-center justify-between gap-2">
            {/* Book & Chapter Selector Pill */}
            <button
              type="button"
              onClick={onOpenBookPicker}
              className="h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Select Book and Chapter"
            >
              <span>
                {currentBook.nameEn} {currentChapter}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </button>

            {/* Right: Version Pill, Play Audio Circle, AA Settings Circle */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenVersionPicker}
                className="h-9 px-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Select Bible Version"
              >
                {TRANSLATIONS[primaryTrans]?.shortName || primaryTrans}
              </button>

              <button
                type="button"
                onClick={onToggleAudio}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                  isPlayingAudio
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                }`}
                title={isPlayingAudio ? 'Pause chapter audio' : 'Play chapter audio'}
                aria-label={isPlayingAudio ? 'Pause chapter audio' : 'Play chapter audio'}
              >
                {isPlayingAudio ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold tracking-tight flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Typography & Reader Settings"
                aria-label="Reader Settings"
              >
                AA
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
