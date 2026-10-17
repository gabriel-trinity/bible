import React, { useState } from 'react';
import { Sparkles, X, Volume2, Copy, Check } from 'lucide-react';
import { PinyinVerseText } from './PinyinVerseText';
import { AppTheme, PinyinDisplayMode, PinyinSize } from '../types/bible';
import { speechService } from '../services/speechService';

interface CustomPassageModalProps {
  isOpen: boolean;
  theme: AppTheme;
  pinyinMode: PinyinDisplayMode;
  pinyinSize: PinyinSize;
  colorTones: boolean;
  onClose: () => void;
  onCharClick: (char: string, pinyin: string, tone: number) => void;
}

const SAMPLE_PASSAGES = [
  {
    title: 'John 3:16',
    text: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
  },
  {
    title: 'The Lord’s Prayer',
    text: '我们在天上的父：愿人都尊你的名为圣。愿你的国降临；愿你的旨意行在地上，如同行在天上。我们日用的饮食，今日赐给我们。免我们的债，如同我们免了人的债。不叫我们遇见试探；救我们脱离凶恶。因为国度、权柄、荣耀，全是你的，直到永远。阿们！',
  },
  {
    title: 'Psalm 23:1-3',
    text: '耶和华是我的牧者，我必不致缺乏。他使我躺卧在青草地上，领我在可安歇的水边。他使我的灵魂苏醒，为自己的名引导我走义路。',
  },
];

export const CustomPassageModal: React.FC<CustomPassageModalProps> = ({
  isOpen,
  theme,
  pinyinMode,
  pinyinSize,
  colorTones,
  onClose,
  onCharClick,
}) => {
  const [inputText, setInputText] = useState(SAMPLE_PASSAGES[0].text);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadAloud = () => {
    speechService.speak(inputText, 'zh', 0.85);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl p-6 shadow-2xl border transition-all overflow-hidden ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="font-bold text-base sm:text-lg">
              Custom Passage Pinyin Annotator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] opacity-60 mr-1">Quick Samples:</span>
          {SAMPLE_PASSAGES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(sample.text)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {sample.title}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <label className="text-xs font-semibold block mb-1 opacity-80">
              Paste or type Chinese scripture, hymn, or passage:
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste any Chinese scripture here to generate Hanyu Pinyin annotations..."
              className="w-full p-3 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold opacity-85">
                Real-time Pinyin Annotations (Click character for pronunciation):
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleReadAloud}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer font-medium text-slate-700 dark:text-slate-300"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Read Aloud</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer font-medium text-slate-700 dark:text-slate-300"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-base sm:text-lg leading-[2.6]">
              {inputText ? (
                <PinyinVerseText
                  text={inputText}
                  pinyinMode={pinyinMode}
                  pinyinSize={pinyinSize}
                  colorTones={colorTones}
                  theme={theme}
                  onCharClick={onCharClick}
                />
              ) : (
                <span className="opacity-50 text-sm">Waiting for text...</span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
