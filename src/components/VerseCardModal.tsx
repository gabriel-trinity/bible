import React, { useState } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';
import { VerseItem, AppTheme } from '../types/bible';
import { PinyinVerseText } from './PinyinVerseText';

interface VerseCardModalProps {
  verse: VerseItem | null;
  bookNameZh: string;
  bookNameEn: string;
  chapter: number;
  isOpen: boolean;
  theme: AppTheme;
  onClose: () => void;
}

type CardStyle = 'burgundy' | 'linen' | 'gold' | 'midnight';

const CARD_STYLES: { id: CardStyle; label: string; bgClass: string; textClass: string; borderClass: string }[] = [
  {
    id: 'burgundy',
    label: 'Deep Burgundy',
    bgClass: 'bg-[#3B0D18]',
    textClass: 'text-[#E3DFD5]',
    borderClass: 'border-[#551624]',
  },
  {
    id: 'linen',
    label: 'Warm Linen',
    bgClass: 'bg-[#E3DFD5]',
    textClass: 'text-[#3B0D18]',
    borderClass: 'border-[#d0c9bb]',
  },
  {
    id: 'gold',
    label: 'Golden Light',
    bgClass: 'bg-linear-to-br from-[#faf4e6] to-[#f0dfbe]',
    textClass: 'text-[#3B0D18]',
    borderClass: 'border-[#dfcb9f]',
  },
  {
    id: 'midnight',
    label: 'Midnight Grace',
    bgClass: 'bg-linear-to-br from-[#1a080e] to-[#2b0e17]',
    textClass: 'text-[#E3DFD5]',
    borderClass: 'border-[#421523]',
  },
];

export const VerseCardModal: React.FC<VerseCardModalProps> = ({
  verse,
  bookNameZh,
  bookNameEn,
  chapter,
  isOpen,
  theme,
  onClose,
}) => {
  const [cardStyle, setCardStyle] = useState<CardStyle>('burgundy');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !verse) return null;

  const currentStyle = CARD_STYLES.find((s) => s.id === cardStyle) || CARD_STYLES[0];
  const referenceEn = `${bookNameEn} ${chapter}:${verse.number}`;
  const referenceZh = `${bookNameZh} ${chapter}:${verse.number}`;

  const handleCopyText = () => {
    const text = `[${referenceEn} · ${referenceZh}]\n${verse.textEn || ''}\n${verse.textZh}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border transition-all ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="font-bold text-base">Shareable Verse Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Style Selector */}
        <div className="flex items-center gap-2 my-4">
          <span className="text-xs opacity-75 font-sans">Palette:</span>
          <div className="flex gap-2">
            {CARD_STYLES.map((st) => (
              <button
                key={st.id}
                onClick={() => setCardStyle(st.id)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-sans transition-all cursor-pointer ${
                  cardStyle === st.id
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scripture Card Preview */}
        <div
          id="scripture-card-preview"
          className={`rounded-3xl p-6 sm:p-8 border shadow-lg transition-all relative overflow-hidden ${currentStyle.bgClass} ${currentStyle.textClass} ${currentStyle.borderClass}`}
        >
          {/* Card Content */}
          <div className="text-center space-y-4 relative z-10">
            {/* Reference */}
            <div className="inline-block px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 text-xs font-semibold tracking-wider">
              {referenceEn} · {referenceZh}
            </div>

            {/* Parallel English Verse first/above */}
            {verse.textEn && (
              <div className="text-sm sm:text-base italic font-serif opacity-95 leading-relaxed pt-1">
                "{verse.textEn}"
              </div>
            )}

            {/* Chinese Verse with Pinyin below */}
            <div className="text-lg sm:text-xl font-medium leading-[2.6] my-2 border-t border-current/15 pt-3">
              <PinyinVerseText
                text={verse.textZh}
                pinyinMode="below"
                pinyinSize="base"
                colorTones={false}
                theme={cardStyle === 'burgundy' || cardStyle === 'midnight' ? 'dark' : 'light'}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2 justify-end">
          <button
            onClick={handleCopyText}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Verse Card'}</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
