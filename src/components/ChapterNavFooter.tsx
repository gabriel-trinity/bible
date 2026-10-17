import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BibleBook, AppTheme } from '../types/bible';

interface ChapterNavFooterProps {
  currentBook: BibleBook;
  currentChapter: number;
  theme: AppTheme;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenBookPicker: () => void;
}

export const ChapterNavFooter: React.FC<ChapterNavFooterProps> = ({
  currentBook,
  currentChapter,
  onPrevChapter,
  onNextChapter,
  onOpenBookPicker,
}) => {
  const canGoPrev = currentChapter > 1;
  const canGoNext = currentChapter < currentBook.chaptersCount;

  return (
    <>
      {/* 1. Mobile View: FIXED at the bottom when scrolling */}
      <div className="fixed bottom-0 inset-x-0 z-30 sm:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between shadow-lg font-sans">
        {/* Left Arrow */}
        <button
          onClick={onPrevChapter}
          disabled={!canGoPrev}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs shrink-0"
          title="Previous Chapter"
          aria-label="Previous Chapter"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center: Book and Chapter only (e.g. Genesis 1) */}
        <button
          onClick={onOpenBookPicker}
          className="px-4 py-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer text-center truncate max-w-[200px]"
          title="Select Book and Chapter"
        >
          <span className="font-bold text-base text-slate-900 dark:text-slate-100 truncate block">
            {currentBook.nameEn} {currentChapter}
          </span>
        </button>

        {/* Right Arrow */}
        <button
          onClick={onNextChapter}
          disabled={!canGoNext}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs shrink-0"
          title="Next Chapter"
          aria-label="Next Chapter"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Desktop & Tablet View: Clean inline footer navigation */}
      <div className="hidden sm:flex w-full max-w-2xl mx-auto px-4 py-8 mb-16 items-center justify-between border-t border-slate-200 dark:border-slate-800 font-sans">
        <button
          onClick={onPrevChapter}
          disabled={!canGoPrev}
          className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs"
          title="Previous Chapter"
          aria-label="Previous Chapter"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenBookPicker}
          className="px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
          title="Select Book and Chapter"
        >
          <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 group-hover:opacity-75 transition-opacity">
            {currentBook.nameEn} {currentChapter}
          </span>
        </button>

        <button
          onClick={onNextChapter}
          disabled={!canGoNext}
          className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs"
          title="Next Chapter"
          aria-label="Next Chapter"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </>
  );
};
