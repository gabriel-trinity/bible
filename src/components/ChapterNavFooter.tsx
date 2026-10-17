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
  theme,
  onPrevChapter,
  onNextChapter,
  onOpenBookPicker,
}) => {
  const canGoPrev = currentChapter > 1;
  const canGoNext = currentChapter < currentBook.chaptersCount;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 mb-16 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 font-sans">
      <button
        onClick={onPrevChapter}
        disabled={!canGoPrev}
        className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-sans font-medium transition-all disabled:opacity-30 disabled:pointer-events-none shadow-xs cursor-pointer text-slate-800 dark:text-slate-200"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous Chapter</span>
      </button>

      <button
        onClick={onOpenBookPicker}
        className="px-3 py-1.5 rounded-lg text-xs font-sans opacity-85 hover:opacity-100 font-medium cursor-pointer flex flex-col items-center"
      >
        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{currentBook.nameEn}</span>
        <span className="text-xs text-slate-700 dark:text-slate-300">{currentBook.nameZh}</span>
        {currentBook.namePinyin && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{currentBook.namePinyin}</span>
        )}
      </button>

      <button
        onClick={onNextChapter}
        disabled={!canGoNext}
        className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-sans font-medium transition-all disabled:opacity-30 disabled:pointer-events-none shadow-xs cursor-pointer text-slate-800 dark:text-slate-200"
      >
        <span>Next Chapter</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
