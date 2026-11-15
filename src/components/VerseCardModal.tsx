import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Sparkles, Share2 } from 'lucide-react';
import { VerseItem, AppTheme } from '../types/bible';
import { PinyinVerseText } from './PinyinVerseText';
import { stripVerseMarkup } from '../services/pinyinService';

interface VerseCardModalProps {
  verse: VerseItem | null;
  snippetText?: string;
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
  snippetText,
  bookNameZh,
  bookNameEn,
  chapter,
  isOpen,
  theme,
  onClose,
}) => {
  const [cardStyle, setCardStyle] = useState<CardStyle>('burgundy');
  const [useSnippet, setUseSnippet] = useState<boolean>(Boolean(snippetText?.trim()));
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    setUseSnippet(Boolean(snippetText?.trim()));
  }, [snippetText, isOpen]);

  if (!isOpen || !verse) return null;

  const currentStyle = CARD_STYLES.find((s) => s.id === cardStyle) || CARD_STYLES[0];
  const referenceEn = `${bookNameEn} ${chapter}:${verse.number}`;
  const referenceZh = `${bookNameZh} ${chapter}:${verse.number}`;
  const hasSnippet = Boolean(snippetText?.trim());
  const showingSnippet = hasSnippet && useSnippet;
  const snippetHasChinese = showingSnippet && /[\u4e00-\u9fff]/.test(snippetText || '');

  const buildCardText = () => {
    if (showingSnippet && snippetText) {
      return `“${snippetText.trim()}”\n— ${referenceEn} · ${referenceZh}`;
    }
    const cleanEn = stripVerseMarkup(verse.textEn || '', { stripNotes: true });
    const cleanZh = stripVerseMarkup(verse.textZh, { stripNotes: false });
    return `[${referenceEn} · ${referenceZh}]\n${cleanEn}\n${cleanZh}`;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(buildCardText());
    } catch {
      // Ignore clipboard permission errors
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCard = async () => {
    const text = buildCardText();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${referenceEn} · ${referenceZh}`,
          text,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    await handleCopyText();
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
            <h3 className="font-bold text-base">
              {showingSnippet ? 'Shareable Snippet Card' : 'Shareable Verse Card'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optional Snippet vs Full Verse Toggle */}
        {hasSnippet && (
          <div className="flex items-center justify-between gap-2 mt-4">
            <span className="text-xs opacity-75 font-sans">Content:</span>
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100/70 dark:bg-slate-800/70">
              <button
                type="button"
                onClick={() => setUseSnippet(true)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  useSnippet
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Selected Snippet
              </button>
              <button
                type="button"
                onClick={() => setUseSnippet(false)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !useSnippet
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Full Verse
              </button>
            </div>
          </div>
        )}

        {/* Card Style Selector */}
        <div className="flex items-center gap-2 my-4 flex-wrap">
          <span className="text-xs opacity-75 font-sans">Palette:</span>
          <div className="flex gap-2 flex-wrap">
            {CARD_STYLES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setCardStyle(st.id)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-sans transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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
          className={`rounded-3xl p-6 sm:p-8 border shadow-lg transition-all relative ${currentStyle.bgClass} ${currentStyle.textClass} ${currentStyle.borderClass}`}
        >
          {/* Card Content */}
          <div className="text-center space-y-4 relative z-10">
            {/* Reference */}
            <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              {referenceEn} · {referenceZh}
            </div>

            {showingSnippet && snippetText ? (
              snippetHasChinese ? (
                <div className="text-xl sm:text-2xl font-medium leading-[2.5] pt-2 border-t border-current/15">
                  <PinyinVerseText
                    text={snippetText.trim()}
                    pinyinMode="below"
                    pinyinSize="base"
                    colorTones={false}
                    theme={cardStyle === 'burgundy' || cardStyle === 'midnight' ? 'dark' : 'light'}
                  />
                </div>
              ) : (
                <div className="text-base sm:text-xl italic font-serif leading-relaxed pt-2 border-t border-current/15">
                  “{snippetText.trim()}”
                </div>
              )
            ) : (
              <>
                {/* Parallel English Verse first/above */}
                {verse.textEn && (
                  <div className="text-sm sm:text-base italic font-serif opacity-95 leading-relaxed pt-1">
                    “{stripVerseMarkup(verse.textEn, { stripNotes: true })}”
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
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2 justify-end flex-wrap">
          <button
            type="button"
            onClick={handleShareCard}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{shared ? 'Shared' : 'Share'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : showingSnippet ? 'Copy Snippet' : 'Copy Verse Card'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
