import React from 'react';
import { Volume2, X, BookOpen } from 'lucide-react';
import { getToneColor, getWordExplanation } from '../services/pinyinService';
import { speechService } from '../services/speechService';
import { AppTheme } from '../types/bible';

interface CharacterInspectorModalProps {
  charData: { char: string; pinyin: string; tone: number } | null;
  onClose: () => void;
  theme: AppTheme;
}

const TONE_NAMES: Record<number, string> = {
  1: '1st Tone (High Flat · 阴平)',
  2: '2nd Tone (Rising · 阳平)',
  3: '3rd Tone (Falling-Rising · 上声)',
  4: '4th Tone (Falling · 去声)',
  0: 'Neutral Tone (轻声)',
};

export const CharacterInspectorModal: React.FC<CharacterInspectorModalProps> = ({
  charData,
  onClose,
  theme,
}) => {
  if (!charData) return null;

  const explanation = getWordExplanation(charData.char);
  const toneColor = getToneColor(charData.tone, theme);

  const handlePronounce = () => {
    speechService.speakSingleCharacter(charData.char);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-all ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-75 font-sans">
            <BookOpen className="w-4 h-4" />
            <span>Character & Pronunciation Detail</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-6 text-center">
          <div className="inline-block relative">
            <span className="text-6xl font-bold tracking-normal block leading-none mb-3">
              {charData.char}
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-2xl font-bold tracking-wide ${toneColor}`}>
                {charData.pinyin || explanation.pinyin}
              </span>
              <button
                onClick={handlePronounce}
                title="Pronounce Audio"
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3">
            <span className="inline-block px-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans font-medium">
              {TONE_NAMES[charData.tone] || 'Standard Mandarin'}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-sm">
          <div>
            <div className="text-xs opacity-60 font-sans mb-1">English Meaning</div>
            <div className="font-semibold">{explanation.en}</div>
          </div>
          {explanation.note && (
            <div>
              <div className="text-xs opacity-60 font-sans mb-1">Biblical Context</div>
              <div className="text-xs italic opacity-85">
                {explanation.note}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={handlePronounce}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Listen Pronunciation</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
