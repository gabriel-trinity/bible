import React from 'react';
import { X } from 'lucide-react';
import {
  PinyinDisplayMode,
  PinyinSize,
  AppTheme,
  ReadingMode,
  ReaderFont,
} from '../types/bible';

interface ReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinyinMode: PinyinDisplayMode;
  setPinyinMode: (mode: PinyinDisplayMode) => void;
  pinyinSize: PinyinSize;
  setPinyinSize: (size: PinyinSize) => void;
  colorTones: boolean;
  setColorTones: (enabled: boolean) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  readerFont: ReaderFont;
  setReaderFont: (font: ReaderFont) => void;
  showFootnotes: boolean;
  setShowFootnotes: (enabled: boolean) => void;
  showNumbersAndTitles: boolean;
  setShowNumbersAndTitles: (enabled: boolean) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  readingMode: ReadingMode;
  setReadingMode: (mode: ReadingMode) => void;
  redLetter: boolean;
  setRedLetter: (enabled: boolean) => void;
  audioLanguage?: 'zh' | 'en' | 'bilingual';
  setAudioLanguage?: (lang: 'zh' | 'en' | 'bilingual') => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  isOpen,
  onClose,
  pinyinMode,
  setPinyinMode,
  pinyinSize,
  setPinyinSize,
  colorTones,
  setColorTones,
  fontSize,
  setFontSize,
  readerFont,
  setReaderFont,
  showFootnotes,
  setShowFootnotes,
  showNumbersAndTitles,
  setShowNumbersAndTitles,
  theme,
  setTheme,
  readingMode,
  setReadingMode,
  redLetter,
  setRedLetter,
  audioLanguage = 'zh',
  setAudioLanguage,
}) => {
  if (!isOpen) return null;

  const activeSizeTier: 'sm' | 'md' | 'lg' =
    fontSize <= 15 ? 'sm' : fontSize <= 19 ? 'md' : 'lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 bg-black/45 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[82vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching Image 5: Bold "Settings" + X */}
        <div className="flex items-center justify-between pb-4">
          <h3 className="font-bold text-xl tracking-tight">Settings</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* 1. Three-Segment Font Size Selector (A / A / A) matching Image 5 */}
          <div className="grid grid-cols-3 rounded-xl bg-[#F3F2F2] dark:bg-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setFontSize(14)}
              className={`h-12 flex items-center justify-center text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                activeSizeTier === 'sm'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
              title="Small text (14px)"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize(16)}
              className={`h-12 flex items-center justify-center text-base font-bold rounded-xl transition-colors cursor-pointer ${
                activeSizeTier === 'md'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
              title="Medium text (16px)"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize(20)}
              className={`h-12 flex items-center justify-center text-xl font-medium rounded-xl transition-colors cursor-pointer ${
                activeSizeTier === 'lg'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
              title="Large text (20px)"
            >
              A
            </button>
          </div>

          {/* 2. Two-Segment Font Family Picker (Source Serif | Aktiv) matching Image 5 */}
          <div className="grid grid-cols-2 rounded-xl bg-[#F3F2F2] dark:bg-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setReaderFont('serif')}
              className={`h-12 flex items-center justify-center font-serif text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                readerFont === 'serif'
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              Source Serif
            </button>
            <button
              type="button"
              onClick={() => setReaderFont('sans')}
              className={`h-12 flex items-center justify-center font-sans text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                readerFont === 'sans'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              Aktiv
            </button>
          </div>

          {/* 3. Footnotes Toggle Row matching Image 5 */}
          <div className="rounded-xl bg-[#F3F2F2] dark:bg-slate-800 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Footnotes
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showFootnotes}
              onClick={() => setShowFootnotes(!showFootnotes)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                showFootnotes
                  ? 'bg-black dark:bg-white'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-900 shadow-xs transition-transform ${
                  showFootnotes ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Numbers and Titles Toggle Row matching Image 5 */}
          <div className="rounded-xl bg-[#F3F2F2] dark:bg-slate-800 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Numbers and Titles
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showNumbersAndTitles}
              onClick={() => setShowNumbersAndTitles(!showNumbersAndTitles)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                showNumbersAndTitles
                  ? 'bg-black dark:bg-white'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-900 shadow-xs transition-transform ${
                  showNumbersAndTitles ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Bilingual Hanyu Pinyin & Display Options */}
          <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {/* Pinyin Placement */}
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Hanyu Pinyin Placement
              </div>
              <div className="grid grid-cols-4 rounded-xl bg-[#F3F2F2] dark:bg-slate-800 overflow-hidden">
                {(
                  [
                    { id: 'below', label: 'Below' },
                    { id: 'inline', label: 'Inline' },
                    { id: 'above', label: 'Above' },
                    { id: 'off', label: 'Off' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPinyinMode(mode.id)}
                    className={`py-2.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                      pinyinMode === mode.id
                        ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pinyin Size & Tone Colors */}
            {pinyinMode !== 'off' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="grid grid-cols-3 rounded-xl bg-[#F3F2F2] dark:bg-slate-800 overflow-hidden">
                  {(['sm', 'base', 'lg'] as PinyinSize[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPinyinSize(sz)}
                      className={`py-2 text-xs font-semibold uppercase rounded-xl transition-colors cursor-pointer ${
                        pinyinSize === sz
                          ? 'bg-black text-white dark:bg-white dark:text-black'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sz === 'sm' ? 'S' : sz === 'base' ? 'M' : 'L'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setColorTones(!colorTones)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    colorTones
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-[#F3F2F2] dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {colorTones ? 'Tone Colors: On' : 'Tone Colors: Off'}
                </button>
              </div>
            )}

            {/* Reading Mode & Theme */}
            <div className="grid grid-cols-2 gap-2">
              <div className="grid grid-cols-2 rounded-xl bg-[#F3F2F2] dark:bg-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setReadingMode('interlinear')}
                  className={`py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                    readingMode === 'interlinear'
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Stacked
                </button>
                <button
                  type="button"
                  onClick={() => setReadingMode('single')}
                  className={`py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                    readingMode === 'single'
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Single
                </button>
              </div>

              <div className="grid grid-cols-2 rounded-xl bg-[#F3F2F2] dark:bg-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Red Letter Toggle */}
            <div className="rounded-xl bg-[#F3F2F2] dark:bg-slate-800 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                Red Letter Words
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={redLetter}
                onClick={() => setRedLetter(!redLetter)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  redLetter ? 'bg-[#C20009]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                    redLetter ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Audio Language */}
            {setAudioLanguage && (
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Audio Language
                </div>
                <div className="grid grid-cols-3 rounded-xl bg-[#F3F2F2] dark:bg-slate-800 overflow-hidden">
                  {(
                    [
                      { id: 'zh', label: '中文' },
                      { id: 'en', label: 'English' },
                      { id: 'bilingual', label: 'Both' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAudioLanguage(item.id)}
                      className={`py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                        audioLanguage === item.id
                          ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
