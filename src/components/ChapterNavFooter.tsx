import React from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { BibleBook, AppTheme } from '../types/bible';

interface ChapterNavFooterProps {
  currentBook: BibleBook;
  currentChapter: number;
  theme: AppTheme;
  isPlayingAudio?: boolean;
  isAudioPlayerOpen?: boolean;
  onToggleAudio?: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenBookPicker: () => void;
}

export const ChapterNavFooter: React.FC<ChapterNavFooterProps> = ({
  currentBook,
  currentChapter,
  isPlayingAudio = false,
  isAudioPlayerOpen = false,
  onToggleAudio,
  onPrevChapter,
  onNextChapter,
  onOpenBookPicker,
}) => {
  const canGoPrev = currentChapter > 1;
  const canGoNext = currentChapter < currentBook.chaptersCount;

  return (
    <>
      {/* 1. Floating Left/Right Mid-Viewport Chapter Chevrons on Tablet/Desktop (matching screenshot) */}
      <button
        type="button"
        onClick={onPrevChapter}
        disabled={!canGoPrev}
        className="hidden md:flex fixed left-4 lg:left-8 xl:left-[max(2.5rem,calc(50%-27rem))] top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-xl items-center justify-center bg-slate-100/95 hover:bg-slate-200 dark:bg-slate-800/95 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
        title="Previous Chapter"
        aria-label="Previous Chapter"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={onNextChapter}
        disabled={!canGoNext}
        className="hidden md:flex fixed right-4 lg:right-8 xl:right-[max(2.5rem,calc(50%-27rem))] top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-xl items-center justify-center bg-slate-100/95 hover:bg-slate-200 dark:bg-slate-800/95 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
        title="Next Chapter"
        aria-label="Next Chapter"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* 2. Mobile View: Floating above BottomTabBar (hidden while docked AudioPlayerBar is open) */}
      {!isAudioPlayerOpen && (
        <div className="fixed bottom-[4.25rem] inset-x-0 z-30 sm:hidden px-4 font-sans pointer-events-none">
          <div className="flex items-center gap-2 max-w-sm mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={onToggleAudio}
              className="w-12 h-12 rounded-full bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white flex items-center justify-center shadow-2xl border border-slate-700/50 active:scale-95 transition-transform cursor-pointer shrink-0"
              title={isPlayingAudio ? 'Pause' : 'Play audio'}
              aria-label={isPlayingAudio ? 'Pause' : 'Play audio'}
            >
              {isPlayingAudio ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <div className="flex-1 h-12 rounded-full bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white flex items-center justify-between px-2 shadow-2xl border border-slate-700/50">
              <button
                type="button"
                onClick={onPrevChapter}
                disabled={!canGoPrev}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
                title="Previous Chapter"
                aria-label="Previous Chapter"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onOpenBookPicker}
                className="flex-1 px-2 text-center text-sm font-bold text-white hover:text-slate-200 transition-colors cursor-pointer truncate"
                title="Select Book and Chapter"
              >
                {currentBook.nameEn} {currentChapter}
              </button>

              <button
                type="button"
                onClick={onNextChapter}
                disabled={!canGoNext}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
                title="Next Chapter"
                aria-label="Next Chapter"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tablet/Desktop inline bottom footer */}
      <div className="hidden sm:flex w-full max-w-2xl mx-auto px-4 py-8 mb-16 items-center justify-between border-t border-slate-100 dark:border-slate-800/80 font-sans">
        <button
          type="button"
          onClick={onPrevChapter}
          disabled={!canGoPrev}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Previous Chapter"
          aria-label="Previous Chapter"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenBookPicker}
          className="px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
          title="Select Book and Chapter"
        >
          <span className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:opacity-75 transition-opacity">
            {currentBook.nameEn} {currentChapter}
          </span>
        </button>

        <button
          type="button"
          onClick={onNextChapter}
          disabled={!canGoNext}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Next Chapter"
          aria-label="Next Chapter"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </>
  );
};
