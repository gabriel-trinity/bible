import React from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Bookmark,
  Sliders,
  Volume2,
  Columns,
  Rows,
  AlignLeft,
  Moon,
  Sun,
  Sparkles,
  MoreHorizontal,
  Globe,
} from 'lucide-react';
import {
  BibleBook,
  ReadingMode,
  TranslationId,
  PinyinDisplayMode,
  AppTheme,
} from '../types/bible';
import { TRANSLATIONS } from '../data/bibleBooks';

interface BibleHeaderProps {
  currentBook: BibleBook;
  currentChapter: number;
  readingMode: ReadingMode;
  primaryTrans: TranslationId;
  parallelTrans: TranslationId;
  pinyinMode: PinyinDisplayMode;
  theme: AppTheme;
  isPlayingAudio: boolean;
  bookmarkCount: number;
  onOpenBookPicker: () => void;
  onOpenVersionPicker: () => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
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
  readingMode,
  primaryTrans,
  parallelTrans,
  pinyinMode,
  theme,
  isPlayingAudio,
  bookmarkCount,
  onOpenBookPicker,
  onOpenVersionPicker,
  onPrevChapter,
  onNextChapter,
  onOpenSettings,
  onOpenSearch,
  onOpenBookmarks,
  onOpenCustomPassage,
  onToggleAudio,
  onChangeReadingMode,
  onCyclePinyinMode,
  onToggleTheme,
}) => {
  const canGoPrev = currentChapter > 1;
  const canGoNext = currentChapter < currentBook.chaptersCount;

  const pinyinLabel =
    pinyinMode === 'below'
      ? '汉语拼音: 字下'
      : pinyinMode === 'inline'
      ? '汉语拼音: 括号'
      : pinyinMode === 'above'
      ? '汉语拼音: 字上'
      : '汉语拼音: 关闭';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Desktop Left: Prev/Next chapter icons & Book Picker */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 shrink min-w-0">
          {onPrevChapter && (
            <button
              onClick={onPrevChapter}
              disabled={!canGoPrev}
              className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs shrink-0"
              title="Previous Chapter"
              aria-label="Previous Chapter"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          <button
            onClick={onOpenBookPicker}
            className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all cursor-pointer shadow-xs group font-sans min-w-0"
            title="Select Book and Chapter"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300 group-hover:scale-105 transition-transform shrink-0" />
            <div className="flex flex-col text-left min-w-0">
              {/* Line 1: English + Chinese */}
              <div className="flex items-baseline gap-1 sm:gap-2 truncate">
                <span className="font-bold text-xs sm:text-sm md:text-base leading-tight truncate">
                  {currentBook.nameEn} {currentChapter}
                </span>
                <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 font-sans truncate">
                  {currentBook.nameZh}
                </span>
              </div>
              {/* Line 2: Hanyu Pinyin */}
              {currentBook.namePinyin && (
                <div className="flex items-center text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-none mt-0.5 truncate">
                  <span className="truncate">{currentBook.namePinyin}</span>
                </div>
              )}
            </div>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60 group-hover:translate-y-0.5 transition-transform shrink-0" />
          </button>

          {onNextChapter && (
            <button
              onClick={onNextChapter}
              disabled={!canGoNext}
              className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs shrink-0"
              title="Next Chapter"
              aria-label="Next Chapter"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          {/* Active Translation Indicator */}
          <button
            onClick={onOpenVersionPicker}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-sans font-semibold border border-slate-200/60 dark:border-slate-700/60 shrink-0 cursor-pointer transition-colors"
            title="Change Bible Version"
          >
            <span>{TRANSLATIONS[primaryTrans]?.shortName}</span>
            {readingMode === 'split' && (
              <>
                <span className="opacity-40">|</span>
                <span>{TRANSLATIONS[parallelTrans]?.shortName}</span>
              </>
            )}
          </button>
        </div>

        {/* Desktop Center: Reading Mode Icons Segmented Control */}
        <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => onChangeReadingMode('split')}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer font-sans ${
              readingMode === 'split'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'opacity-70 hover:opacity-100 text-slate-700 dark:text-slate-300'
            }`}
            title="Parallel Side-by-Side View"
            aria-label="Parallel View"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Parallel</span>
          </button>

          <button
            onClick={() => onChangeReadingMode('interlinear')}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer font-sans ${
              readingMode === 'interlinear'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'opacity-70 hover:opacity-100 text-slate-700 dark:text-slate-300'
            }`}
            title="Interlinear Stacked View"
            aria-label="Interlinear View"
          >
            <Rows className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Interlinear</span>
          </button>

          <button
            onClick={() => onChangeReadingMode('single')}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer font-sans ${
              readingMode === 'single'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'opacity-70 hover:opacity-100 text-slate-700 dark:text-slate-300'
            }`}
            title="Single Column View"
            aria-label="Single Column View"
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Single</span>
          </button>
        </div>

        {/* Mobile Spacer: pushes icons to the right on mobile */}
        <div className="sm:hidden flex-1" />

        {/* Right Tools: Responsive Icon Buttons (matching Image 1 on mobile) */}
        <div className="flex items-center gap-2 sm:gap-1.5 shrink-0">
          {/* Quick Pinyin Toggle Button (Desktop) */}
          <button
            onClick={onCyclePinyinMode}
            className={`hidden sm:flex px-2 py-1.5 rounded-xl border text-xs font-sans font-semibold items-center gap-1 transition-all shadow-xs cursor-pointer ${
              pinyinMode === 'below'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : pinyinMode === 'inline'
                ? 'border-slate-400 bg-slate-200/80 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                : pinyinMode === 'above'
                ? 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200'
                : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
            }`}
            title={`Toggle Pinyin placement: Current is ${pinyinLabel}`}
            aria-label={`Toggle Pinyin: ${pinyinLabel}`}
          >
            <span className="font-bold text-xs">拼</span>
            <span className="hidden lg:inline">{pinyinLabel}</span>
          </button>

          {/* 1. Audio Listen (matches Image 1: Volume2) */}
          <button
            onClick={onToggleAudio}
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 animate-pulse'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
            title="Read Chapter Aloud"
            aria-label="Read Chapter Aloud"
          >
            <Volume2 className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>

          {/* 2. Search Button (matches Image 1: Search) */}
          <button
            onClick={onOpenSearch}
            className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
            title="Search Scripture"
            aria-label="Search Scripture"
          >
            <Search className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>

          {/* Bookmarks Drawer Button (Desktop) */}
          <button
            onClick={onOpenBookmarks}
            className="hidden sm:flex relative p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
            title="Bookmarks & Saved Verses"
            aria-label="Bookmarks"
          >
            <Bookmark className="w-4 h-4" />
            {bookmarkCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-bold flex items-center justify-center font-sans">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* Custom Passage Tool (Desktop) */}
          <button
            onClick={onOpenCustomPassage}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex cursor-pointer text-slate-700 dark:text-slate-300"
            title="Custom Scripture Pinyin Annotator"
            aria-label="Custom Scripture Annotator"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* 3. More / Reader Settings (matches Image 1: circle with 3 dots) */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
            title="Reader Settings"
            aria-label="Reader Settings"
          >
            <MoreHorizontal className="w-5 h-5 sm:hidden" />
            <Sliders className="w-4 h-4 hidden sm:block" />
          </button>

          {/* 4. Translation Pill (matches Image 1: 🌐 NIV) */}
          <button
            onClick={onOpenVersionPicker}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            title="Select Bible Version"
          >
            <Globe className="w-3.5 h-3.5 opacity-75" />
            <span>{TRANSLATIONS[primaryTrans]?.shortName || primaryTrans}</span>
          </button>

          {/* Theme Switcher (Desktop) */}
          <button
            onClick={onToggleTheme}
            className="hidden sm:flex p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Light / Dark Theme"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
