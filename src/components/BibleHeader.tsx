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
  primaryTrans: TranslationId;
  parallelTrans: TranslationId;
  readingMode: ReadingMode;
  pinyinMode: PinyinDisplayMode;
  theme: AppTheme;
  bookmarkCount: number;
  isPlayingAudio: boolean;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  onOpenBookPicker: () => void;
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
  primaryTrans,
  parallelTrans,
  readingMode,
  pinyinMode,
  theme,
  bookmarkCount,
  isPlayingAudio,
  canGoPrev = false,
  canGoNext = false,
  onPrevChapter,
  onNextChapter,
  onOpenBookPicker,
  onOpenSettings,
  onOpenSearch,
  onOpenBookmarks,
  onOpenCustomPassage,
  onToggleAudio,
  onChangeReadingMode,
  onCyclePinyinMode,
  onToggleTheme,
}) => {
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
        {/* Left: Prev/Next chapter icons & Book Picker */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink min-w-0">
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
              {/* Line 1: English + Chinese (创世记 第 1 章) */}
              <div className="flex items-baseline gap-1 sm:gap-2 truncate">
                <span className="font-bold text-xs sm:text-sm md:text-base leading-tight truncate">
                  {currentBook.nameEn} {currentChapter}
                </span>
                <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 font-sans truncate">
                  {currentBook.nameZh} 第 {currentChapter} 章
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
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-sans font-semibold border border-slate-200/60 dark:border-slate-700/60 shrink-0">
            <span>{TRANSLATIONS[primaryTrans]?.shortName}</span>
            {readingMode === 'split' && (
              <>
                <span className="opacity-40">|</span>
                <span>{TRANSLATIONS[parallelTrans]?.shortName}</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Reading Mode Icons Segmented Control */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
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

        {/* Right Tools: Responsive Icon Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick Pinyin Toggle Button */}
          <button
            onClick={onCyclePinyinMode}
            className={`px-2 py-1.5 rounded-xl border text-xs font-sans font-semibold flex items-center gap-1 transition-all shadow-xs cursor-pointer ${
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

          {/* Audio Listen */}
          <button
            onClick={onToggleAudio}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
              isPlayingAudio
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 animate-pulse'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Read Chapter Aloud"
            aria-label="Read Chapter Aloud"
          >
            <Volume2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>

          {/* Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Search Scripture"
            aria-label="Search Scripture"
          >
            <Search className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>

          {/* Bookmarks Drawer Button */}
          <button
            onClick={onOpenBookmarks}
            className="relative p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Bookmarks & Saved Verses"
            aria-label="Bookmarks"
          >
            <Bookmark className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            {bookmarkCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-bold flex items-center justify-center font-sans">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* Custom Passage Tool */}
          <button
            onClick={onOpenCustomPassage}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex cursor-pointer"
            title="Custom Scripture Pinyin Annotator"
            aria-label="Custom Scripture Annotator"
          >
            <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>

          {/* Reader Settings Modal */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reader Settings"
            aria-label="Reader Settings"
          >
            <Sliders className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
