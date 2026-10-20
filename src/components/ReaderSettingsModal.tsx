import React from 'react';
import { X, Sliders, Type, Palette, Layout, Sparkles, Volume2 } from 'lucide-react';
import {
  PinyinDisplayMode,
  PinyinSize,
  AppTheme,
  ReadingMode,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="font-bold text-base">Reader & Pinyin Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs sm:text-sm">
          {/* 1. Hanyu Pinyin Display Placement */}
          <div>
            <label className="font-semibold block mb-2 flex items-center gap-1.5 opacity-80">
              <Type className="w-4 h-4" />
              <span>汉语拼音 · Pinyin Placement</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPinyinMode('below')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                  pinyinMode === 'below'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>Below Characters</div>
                <div className="text-[10px] opacity-70">汉字下方拼音 · Underneath</div>
              </button>

              <button
                onClick={() => setPinyinMode('inline')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                  pinyinMode === 'inline'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>Inline Pinyin</div>
                <div className="text-[10px] opacity-70">行内拼音 · Inline</div>
              </button>

              <button
                onClick={() => setPinyinMode('above')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                  pinyinMode === 'above'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>Above Characters</div>
                <div className="text-[10px] opacity-70">汉字上方拼音 · Ruby</div>
              </button>

              <button
                onClick={() => setPinyinMode('off')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                  pinyinMode === 'off'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>Hide Pinyin</div>
                <div className="text-[10px] opacity-70">隐藏拼音 · 仅汉字</div>
              </button>
            </div>
          </div>

          {/* 2. Pinyin Size & Tone Colors */}
          {pinyinMode !== 'off' && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="font-semibold block mb-1.5 opacity-80">
                  Pinyin Size
                </label>
                <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden p-0.5">
                  {(['sm', 'base', 'lg'] as PinyinSize[]).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setPinyinSize(sz)}
                      className={`flex-1 py-1.5 text-xs font-semibold uppercase transition-colors cursor-pointer rounded-lg ${
                        pinyinSize === sz
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sz === 'sm' ? 'S' : sz === 'base' ? 'M' : 'L'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1.5 opacity-80">
                  Tone Color Accents
                </label>
                <button
                  onClick={() => setColorTones(!colorTones)}
                  className={`w-full py-1.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    colorTones
                      ? 'border-slate-900 bg-slate-100 dark:border-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{colorTones ? 'Colored Tones' : 'Neutral Tone'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Reading Layout */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="font-semibold block mb-2 flex items-center gap-1.5 opacity-80">
              <Layout className="w-4 h-4" />
              <span>Reading Layout</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setReadingMode('interlinear')}
                className={`py-2 px-1.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                  readingMode === 'interlinear'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>Interlinear</div>
                <div className="text-[10px] opacity-70">Verse Stacked</div>
              </button>

              <button
                onClick={() => setReadingMode('single')}
                className={`py-2 px-1.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                  readingMode === 'single'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>Single Focus</div>
                <div className="text-[10px] opacity-70">Full Column</div>
              </button>
            </div>
          </div>

          {/* 4. Scripture Font Size Slider */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold opacity-80">
                Scripture Font Size
              </label>
              <span className="font-bold">
                {fontSize}px
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs">A</span>
              <input
                type="range"
                min={14}
                max={28}
                step={2}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-slate-900 dark:accent-slate-100 cursor-pointer"
              />
              <span className="text-lg font-bold">A</span>
            </div>
          </div>

          {/* 5. Theme Palette */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="font-semibold block mb-2 flex items-center gap-1.5 opacity-80">
              <Palette className="w-4 h-4" />
              <span>Theme Mode</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer bg-white text-slate-900 ${
                  theme === 'light'
                    ? 'ring-2 ring-slate-900 border-slate-900 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-900 mx-auto mb-1" />
                <span className="text-xs font-semibold block">Light Mode</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer bg-slate-900 text-slate-100 ${
                  theme === 'dark'
                    ? 'ring-2 ring-slate-100 border-slate-100 font-bold shadow-xs'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-100 mx-auto mb-1" />
                <span className="text-xs font-semibold block">Dark Mode</span>
              </button>
            </div>
          </div>

          {/* 6. Red Letter Edition Toggle */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold block flex items-center gap-1.5 opacity-90">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C20009] inline-block shrink-0" />
                  <span>Red Letter Edition</span>
                </label>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Highlight words spoken by Jesus Christ in red
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRedLetter(!redLetter)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  redLetter ? 'bg-[#C20009]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={redLetter}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    redLetter ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 7. Audio Playback Language */}
          {setAudioLanguage && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="font-semibold block mb-2 flex items-center gap-1.5 opacity-80">
                <Volume2 className="w-4 h-4" />
                <span>Audio Reading Language (朗读语言)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAudioLanguage('zh')}
                  className={`py-2 px-1.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                    audioLanguage === 'zh'
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs">🇨🇳 中文</div>
                  <div className="text-[10px] opacity-70">Mandarin</div>
                </button>

                <button
                  onClick={() => setAudioLanguage('en')}
                  className={`py-2 px-1.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                    audioLanguage === 'en'
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs">🇺🇸 English</div>
                  <div className="text-[10px] opacity-70">NIV</div>
                </button>

                <button
                  onClick={() => setAudioLanguage('bilingual')}
                  className={`py-2 px-1.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                    audioLanguage === 'bilingual'
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs">🌐 双语</div>
                  <div className="text-[10px] opacity-70">CN + EN</div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
