import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
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
  onClose,
  onSelect,
}) => {
  const [step, setStep] = useState<'books' | 'chapters' | 'intro'>('books');
  const [selectedBook, setSelectedBook] = useState<BibleBook>(() => {
    return getBookById(currentBookId) || BIBLE_BOOKS[0];
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Reset to Books list step when opened
  useEffect(() => {
    if (isOpen) {
      const book = getBookById(currentBookId) || BIBLE_BOOKS[0];
      setSelectedBook(book);
      setStep('books');
      setSearchQuery('');
    }
  }, [isOpen, currentBookId]);

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

  const oldTestamentBooks = useMemo(
    () => filteredBooks.filter((b) => b.testament === 'OT'),
    [filteredBooks]
  );
  const newTestamentBooks = useMemo(
    () => filteredBooks.filter((b) => b.testament === 'NT'),
    [filteredBooks]
  );

  if (!isOpen) return null;

  const handleBookTap = (book: BibleBook) => {
    setSelectedBook(book);
    setStep('chapters');
  };

  const handleSelectChapter = (ch: number) => {
    onSelect(selectedBook.id, ch, 1);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md h-[92vh] sm:h-[82vh] max-h-[780px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step 1: Books List (matching Image 2) */}
        {step === 'books' && (
          <>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold tracking-tight">Books</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clean Search Input */}
            <div className="px-4 pb-2 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books or Pinyin..."
                  className="w-full text-sm bg-transparent border-none outline-hidden placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Optional Quick Resume Banner */}
            {lastReadLocation && !searchQuery && (
              <div className="px-4 pb-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(
                      lastReadLocation.book.id,
                      lastReadLocation.chapter,
                      lastReadLocation.verseNumber
                    );
                    onClose();
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="text-slate-500 dark:text-slate-400">
                    Continue:{' '}
                    <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                      {lastReadLocation.book.nameEn} {lastReadLocation.chapter}:
                      {lastReadLocation.verseNumber}
                    </strong>
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
                    Resume
                  </span>
                </button>
              </div>
            )}

            {/* Vertical Book List */}
            <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-4">
              {oldTestamentBooks.length > 0 && (
                <div>
                  <div className="px-2.5 py-2 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase select-none">
                    OLD TESTAMENT
                  </div>
                  <div className="space-y-0.5">
                    {oldTestamentBooks.map((book) => {
                      const isCurrent = book.id === currentBookId;
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => handleBookTap(book)}
                          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[15px] text-left transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                              : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                          }`}
                        >
                          <span className="truncate">{book.nameEn}</span>
                          <span
                            className={`text-xs ml-3 shrink-0 ${
                              isCurrent
                                ? 'text-white/75 dark:text-black/75'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {book.nameZh}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {newTestamentBooks.length > 0 && (
                <div>
                  <div className="px-2.5 py-2 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase select-none">
                    NEW TESTAMENT
                  </div>
                  <div className="space-y-0.5">
                    {newTestamentBooks.map((book) => {
                      const isCurrent = book.id === currentBookId;
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => handleBookTap(book)}
                          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[15px] text-left transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                              : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                          }`}
                        >
                          <span className="truncate">{book.nameEn}</span>
                          <span
                            className={`text-xs ml-3 shrink-0 ${
                              isCurrent
                                ? 'text-white/75 dark:text-black/75'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {book.nameZh}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredBooks.length === 0 && (
                <div className="text-center py-12 text-sm text-slate-400">
                  No matching books found.
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 2: Chapters Grid (matching Image 3: ← Genesis + 6-col [Intro] [1] [2]...) */}
        {step === 'chapters' && (
          <>
            <div className="px-4 pt-5 pb-3 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setStep('books')}
                className="flex items-center gap-2.5 text-left hover:opacity-75 transition-opacity cursor-pointer min-w-0"
                title="Back to Books"
              >
                <ArrowLeft className="w-5 h-5 shrink-0" />
                <span className="text-xl font-bold tracking-tight truncate">
                  {selectedBook.nameEn}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">
                  {selectedBook.nameZh}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-1 pb-6">
              <div className="grid grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => setStep('intro')}
                  className="h-12 rounded-xl bg-[#F0EFEF] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer"
                >
                  Intro
                </button>

                {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((ch) => {
                  const isCurrent = ch === currentChapter && selectedBook.id === currentBookId;
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => handleSelectChapter(ch)}
                      className={`h-12 rounded-xl flex items-center justify-center text-sm font-semibold tabular-nums transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                          : 'bg-[#F0EFEF] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Optional Book Intro Overview triggered by 'Intro' tile */}
        {step === 'intro' && (
          <>
            <div className="px-4 pt-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setStep('chapters')}
                className="flex items-center gap-2.5 text-left hover:opacity-75 transition-opacity cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 shrink-0" />
                <span className="text-xl font-bold tracking-tight">
                  {selectedBook.nameEn} Intro
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100">
                  {selectedBook.nameEn}
                </h3>
                <p className="text-base font-medium text-slate-700 dark:text-slate-300 mt-1">
                  {selectedBook.nameZh} ({selectedBook.nameZhTrad})
                  {selectedBook.namePinyin ? ` · ${selectedBook.namePinyin}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-2xl bg-[#F5F4F4] dark:bg-slate-800/80">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Testament</div>
                  <div className="font-semibold mt-0.5">
                    {selectedBook.testament === 'OT' ? 'Old Testament' : 'New Testament'}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F5F4F4] dark:bg-slate-800/80">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Chapters</div>
                  <div className="font-semibold mt-0.5 tabular-nums">
                    {selectedBook.chaptersCount}
                  </div>
                </div>
                <div className="col-span-2 p-3.5 rounded-2xl bg-[#F5F4F4] dark:bg-slate-800/80">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Section</div>
                  <div className="font-semibold mt-0.5">
                    {selectedBook.categoryNameEn} · {selectedBook.categoryNameZh}
                    {selectedBook.categoryPinyin ? ` (${selectedBook.categoryPinyin})` : ''}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectChapter(1)}
                className="w-full py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                Read {selectedBook.nameEn} 1
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
