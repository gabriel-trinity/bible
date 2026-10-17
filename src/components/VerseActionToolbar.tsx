import React, { useState } from 'react';
import {
  Bookmark,
  Copy,
  Check,
  Volume2,
  FileText,
  Share2,
  X,
  Highlighter,
} from 'lucide-react';
import { HighlightColor, AppTheme, VerseItem } from '../types/bible';
import { speechService } from '../services/speechService';

interface VerseActionToolbarProps {
  verse: VerseItem;
  bookNameZh: string;
  bookNameEn: string;
  chapter: number;
  isBookmarked: boolean;
  highlightColor?: HighlightColor;
  theme: AppTheme;
  onToggleBookmark: () => void;
  onSetHighlight: (color: HighlightColor | null) => void;
  onOpenNote: () => void;
  onOpenCardModal: () => void;
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
  onToggleBookmark,
  onSetHighlight,
  onOpenNote,
  onOpenCardModal,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const referenceStr = `${bookNameEn} ${chapter}:${verse.number} (${bookNameZh} ${chapter}:${verse.number})`;

  const handleCopy = () => {
    const textToCopy = `[${referenceStr}]\n${verse.textEn || ''}\n${verse.textZh}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadAloud = () => {
    speechService.speak(verse.textZh, 'zh', 0.9);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[94%] sm:w-auto p-2.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 font-sans ${
        theme === 'dark'
          ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/50'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
      }`}
    >
      <div className="flex items-center justify-between gap-1 sm:gap-2 px-2 py-1">
        <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
          {referenceStr}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md opacity-60 hover:opacity-100 transition-colors cursor-pointer"
          title="Close toolbar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-slate-200 dark:border-slate-800 flex-wrap">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Copy bilingual verse to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* Bookmark Button */}
        <button
          onClick={onToggleBookmark}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
            isBookmarked
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 font-bold shadow-2xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Save to bookmarks"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
        </button>

        {/* Read Aloud Button */}
        <button
          onClick={handleReadAloud}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Listen to Chinese audio"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Listen</span>
        </button>

        {/* Highlight Trigger & Color palette */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
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
                  onClick={() => {
                    onSetHighlight(c.id);
                    setShowColorPicker(false);
                  }}
                  className={`w-6 h-6 rounded-full border-2 cursor-pointer ${c.bgClass} ${
                    highlightColor === c.id ? 'ring-2 ring-slate-900 dark:ring-slate-100 scale-110' : 'border-transparent'
                  }`}
                  title={c.label}
                />
              ))}
              {highlightColor && (
                <button
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
          onClick={onOpenNote}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Add or edit study note"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Note</span>
        </button>

        {/* Card Generator Button */}
        <button
          onClick={onOpenCardModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          title="Generate shareable verse card"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Card</span>
        </button>
      </div>
    </div>
  );
};
