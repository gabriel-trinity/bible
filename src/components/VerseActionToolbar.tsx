import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Copy,
  Check,
  Volume2,
  FileText,
  X,
  Highlighter,
  Scissors,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  CornerUpRight,
} from 'lucide-react';
import {
  HighlightColor,
  AppTheme,
  VerseItem,
  VerseSelectionInfo,
  TranslationId,
} from '../types/bible';
import { TRANSLATIONS } from '../data/bibleBooks';
import { getVerseTextForTranslation } from '../data/curatedChapters';
import { speechService } from '../services/speechService';
import { stripVerseMarkup } from '../services/pinyinService';

interface VerseActionToolbarProps {
  verse: VerseItem;
  bookNameZh: string;
  bookNameEn: string;
  chapter: number;
  primaryTrans?: TranslationId;
  isBookmarked: boolean;
  highlightColor?: HighlightColor;
  theme: AppTheme;
  selectionInfo?: VerseSelectionInfo | null;
  onToggleBookmark: () => void;
  onSetHighlight: (color: HighlightColor | null) => void;
  onOpenNote: () => void;
  onOpenCardModal: (snippetText?: string) => void;
  onSaveSnippet?: (snippetText: string) => void;
  onClearSelection?: () => void;
  onClose: () => void;
}

const HIGHLIGHT_SWATCHES: {
  id: HighlightColor;
  label: string;
  swatchClass: string;
}[] = [
  { id: 'yellow', label: 'Yellow', swatchClass: 'bg-[#fef035]' },
  { id: 'emerald', label: 'Green', swatchClass: 'bg-[#66f769]' },
  { id: 'sky', label: 'Blue', swatchClass: 'bg-[#00d4ff]' },
  { id: 'gold', label: 'Orange', swatchClass: 'bg-[#ffc663]' },
  { id: 'rose', label: 'Pink', swatchClass: 'bg-[#f28df2]' },
];

const COMPARE_TRANSLATIONS: TranslationId[] = ['NIV', 'ESV', 'NKJV', 'NLT', 'NASB', 'CNVS'];

const CompareCirclesIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="9.5" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="14.5" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const VerseActionToolbar: React.FC<VerseActionToolbarProps> = ({
  verse,
  bookNameZh,
  bookNameEn,
  chapter,
  primaryTrans = 'NIV',
  isBookmarked,
  highlightColor,
  theme,
  selectionInfo,
  onToggleBookmark,
  onSetHighlight,
  onOpenNote,
  onOpenCardModal,
  onSaveSnippet,
  onClearSelection,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharedFeedback, setSharedFeedback] = useState<'shared' | 'copied' | null>(null);
  const [snippetSaved, setSnippetSaved] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const isSelectionTriggered = Boolean(
    selectionInfo &&
      (selectionInfo.trigger === 'drag' || selectionInfo.trigger === 'longpress') &&
      selectionInfo.selectedText.trim().length > 0
  );

  const [draftSnippet, setDraftSnippet] = useState<string>(selectionInfo?.selectedText || '');

  useEffect(() => {
    setDraftSnippet(selectionInfo?.selectedText || '');
    setSnippetSaved(false);
    setIsCompareOpen(false);
  }, [selectionInfo?.selectedText, selectionInfo?.trigger, verse.number]);

  const activeSnippet = draftSnippet.trim();
  const isSnippetMode = isSelectionTriggered && activeSnippet.length > 0;

  const editionLabel = TRANSLATIONS[primaryTrans]?.shortName || primaryTrans;
  const referenceEn = `${bookNameEn} ${chapter}:${verse.number}`;
  const referenceZh = `${bookNameZh} ${chapter}:${verse.number}`;
  const referenceHeader = `${referenceEn} ${editionLabel}`;
  const referenceStr = `${referenceEn} (${referenceZh})`;

  const buildSharePayload = () => {
    if (isSnippetMode) {
      return `“${activeSnippet}”\n— ${referenceEn} · ${referenceZh}`;
    }
    const cleanEn = stripVerseMarkup(
      getVerseTextForTranslation(verse, primaryTrans === 'CNVS' ? 'NIV' : primaryTrans) ||
        verse.textEn ||
        '',
      { stripNotes: true }
    );
    const cleanZh = stripVerseMarkup(verse.textZh, { stripNotes: false });
    return `[${referenceStr}]\n${cleanEn}\n${cleanZh}`;
  };

  const handleCopy = async () => {
    const textToCopy = buildSharePayload();
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      // Ignore clipboard permission errors
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareVerseText = async () => {
    const textToShare = buildSharePayload();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: referenceStr,
          text: textToShare,
        });
        setSharedFeedback('shared');
        setTimeout(() => setSharedFeedback(null), 2000);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(textToShare);
      setSharedFeedback('copied');
      setTimeout(() => setSharedFeedback(null), 2000);
    } catch {
      // Ignore clipboard fallback error
    }
  };

  const handleSaveSnippet = () => {
    if (!activeSnippet || !onSaveSnippet) return;
    onSaveSnippet(activeSnippet);
    setSnippetSaved(true);
    setTimeout(() => setSnippetSaved(false), 2200);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none font-sans">
      <div
        role="dialog"
        aria-label={`Actions for ${referenceEn}`}
        className={`pointer-events-auto w-full max-w-2xl rounded-t-3xl border-t border-x transition-all animate-in slide-in-from-bottom-4 duration-200 ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-[0_-12px_40px_rgba(0,0,0,0.65)]'
            : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_-12px_40px_rgba(15,23,42,0.14)]'
        }`}
      >
        {/* Top Sheet Header matching screenshot */}
        <div className="px-5 sm:px-6 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
              {isSnippetMode ? 'Selected Snippet:' : 'Currently Selected:'}
            </div>
            <button
              type="button"
              onClick={() => setIsCompareOpen((prev) => !prev)}
              className="mt-0.5 inline-flex items-center gap-0.5 text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 hover:opacity-75 transition-opacity cursor-pointer"
              title="Compare translations for this verse"
            >
              <span>{referenceHeader}</span>
              <ChevronRight className="w-4 h-4 stroke-[2.25]" />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSnippetMode && onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="px-2.5 py-1.5 text-xs font-medium rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                Full Verse
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
              aria-label="Close verse actions"
            >
              <X className="w-5 h-5 stroke-[1.9]" />
            </button>
          </div>
        </div>

        {/* Compare Translations View */}
        {isCompareOpen ? (
          <div className="px-5 sm:px-6 pb-5 max-h-[55vh] overflow-y-auto space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Actions</span>
              </button>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {referenceZh}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {COMPARE_TRANSLATIONS.map((tId) => {
                const text = stripVerseMarkup(getVerseTextForTranslation(verse, tId), {
                  stripNotes: true,
                });
                if (!text) return null;
                return (
                  <div key={tId} className="py-2.5 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {TRANSLATIONS[tId]?.shortName || tId}
                    </div>
                    <p
                      className={`text-sm leading-relaxed text-slate-900 dark:text-slate-100 ${
                        tId === 'CNVS' ? 'font-sans' : 'font-serif'
                      }`}
                    >
                      {text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Snippet Editor + Quick Snippet Actions when drag/long-press selected */}
            {isSnippetMode && (
              <div className="mx-5 sm:mx-6 mb-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 space-y-2.5">
                <div className="flex items-start gap-2">
                  <Scissors className="w-4 h-4 mt-0.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={draftSnippet}
                    onChange={(e) => setDraftSnippet(e.target.value)}
                    aria-label="Selected verse snippet"
                    className="w-full bg-transparent text-xs sm:text-sm leading-snug text-slate-900 dark:text-slate-100 focus:outline-hidden font-medium"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveSnippet}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      snippetSaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900'
                    }`}
                  >
                    {snippetSaved ? <Check className="w-3.5 h-3.5" /> : <Scissors className="w-3.5 h-3.5" />}
                    <span>{snippetSaved ? 'Snippet Saved' : 'Save Snippet'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenCardModal(activeSnippet)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Snippet Card</span>
                  </button>
                </div>
              </div>
            )}

            {/* Primary Divider-Separated Action Rows matching screenshot */}
            <div className="px-5 sm:px-6 divide-y divide-slate-100 dark:divide-slate-800/90">
              {/* Row 1: Highlight + 5 Vibrant Color Swatches */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 shrink-0">
                  <Highlighter className="w-5 h-5 text-slate-800 dark:text-slate-200 stroke-[1.8]" />
                  <span className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                    Highlight
                  </span>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-0.5 pr-0.5">
                  {HIGHLIGHT_SWATCHES.map((c) => {
                    const isActive = highlightColor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSetHighlight(isActive ? null : c.id)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 transition-transform cursor-pointer flex items-center justify-center ${
                          c.swatchClass
                        } ${
                          isActive
                            ? 'ring-2 ring-slate-900 dark:ring-slate-100 ring-offset-2 dark:ring-offset-slate-900 scale-95'
                            : 'hover:scale-105'
                        }`}
                        title={isActive ? `Remove ${c.label} highlight` : `Highlight ${c.label}`}
                        aria-label={isActive ? `Remove ${c.label} highlight` : `Highlight ${c.label}`}
                      >
                        {isActive && <Check className="w-4 h-4 text-slate-900 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Copy */}
              <button
                type="button"
                onClick={handleCopy}
                className="w-full py-3.5 flex items-center gap-3.5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-5 h-5 text-slate-800 dark:text-slate-200 stroke-[1.8] shrink-0" />
                )}
                <span className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                  {copied ? 'Copied to Clipboard' : isSnippetMode ? 'Copy Snippet' : 'Copy'}
                </span>
              </button>

              {/* Row 3: Compare */}
              <button
                type="button"
                onClick={() => setIsCompareOpen(true)}
                className="w-full py-3.5 flex items-center gap-3.5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <CompareCirclesIcon className="w-5 h-5 text-slate-800 dark:text-slate-200 shrink-0" />
                <span className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                  Compare
                </span>
              </button>

              {/* Row 4: Share */}
              <button
                type="button"
                onClick={handleShareVerseText}
                className="w-full py-3.5 flex items-center gap-3.5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
              >
                {sharedFeedback ? (
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <CornerUpRight className="w-5 h-5 text-slate-800 dark:text-slate-200 stroke-[1.9] shrink-0" />
                )}
                <span className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                  {sharedFeedback === 'shared'
                    ? 'Shared'
                    : sharedFeedback === 'copied'
                    ? 'Ready to Share (Copied)'
                    : isSnippetMode
                    ? 'Share Snippet'
                    : 'Share'}
                </span>
              </button>
            </div>

            {/* Clean Compact Study Strip: Bookmark · Note · Verse Card · Listen */}
            <div className="px-4 sm:px-6 pt-2 pb-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={onToggleBookmark}
                className={`py-2 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  isBookmarked
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenNote}
                className="py-2 px-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Note</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCardModal(isSnippetMode ? activeSnippet : undefined)}
                className="py-2 px-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => speechService.speak(verse.textZh, 'zh', 0.9)}
                className="py-2 px-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="Listen in Mandarin Chinese (中文朗读)"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>朗读</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
