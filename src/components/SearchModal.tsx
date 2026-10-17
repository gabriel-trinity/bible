import React, { useState } from 'react';
import { Search, X, BookOpen, ArrowRight } from 'lucide-react';
import { searchScriptures, SearchResult } from '../services/bibleService';
import { AppTheme } from '../types/bible';

interface SearchModalProps {
  isOpen: boolean;
  theme: AppTheme;
  onClose: () => void;
  onJumpToVerse: (bookId: string, chapter: number, verseNumber: number) => void;
}

const QUICK_TOPICS = ['Faith', 'Love', 'Peace', 'Light', 'Shepherd', 'Beginning', 'Eternal Life', 'Comfort'];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  theme,
  onClose,
  onJumpToVerse,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const cleanTerm = searchTerm.split(' ')[0].trim();
    const res = searchScriptures(cleanTerm);
    setResults(res);
    setHasSearched(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl shadow-2xl border transition-all overflow-hidden ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h3 className="font-bold text-base">Search Scripture</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input form */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <form onSubmit={handleFormSubmit} className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                autoFocus
                placeholder="Search by English, Chinese, or Pinyin (e.g. Love, Light, 爱, 起初)..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
              />
            </div>
          </form>

          {/* Quick topic buttons */}
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <span className="text-[11px] opacity-60 mr-1">Topics:</span>
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => handleSearch(topic)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {hasSearched && results.length === 0 ? (
            <div className="text-center py-12 opacity-50 text-xs sm:text-sm">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No results found for “{query}”</p>
            </div>
          ) : (
            results.map((r, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onJumpToVerse(r.bookId, r.chapter, r.verseNumber);
                  onClose();
                }}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-xs">
                    {r.bookNameEn} {r.chapter}:{r.verseNumber} ({r.bookNameZh})
                  </span>
                  <span className="text-xs opacity-60 group-hover:opacity-100 flex items-center gap-1">
                    <span>Read</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-sm font-medium leading-relaxed">
                  {r.textEn}
                </div>
                <div className="text-xs opacity-75 mt-1 leading-relaxed">
                  {r.textZh}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
