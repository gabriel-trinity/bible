import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { BIBLE_BOOKS, getBookById } from '../data/bibleBooks';
import { BibleBook, AppTheme } from '../types/bible';

interface BookPickerModalProps {
  currentBookId: string;
  currentChapter: number;
  isOpen: boolean;
  theme: AppTheme;
  onClose: () => void;
  onSelect: (bookId: string, chapter: number, verseNumber?: number) => void;
}

export const BookPickerModal: React.FC<BookPickerModalProps> = ({
  currentBookId,
  currentChapter,
  isOpen,
  theme,
  onClose,
  onSelect,
}) => {
  const [selectedBook, setSelectedBook] = useState<BibleBook>(() => {
    return getBookById(currentBookId) || BIBLE_BOOKS[0];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const book = getBookById(currentBookId) || BIBLE_BOOKS[0];
      setSelectedBook(book);
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentBookId, currentChapter]);

  // Filter books by search query (supports English, Chinese, and Hanyu Pinyin)
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return BIBLE_BOOKS;
    const q = searchQuery.trim().toLowerCase();
    return BIBLE_BOOKS.filter(
      (b) =>
        b.nameEn.toLowerCase().includes(q) ||
        b.nameZh.toLowerCase().includes(q) ||
        b.nameZhTrad.toLowerCase().includes(q) ||
        (b.namePinyin && b.namePinyin.toLowerCase().includes(q)) ||
        b.abbrEn.toLowerCase().includes(q) ||
        b.abbrZh.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Last left off position on this device
  const lastReadLocation = useMemo(() => {
    if (!isOpen) return null;
    try {
      const raw = localStorage.getItem('pinyin_bible_last_read_v2');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.bookId === 'string' && typeof parsed.chapter === 'number') {
        const b = getBookById(parsed.bookId);
        if (b) {
          return {
            book: b,
            chapter: parsed.chapter,
            verseNumber: parsed.verseNumber || 1,
          };
        }
      }
    } catch {}
    return null;
  }, [isOpen]);

  // Split into Old Testament and New Testament
  const oldTestamentBooks = useMemo(
    () => filteredBooks.filter((b) => b.testament === 'OT'),
    [filteredBooks]
  );
  const newTestamentBooks = useMemo(
    () => filteredBooks.filter((b) => b.testament === 'NT'),
    [filteredBooks]
  );

  if (!isOpen) return null;

  const handleSelectChapter = (ch: number) => {
    onSelect(selectedBook.id, ch, 1);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[85vh] max-h-[680px] rounded-2xl sm:rounded-3xl shadow-2xl flex overflow-hidden border transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Column: Search & Book List */}
        <div className="w-[45%] sm:w-76 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col p-2.5 sm:p-4 bg-slate-50/70 dark:bg-slate-900/60">
          {/* Pill Search Input */}
          <div className="relative mb-2 sm:mb-2.5">
            <div className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-slate-900 dark:focus-within:ring-slate-100 transition-all shadow-2xs">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Books / 拼音"
                className="w-full text-xs sm:text-sm bg-transparent border-none outline-hidden text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Resume on this Device */}
          {lastReadLocation && !searchQuery && (
            <div className="mb-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 shadow-2xs flex items-center justify-between text-left">
              <div className="min-w-0 pr-1.5">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Last on Device
                </div>
                <div className="text-xs font-bold truncate">
                  {lastReadLocation.book.nameEn} {lastReadLocation.book.nameZh} {lastReadLocation.chapter}:{lastReadLocation.verseNumber}
                </div>
              </div>
              <button
                onClick={() => {
                  onSelect(lastReadLocation.book.id, lastReadLocation.chapter, lastReadLocation.verseNumber);
                  onClose();
                }}
                className="px-2 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-[11px] shrink-0 cursor-pointer shadow-xs active:scale-95 transition-transform"
                title="Resume reading where you left off"
              >
                Resume
              </button>
            </div>
          )}

          {/* Book List by Testament */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {/* Old Testament */}
            {oldTestamentBooks.length > 0 && (
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 uppercase px-2 py-1 select-none">
                  OLD TESTAMENT
                </div>
                <div className="space-y-0.5">
                  {oldTestamentBooks.map((book) => {
                    const isSelected = book.id === selectedBook.id;
                    return (
                      <button
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className={`w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-left font-sans transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                            : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium'
                        }`}
                      >
                        <span className="truncate font-medium">{book.nameEn}</span>
                        <div className="flex flex-col items-end shrink-0 ml-1.5 text-right leading-none">
                          <span
                            className={`text-[11px] sm:text-xs font-sans ${
                              isSelected
                                ? 'text-white/95 dark:text-black/95 font-medium'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {book.nameZh}
                          </span>
                          {book.namePinyin && (
                            <span
                              className={`text-[9px] sm:text-[10px] font-sans mt-0.5 tracking-tight ${
                                isSelected
                                  ? 'text-white/70 dark:text-black/70'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {book.namePinyin}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New Testament */}
            {newTestamentBooks.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 uppercase px-2 py-1 select-none">
                  NEW TESTAMENT
                </div>
                <div className="space-y-0.5">
                  {newTestamentBooks.map((book) => {
                    const isSelected = book.id === selectedBook.id;
                    return (
                      <button
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className={`w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-left font-sans transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                            : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium'
                        }`}
                      >
                        <span className="truncate font-medium">{book.nameEn}</span>
                        <div className="flex flex-col items-end shrink-0 ml-1.5 text-right leading-none">
                          <span
                            className={`text-[11px] sm:text-xs font-sans ${
                              isSelected
                                ? 'text-white/95 dark:text-black/95 font-medium'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {book.nameZh}
                          </span>
                          {book.namePinyin && (
                            <span
                              className={`text-[9px] sm:text-[10px] font-sans mt-0.5 tracking-tight ${
                                isSelected
                                  ? 'text-white/70 dark:text-black/70'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {book.namePinyin}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredBooks.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No matching books found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Book Title with Hanyu Pinyin & Chapter Grid */}
        <div className="flex-1 flex flex-col p-3.5 sm:p-6 overflow-hidden bg-white dark:bg-slate-900">
          {/* Header: Book Title & Hanyu Pinyin & Close button */}
          <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-baseline gap-2 sm:gap-2.5 truncate">
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  {selectedBook.nameEn}
                </h2>
                <span className="text-base sm:text-xl font-medium text-slate-700 dark:text-slate-300 font-sans truncate">
                  {selectedBook.nameZh}
                </span>
              </div>
              {selectedBook.namePinyin && (
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans mt-0.5 tracking-wide truncate">
                  {selectedBook.namePinyin}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer shrink-0 mt-0.5"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chapter Selection Grid (6 columns) */}
          <div className="flex-1 overflow-y-auto py-3 sm:py-4 pr-1">
            <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 gap-2 sm:gap-2.5">
              {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((ch) => {
                const isCurrent =
                  ch === currentChapter && selectedBook.id === currentBookId;

                return (
                  <button
                    key={ch}
                    onClick={() => handleSelectChapter(ch)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xs sm:text-base transition-all cursor-pointer font-sans ${
                      isCurrent
                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs scale-102'
                        : 'bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold'
                    }`}
                    title={`${selectedBook.nameEn} Chapter ${ch}`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
