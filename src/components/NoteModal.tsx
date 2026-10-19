import React, { useState, useEffect } from 'react';
import { FileText, X, Check } from 'lucide-react';
import { AppTheme, VerseItem } from '../types/bible';

interface NoteModalProps {
  verse: VerseItem | null;
  bookNameZh: string;
  bookNameEn: string;
  chapter: number;
  initialNote: string;
  isOpen: boolean;
  theme: AppTheme;
  onClose: () => void;
  onSave: (note: string) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  verse,
  bookNameZh,
  bookNameEn,
  chapter,
  initialNote,
  isOpen,
  theme,
  onClose,
  onSave,
}) => {
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote, isOpen]);

  if (!isOpen || !verse) return null;

  const handleSave = () => {
    onSave(note.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-in fade-in font-sans"
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
            <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="font-bold text-base">
              Study & Devotional Note · {bookNameEn} {chapter}:{verse.number}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs leading-relaxed">
          <p className="font-semibold">{verse.textEn || verse.textZh}</p>
          <p className="text-[11px] opacity-75 mt-1">{verse.textZh}</p>
        </div>

        <div className="mt-3">
          <textarea
            rows={5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your study insights, devotional reflections, or prayer notes..."
            className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-sans focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-4 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Note</span>
          </button>
        </div>
      </div>
    </div>
  );
};
