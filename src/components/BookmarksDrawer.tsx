import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Highlighter,
  FileText,
  X,
  Trash2,
  ArrowRight,
  Search,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import { UserBookmark, HighlightColor, AppTheme } from '../types/bible';
import { getBookById } from '../data/bibleBooks';

interface BookmarksDrawerProps {
  isOpen: boolean;
  theme: AppTheme;
  bookmarks: UserBookmark[];
  highlights: Record<string, HighlightColor>;
  userNotes: Record<string, string>;
  onClose: () => void;
  onJumpToVerse: (bookId: string, chapter: number, verseNumber: number) => void;
  onRemoveBookmark: (id: string) => void;
  onRemoveHighlight: (verseKey: string) => void;
  onRemoveNote: (verseKey: string) => void;
  onUpdateBookmarkTag?: (id: string, tag: string) => void;
}

const DEFAULT_TAGS = ['All', 'Faith', 'Peace', 'Comfort', 'Praise', 'Promises', 'Study'];

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  theme,
  bookmarks,
  highlights,
  userNotes,
  onClose,
  onJumpToVerse,
  onRemoveBookmark,
  onRemoveHighlight,
  onRemoveNote,
  onUpdateBookmarkTag,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'highlights' | 'notes'>('bookmarks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'canonical'>('newest');
  const [copiedAll, setCopiedAll] = useState(false);

  const filteredBookmarks = useMemo(() => {
    let result = [...bookmarks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => {
        const book = getBookById(b.bookId);
        return (
          b.textZh.toLowerCase().includes(q) ||
          b.textEn.toLowerCase().includes(q) ||
          book?.nameEn.toLowerCase().includes(q) ||
          book?.nameZh.toLowerCase().includes(q) ||
          b.categoryTag?.toLowerCase().includes(q)
        );
      });
    }

    if (selectedTag !== 'All') {
      result = result.filter((b) => b.categoryTag === selectedTag);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortBy === 'canonical') {
      result.sort((a, b) => {
        if (a.bookId !== b.bookId) return a.bookId.localeCompare(b.bookId);
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verseNumber - b.verseNumber;
      });
    }

    return result;
  }, [bookmarks, searchQuery, selectedTag, sortBy]);

  if (!isOpen) return null;

  const highlightEntries = Object.entries(highlights);
  const noteEntries = Object.entries(userNotes);

  const parseVerseKey = (key: string) => {
    const parts = key.split('.');
    const bookId = parts[0];
    const chapter = Number(parts[1]) || 1;
    const verseNumber = Number(parts[2]) || 1;
    const book = getBookById(bookId);
    return {
      bookId,
      chapter,
      verseNumber,
      bookNameZh: book?.nameZh || bookId,
      bookNameEn: book?.nameEn || bookId,
    };
  };

  const handleCopyAllBookmarks = () => {
    if (filteredBookmarks.length === 0) return;
    const text = filteredBookmarks
      .map((b) => {
        const book = getBookById(b.bookId);
        return `[${book?.nameEn || b.bookId} ${b.chapter}:${b.verseNumber}]\n${b.textEn}\n${b.textZh}\n`;
      })
      .join('\n---\n\n');

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg h-full flex flex-col shadow-2xl border-l transition-all animate-in slide-in-from-right duration-200 ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h3 className="font-bold text-base sm:text-lg">
              Saved Bookmarks & Library
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarks ({bookmarks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'highlights'
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlights ({highlightEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'notes'
                ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes ({noteEntries.length})</span>
          </button>
        </div>

        {/* Bookmark Filters */}
        {activeTab === 'bookmarks' && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2.5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                placeholder="Search saved bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
              />
            </div>

            {/* Tag Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {DEFAULT_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Sort Controls & Copy All */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <div className="flex items-center gap-1.5 opacity-75">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-medium border-0 focus:ring-0 cursor-pointer"
                >
                  <option value="newest">Newest Added</option>
                  <option value="oldest">Oldest Added</option>
                  <option value="canonical">Biblical Order</option>
                </select>
              </div>

              {filteredBookmarks.length > 0 && (
                <button
                  onClick={handleCopyAllBookmarks}
                  className="flex items-center gap-1 hover:underline transition-colors cursor-pointer"
                >
                  {copiedAll ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAll ? 'Copied' : 'Copy All'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {activeTab === 'bookmarks' && (
            <>
              {filteredBookmarks.length === 0 ? (
                <div className="text-center py-16 opacity-50 text-xs sm:text-sm">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No bookmarks found</p>
                  <p className="text-[11px] mt-1">Select any verse while reading to bookmark it</p>
                </div>
              ) : (
                filteredBookmarks.map((b) => {
                  const book = getBookById(b.bookId);
                  const refEn = `${book?.nameEn || b.bookId} ${b.chapter}:${b.verseNumber}`;
                  const refZh = `${book?.nameZh || b.bookId} ${b.chapter}:${b.verseNumber}`;

                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all bg-white/70 dark:bg-slate-800/50 shadow-2xs"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {refEn}
                          </span>
                          <span className="text-[10px] opacity-60">
                            ({refZh})
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onJumpToVerse(b.bookId, b.chapter, b.verseNumber);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Jump to verse in reader"
                          >
                            <span>Read</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onRemoveBookmark(b.id)}
                            className="p-1 opacity-60 hover:opacity-100 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remove bookmark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        <p className="text-xs sm:text-sm leading-relaxed font-medium">
                          {b.textEn}
                        </p>
                        <p className="text-xs opacity-80 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 pt-1">
                          {b.textZh}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] opacity-70">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3" />
                          {b.categoryTag ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-medium">
                              {b.categoryTag}
                            </span>
                          ) : (
                            <select
                              value={b.categoryTag || ''}
                              onChange={(e) => onUpdateBookmarkTag?.(b.id, e.target.value)}
                              className="bg-transparent text-[10px] cursor-pointer"
                            >
                              <option value="">+ Add Tag</option>
                              {DEFAULT_TAGS.filter((t) => t !== 'All').map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'highlights' && (
            <>
              {highlightEntries.length === 0 ? (
                <div className="text-center py-16 opacity-50 text-xs sm:text-sm">
                  <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No highlights yet</p>
                </div>
              ) : (
                highlightEntries.map(([vKey]) => {
                  const info = parseVerseKey(vKey);
                  return (
                    <div
                      key={vKey}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="font-semibold text-xs">
                          {info.bookNameEn} {info.chapter}:{info.verseNumber} ({info.bookNameZh})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onJumpToVerse(info.bookId, info.chapter, info.verseNumber);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-semibold text-slate-900 dark:text-slate-100"
                        >
                          Read
                        </button>
                        <button
                          onClick={() => onRemoveHighlight(vKey)}
                          className="p-1 opacity-60 hover:opacity-100 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'notes' && (
            <>
              {noteEntries.length === 0 ? (
                <div className="text-center py-16 opacity-50 text-xs sm:text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No study notes yet</p>
                </div>
              ) : (
                noteEntries.map(([vKey, noteText]) => {
                  const info = parseVerseKey(vKey);
                  return (
                    <div
                      key={vKey}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700/60 text-xs">
                        <span className="font-bold">
                          {info.bookNameEn} {info.chapter}:{info.verseNumber} ({info.bookNameZh})
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onJumpToVerse(info.bookId, info.chapter, info.verseNumber);
                              onClose();
                            }}
                            className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRemoveNote(vKey)}
                            className="p-1 opacity-60 hover:opacity-100 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs mt-2 whitespace-pre-wrap">
                        {noteText}
                      </p>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
