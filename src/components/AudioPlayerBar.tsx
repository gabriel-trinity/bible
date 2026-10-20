import React from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { AppTheme } from '../types/bible';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  currentVerseNum: number;
  totalVerses: number;
  speechRate: number;
  autoAdvance: boolean;
  audioLanguage?: 'zh' | 'en' | 'bilingual';
  theme: AppTheme;
  bookNameZh: string;
  bookNameEn: string;
  chapter: number;
  onPlayPause: () => void;
  onStop: () => void;
  onPrevVerse: () => void;
  onNextVerse: () => void;
  onChangeRate: (rate: number) => void;
  onChangeLanguage?: (lang: 'zh' | 'en' | 'bilingual') => void;
  onToggleAutoAdvance: () => void;
  onClose: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isPlaying,
  currentVerseNum,
  totalVerses,
  speechRate,
  autoAdvance,
  audioLanguage = 'zh',
  theme,
  bookNameZh,
  bookNameEn,
  chapter,
  onPlayPause,
  onStop,
  onPrevVerse,
  onNextVerse,
  onChangeRate,
  onChangeLanguage,
  onToggleAutoAdvance,
  onClose,
}) => {
  return (
    <div
      className={`fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl p-3 rounded-2xl shadow-2xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-4 font-sans ${
        theme === 'dark'
          ? 'bg-slate-900/95 border-slate-700 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
        {/* Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold font-sans truncate">
              {bookNameZh} {bookNameEn} · Ch {chapter} · V{currentVerseNum}/{totalVerses}
            </div>
            <div className="text-[10px] opacity-70 font-sans flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {audioLanguage === 'zh'
                  ? '🇨🇳 中文朗读'
                  : audioLanguage === 'en'
                  ? '🇺🇸 English'
                  : '🌐 双语朗读'}
              </span>
              {autoAdvance && <span>· Auto-advance</span>}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto sm:ml-0">
          {/* Audio Language Switcher */}
          <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden text-[11px] font-sans">
            <button
              onClick={() => onChangeLanguage?.('zh')}
              className={`px-1.5 py-0.5 transition-colors cursor-pointer ${
                audioLanguage === 'zh'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
              }`}
              title="Chinese audio (中文朗读)"
            >
              中文
            </button>
            <button
              onClick={() => onChangeLanguage?.('en')}
              className={`px-1.5 py-0.5 transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-700 ${
                audioLanguage === 'en'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
              }`}
              title="English audio (NIV)"
            >
              EN
            </button>
            <button
              onClick={() => onChangeLanguage?.('bilingual')}
              className={`px-1.5 py-0.5 transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-700 ${
                audioLanguage === 'bilingual'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
              }`}
              title="Bilingual audio (双语朗读)"
            >
              双语
            </button>
          </div>

          <button
            onClick={onPrevVerse}
            disabled={currentVerseNum <= 1}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            title="Previous verse"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onPlayPause}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={onNextVerse}
            disabled={currentVerseNum >= totalVerses}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            title="Next verse"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onStop}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70 hover:opacity-100 transition-colors cursor-pointer"
            title="Stop audio"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          {/* Rate Selector */}
          <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden text-[11px] font-sans">
            {[0.8, 1.0, 1.2].map((r) => (
              <button
                key={r}
                onClick={() => onChangeRate(r)}
                className={`px-1 py-0.5 transition-colors cursor-pointer ${
                  speechRate === r
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
                }`}
              >
                {r}x
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 ml-0.5 transition-colors cursor-pointer"
            title="Close audio bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
