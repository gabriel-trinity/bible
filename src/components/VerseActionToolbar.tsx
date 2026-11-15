import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Copy,
  Check,
  Volume2,
  FileText,
  Share2,
  X,
  Highlighter,
  Scissors,
  Sparkles,
} from 'lucide-react';
import { HighlightColor, AppTheme, VerseItem, VerseSelectionInfo } from '../types/bible';
import { speechService } from '../services/speechService';
import { stripVerseMarkup } from '../services/pinyinService';

interface VerseActionToolbarProps {
  verse: VerseItem;
  bookNameZh: string;
  bookNameEn: string;
  chapter: number;
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

const HIGHLIGHT_COLORS: { id: HighlightColor; label: string; bgClass: string; borderClass: string }[] = [
  { id: 'gold', label: 'Gold', bgClass: 'bg-amber-200', borderClass: 'border-amber-400' },
  { id: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-200', borderClass: 'border-emerald-400' },
  { id: 'sky', label: 'Sky Blue', bgClass: 'bg-sky-200', borderClass: 'border-sky-400' },
  { id: 'rose', label: 'Rose', bgClass: 'bg-rose-200', borderClass: 'border-rose-400' },
];

export const VerseActionToolbar: React.FC<VerseActionToolbarProps> = ({
  verse,
  bookNameZh,
  bookNameEn,
  chapter,
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
  const [showColorPicker, setShowColorPicker] = useState(false);

  const isSelectionTriggered = Boolean(
    selectionInfo &&
      (selectionInfo.trigger === 'drag' || selectionInfo.trigger === 'longpress') &&
      selectionInfo.selectedText.trim().length > 0
  );

  const [draftSnippet, setDraftSnippet] = useState<string>(selectionInfo?.selectedText || '');

  useEffect(() => {
    setDraftSnippet(selectionInfo?.selectedText || '');
    setSnippetSaved(false);
  }, [selectionInfo?.selectedText, selectionInfo?.trigger, verse.number]);

  const activeSnippet = draftSnippet.trim();
  const isSnippetMode = isSelectionTriggered && activeSnippet.length > 0;

  const referenceEn = `${bookNameEn} ${chapter}:${verse.number}`;
  const referenceZh = `${bookNameZh} ${chapter}:${verse.number}`;
  const referenceStr = `${referenceEn} (${referenceZh})`;

  const buildSharePayload = () => {
    if (isSnippetMode) {
      return `“${activeSnippet}”\n— ${referenceEn} · ${referenceZh}`;
    }
    const cleanEn = stripVerseMarkup(verse.textEn || '', { stripNotes: true });
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
    <div
      className={`fixed bottom-[8.25rem] sm:bottom-[4.5rem] left-1/2 -translate-x-1/2 z-40 max-w-xl w-[94%] sm:w-auto sm:min-w-[420px] p-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 font-sans ${
        theme === 'dark'
          ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/60'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 px-1 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
            {referenceStr}
          </span>
          {isSnippetMode && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              · {selectionInfo?.trigger === 'longpress' ? 'Long-press snippet' : 'Selected snippet'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isSnippetMode && onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="px-2 py-1 text-[11px] font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Switch back to full verse"
            >
              Full Verse
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close toolbar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected Snippet Preview / Refinement Box */}
      {isSnippetMode && (
        <div className="mb-2 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/70">
          <div className="flex items-start gap-2">
            <Scissors className="w-3.5 h-3.5 mt-1 text-slate-500 dark:text-slate-400 shrink-0" />
            <input
              type="text"
              value={draftSnippet}
              onChange={(e) => setDraftSnippet(e.target.value)}
              aria-label="Selected verse snippet"
              className="w-full bg-transparent text-xs sm:text-[13px] leading-snug text-slate-900 dark:text-slate-100 focus:outline-hidden font-medium"
            />
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex-wrap">
        {isSnippetMode ? (
          <>
            {/* Save Snippet Button */}
            <button
              type="button"
              onClick={handleSaveSnippet}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                snippetSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900'
              }`}
              title="Save highlighted quote to Snippets"
            >
              {snippetSaved ? <Check className="w-3.5 h-3.5" /> : <Scissors className="w-3.5 h-3.5" />}
              <span>{snippetSaved ? 'Snippet Saved' : 'Save Snippet'}</span>
            </button>

            {/* Snippet Card Button */}
            <button
              type="button"
              onClick={() => onOpenCardModal(activeSnippet)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Create a shareable snippet card"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Snippet Card</span>
            </button>

            {/* Share Verse / Snippet Text */}
            <button
              type="button"
              onClick={handleShareVerseText}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Share selected text"
            >
              {sharedFeedback ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>
                {sharedFeedback === 'shared'
                  ? 'Shared'
                  : sharedFeedback === 'copied'
                  ? 'Ready to Share'
                  : 'Share'}
              </span>
            </button>

            {/* Copy Snippet */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Copy selected snippet with reference"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </>
        ) : (
          <>
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Copy bilingual verse to clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Share Verse Text Button */}
            <button
              type="button"
              onClick={handleShareVerseText}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Share verse text"
            >
              {sharedFeedback ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>{sharedFeedback ? 'Shared' : 'Share'}</span>
            </button>

            {/* Card Generator Button */}
            <button
              type="button"
              onClick={() => onOpenCardModal()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition-colors shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
              title="Create verse card"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>
          </>
        )}

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isBookmarked
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 font-bold shadow-2xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Save to bookmarks"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
        </button>

        {/* Chinese Audio Button */}
        <button
          type="button"
          onClick={() => speechService.speak(verse.textZh, 'zh', 0.9)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Listen to Chinese audio (中文朗读)"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>中文朗读</span>
        </button>

        {/* English Audio Button */}
        {verse.textEn && (
          <button
            type="button"
            onClick={() => speechService.speak(verse.textEn || '', 'en', 0.95)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Listen to English audio (NIV)"
          >
            <Volume2 className="w-3.5 h-3.5 opacity-70" />
            <span>English</span>
          </button>
        )}

        {/* Highlight Trigger & Color palette */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              highlightColor
                ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Highlight verse color"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlight</span>
          </button>

          {showColorPicker && (
            <div
              className={`absolute bottom-full left-0 mb-2 p-2 rounded-xl shadow-lg border flex items-center gap-2 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSetHighlight(c.id);
                    setShowColorPicker(false);
                  }}
                  className={`w-6 h-6 rounded-full border-2 cursor-pointer ${c.bgClass} ${
                    highlightColor === c.id
                      ? 'ring-2 ring-slate-900 dark:ring-slate-100 scale-110'
                      : 'border-transparent'
                  }`}
                  title={c.label}
                />
              ))}
              {highlightColor && (
                <button
                  type="button"
                  onClick={() => {
                    onSetHighlight(null);
                    setShowColorPicker(false);
                  }}
                  className="text-[11px] opacity-70 hover:opacity-100 px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Remove highlight"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Note Button */}
        <button
          type="button"
          onClick={onOpenNote}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Add or edit study note"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Note</span>
        </button>
      </div>
    </div>
  );
};
