/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BibleHeader } from './components/BibleHeader';
import { SplitReaderView } from './components/SplitReaderView';
import { InterlinearReaderView } from './components/InterlinearReaderView';
import { SingleReaderView } from './components/SingleReaderView';
import { VerseActionToolbar } from './components/VerseActionToolbar';
import { CharacterInspectorModal } from './components/CharacterInspectorModal';
import { BookPickerModal } from './components/BookPickerModal';
import { ReaderSettingsModal } from './components/ReaderSettingsModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { VerseCardModal } from './components/VerseCardModal';
import { SearchModal } from './components/SearchModal';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { CustomPassageModal } from './components/CustomPassageModal';
import { ChapterNavFooter } from './components/ChapterNavFooter';
import { NoteModal } from './components/NoteModal';
import { VersionPickerModal } from './components/VersionPickerModal';
import { X } from 'lucide-react';

import { BIBLE_BOOKS, getBookById, TRANSLATIONS } from './data/bibleBooks';
import { fetchChapter } from './services/bibleService';
import { speechService } from './services/speechService';
import {
  ChapterContent,
  VerseItem,
  TranslationId,
  ReadingMode,
  PinyinDisplayMode,
  PinyinSize,
  AppTheme,
  HighlightColor,
  UserBookmark,
} from './types/bible';
import { getVerseTextForTranslation } from './data/curatedChapters';

const STORAGE_KEY_BOOKMARKS = 'pinyin_bible_bookmarks_v2';
const STORAGE_KEY_HIGHLIGHTS = 'pinyin_bible_highlights_v2';
const STORAGE_KEY_NOTES = 'pinyin_bible_notes_v2';
const STORAGE_KEY_PREFS = 'pinyin_bible_prefs_v2';
export const STORAGE_KEY_LAST_READ = 'pinyin_bible_last_read_v2';

export interface LastReadLocation {
  bookId: string;
  chapter: number;
  verseNumber: number;
  timestamp: number;
}

export const getStoredLastRead = (): LastReadLocation | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_READ);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.bookId === 'string' && typeof parsed.chapter === 'number') {
      const bookExists = BIBLE_BOOKS.some((b) => b.id === parsed.bookId);
      if (bookExists) {
        return {
          bookId: parsed.bookId,
          chapter: Math.max(1, parsed.chapter),
          verseNumber: typeof parsed.verseNumber === 'number' && parsed.verseNumber > 0 ? parsed.verseNumber : 1,
          timestamp: parsed.timestamp || Date.now(),
        };
      }
    }
  } catch {}
  return null;
};

export default function App() {
  // Device-specific last read state
  const initialLastRead = useMemo(() => getStoredLastRead(), []);

  // Current Book & Chapter: restored from device's last left off position
  const [currentBookId, setCurrentBookId] = useState<string>(() => {
    return initialLastRead?.bookId || 'GEN';
  });
  const [currentChapter, setCurrentChapter] = useState<number>(() => {
    return initialLastRead?.chapter || 1;
  });
  const [targetVerseNumber, setTargetVerseNumber] = useState<number | null>(() => {
    return initialLastRead && initialLastRead.verseNumber > 1 ? initialLastRead.verseNumber : null;
  });
  const [resumeToast, setResumeToast] = useState<{
    bookNameZh: string;
    bookNameEn: string;
    chapter: number;
    verseNumber: number;
  } | null>(() => {
    if (initialLastRead && (initialLastRead.bookId !== 'GEN' || initialLastRead.chapter > 1 || initialLastRead.verseNumber > 1)) {
      const b = getBookById(initialLastRead.bookId) || BIBLE_BOOKS[0];
      return {
        bookNameZh: b.nameZh,
        bookNameEn: b.nameEn,
        chapter: initialLastRead.chapter,
        verseNumber: initialLastRead.verseNumber,
      };
    }
    return null;
  });
  const [chapterData, setChapterData] = useState<ChapterContent | null>(null);
  const [isLoadingChapter, setIsLoadingChapter] = useState<boolean>(true);

  // Translations: Default side-by-side NIV and CNVS (Chinese New Version with Pinyin below)
  const [primaryTrans, setPrimaryTrans] = useState<TranslationId>('NIV');
  const [parallelTrans, setParallelTrans] = useState<TranslationId>('CNVS');

  // Reader Preferences: Default 'interlinear' for stacked bilingual view with Hanyu Pinyin underneath
  const [readingMode, setReadingMode] = useState<ReadingMode>('interlinear');
  const [pinyinMode, setPinyinMode] = useState<PinyinDisplayMode>('below');
  const [pinyinSize, setPinyinSize] = useState<PinyinSize>('base');
  const [colorTones, setColorTones] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(16);
  const [theme, setTheme] = useState<AppTheme>('light');
  const [redLetter, setRedLetter] = useState<boolean>(true);

  // Interactive Selections
  const [activeVerse, setActiveVerse] = useState<VerseItem | null>(null);
  const [inspectingChar, setInspectingChar] = useState<{ char: string; pinyin: string; tone: number } | null>(null);
  const [editingNoteVerse, setEditingNoteVerse] = useState<VerseItem | null>(null);

  // Modals & Drawers
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
  const [isVersionPickerOpen, setIsVersionPickerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isCustomPassageOpen, setIsCustomPassageOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // User Stored Data
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [highlights, setHighlights] = useState<Record<string, HighlightColor>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [userNotes, setUserNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioVerseIndex, setAudioVerseIndex] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [autoAdvanceAudio, setAutoAdvanceAudio] = useState<boolean>(true);
  const [audioLanguage, setAudioLanguage] = useState<'zh' | 'en' | 'bilingual'>('zh');

  // Subtle chapter reading progress at top of viewport
  const [readProgress, setReadProgress] = useState<number>(0);

  // Helper to persist current reading location on this device
  const saveDeviceReadingPosition = useCallback(
    (verseNum: number) => {
      try {
        const data: LastReadLocation = {
          bookId: currentBookId,
          chapter: currentChapter,
          verseNumber: Math.max(1, verseNum),
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY_LAST_READ, JSON.stringify(data));
      } catch {}
    },
    [currentBookId, currentChapter]
  );

  useEffect(() => {
    let saveTimer: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight > 0) {
        const progress = Math.min(Math.max((scrollTop / scrollHeight) * 100, 0), 100);
        setReadProgress(progress);
      } else {
        setReadProgress(0);
      }

      // Debounce saving top-most visible verse on this device
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const verseElements = document.querySelectorAll('[id^="verse-"]');
        let visibleVerse = 1;
        for (const el of verseElements) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180 && rect.bottom >= 70) {
            const num = parseInt(el.id.replace('verse-', ''), 10);
            if (!isNaN(num) && num > 0) {
              visibleVerse = num;
              break;
            }
          }
        }
        saveDeviceReadingPosition(visibleVerse);
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (saveTimer) clearTimeout(saveTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentBookId, currentChapter, readingMode, chapterData, saveDeviceReadingPosition]);

  // Ensure last read position is saved before leaving the page on this device
  useEffect(() => {
    const handleSaveOnExit = () => {
      const verseElements = document.querySelectorAll('[id^="verse-"]');
      let visibleVerse = 1;
      for (const el of verseElements) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom >= 60) {
          const num = parseInt(el.id.replace('verse-', ''), 10);
          if (!isNaN(num) && num > 0) {
            visibleVerse = num;
            break;
          }
        }
      }
      try {
        localStorage.setItem(
          STORAGE_KEY_LAST_READ,
          JSON.stringify({
            bookId: currentBookId,
            chapter: currentChapter,
            verseNumber: visibleVerse,
            timestamp: Date.now(),
          })
        );
      } catch {}
    };

    window.addEventListener('beforeunload', handleSaveOnExit);
    window.addEventListener('pagehide', handleSaveOnExit);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSaveOnExit();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleSaveOnExit);
      window.removeEventListener('pagehide', handleSaveOnExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentBookId, currentChapter]);

  // Auto-dismiss resume toast
  useEffect(() => {
    if (resumeToast) {
      const t = setTimeout(() => {
        setResumeToast(null);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [resumeToast]);

  // Load User Preferences from localStorage
  useEffect(() => {
    try {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      if (saved) {
        const p = JSON.parse(saved);
        if (isMobile) {
          setReadingMode('interlinear');
        } else if (p.readingMode) {
          setReadingMode(p.readingMode);
        }
        if (p.pinyinMode) setPinyinMode(p.pinyinMode);
        if (p.pinyinSize) setPinyinSize(p.pinyinSize);
        if (p.colorTones !== undefined) setColorTones(p.colorTones);
        if (p.fontSize) setFontSize(p.fontSize);
        else setFontSize(16);
        if (p.theme) setTheme(p.theme);
        if (p.redLetter !== undefined) setRedLetter(p.redLetter);
        if (p.primaryTrans) setPrimaryTrans(p.primaryTrans);
        if (p.parallelTrans) setParallelTrans(p.parallelTrans);
        if (p.audioLanguage) setAudioLanguage(p.audioLanguage);
      } else {
        setReadingMode('interlinear');
        setFontSize(16);
      }
    } catch {
      // Ignore fallback
    }
  }, []);

  // Save Preferences
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_PREFS,
        JSON.stringify({
          readingMode,
          pinyinMode,
          pinyinSize,
          colorTones,
          fontSize,
          theme,
          redLetter,
          primaryTrans,
          parallelTrans,
          audioLanguage,
        })
      );
    } catch {
      // Ignore
    }
  }, [readingMode, pinyinMode, pinyinSize, colorTones, fontSize, theme, redLetter, primaryTrans, parallelTrans, audioLanguage]);

  // Persist Bookmarks
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
    } catch {
      // Ignore
    }
  }, [bookmarks]);

  // Persist Highlights
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HIGHLIGHTS, JSON.stringify(highlights));
    } catch {
      // Ignore
    }
  }, [highlights]);

  // Persist Notes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(userNotes));
    } catch {
      // Ignore
    }
  }, [userNotes]);

  // Sync theme to root HTML and body for Tailwind class-based dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark', 'theme-dark');
      root.classList.remove('theme-light');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark', 'theme-dark');
      root.classList.add('theme-light');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const scrollToVerse = useCallback((verseNum: number, behavior: ScrollBehavior = 'smooth') => {
    const tryScroll = (attemptsLeft: number) => {
      const el = document.getElementById(`verse-${verseNum}`);
      if (el) {
        el.scrollIntoView({ behavior, block: 'start' });
      } else if (attemptsLeft > 0) {
        setTimeout(() => tryScroll(attemptsLeft - 1), 100);
      }
    };
    setTimeout(() => tryScroll(4), 100);
  }, []);

  // Fetch chapter data when book or chapter changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingChapter(true);
    setActiveVerse(null);
    speechService.stop();
    setIsPlayingAudio(false);

    fetchChapter(currentBookId, currentChapter).then((data) => {
      if (!isCancelled) {
        setChapterData(data);
        setIsLoadingChapter(false);
        if (targetVerseNumber) {
          const matchVerse = data.verses.find((v) => v.number === targetVerseNumber);
          if (matchVerse) {
            setActiveVerse(matchVerse);
          }
          scrollToVerse(targetVerseNumber);
          setTargetVerseNumber(null);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentBookId, currentChapter, targetVerseNumber, scrollToVerse]);

  const currentBook = useMemo(() => {
    return getBookById(currentBookId) || BIBLE_BOOKS[0];
  }, [currentBookId]);

  const bookmarkedVerseKeys = useMemo(() => {
    return new Set(bookmarks.map((b) => b.verseKey));
  }, [bookmarks]);

  // Handle Select Verse: highlight and immediately save reading position on this device
  const handleSelectVerse = useCallback(
    (verse: VerseItem) => {
      setActiveVerse(verse);
      saveDeviceReadingPosition(verse.number);
    },
    [saveDeviceReadingPosition]
  );

  // Handle Book, Chapter, and Verse Jump
  const handleSelectBookChapter = (bookId: string, chapter: number, verseNumber?: number) => {
    if (currentBookId === bookId && currentChapter === chapter) {
      if (verseNumber && chapterData) {
        const found = chapterData.verses.find((v) => v.number === verseNumber);
        if (found) {
          setActiveVerse(found);
          scrollToVerse(verseNumber);
          saveDeviceReadingPosition(verseNumber);
        }
      }
      return;
    }

    setCurrentBookId(bookId);
    setCurrentChapter(chapter);
    if (verseNumber && verseNumber > 1) {
      setTargetVerseNumber(verseNumber);
    } else {
      setTargetVerseNumber(null);
    }
    saveDeviceReadingPosition(verseNumber || 1);
  };

  const handleSelectVersion = useCallback((transId: TranslationId) => {
    const meta = TRANSLATIONS[transId];
    if (meta.lang === 'zh') {
      if (primaryTrans === 'CNVS') {
        setPrimaryTrans(transId);
      } else {
        setParallelTrans(transId);
      }
    } else {
      setPrimaryTrans(transId);
    }
  }, [primaryTrans]);

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      const prevCh = currentChapter - 1;
      setCurrentChapter(prevCh);
      setTargetVerseNumber(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      saveDeviceReadingPosition(1);
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < currentBook.chaptersCount) {
      const nextCh = currentChapter + 1;
      setCurrentChapter(nextCh);
      setTargetVerseNumber(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      saveDeviceReadingPosition(1);
    }
  };

  // Swap Left and Right Translations
  const handleSwapTranslations = () => {
    setPrimaryTrans(parallelTrans);
    setParallelTrans(primaryTrans);
  };

  // Toggle Bookmark for Active Verse
  const handleToggleBookmark = useCallback(() => {
    if (!activeVerse) return;
    const verseKey = `${currentBookId}.${currentChapter}.${activeVerse.number}`;

    setBookmarks((prev) => {
      const exists = prev.find((b) => b.verseKey === verseKey);
      if (exists) {
        return prev.filter((b) => b.verseKey !== verseKey);
      } else {
        const textZh = getVerseTextForTranslation(activeVerse, 'CNVS');
        const textEn = getVerseTextForTranslation(activeVerse, 'NIV');

        const newBookmark: UserBookmark = {
          id: `${Date.now()}_${verseKey}`,
          verseKey,
          bookId: currentBookId,
          chapter: currentChapter,
          verseNumber: activeVerse.number,
          textZh,
          textEn,
          translation1: primaryTrans,
          translation2: parallelTrans,
          categoryTag: 'Favorites',
          createdAt: Date.now(),
        };
        return [newBookmark, ...prev];
      }
    });
  }, [activeVerse, currentBookId, currentChapter, primaryTrans, parallelTrans]);

  // Toggle Bookmark directly from verse badge
  const handleToggleBookmarkForVerse = useCallback((verse: VerseItem) => {
    const verseKey = `${currentBookId}.${currentChapter}.${verse.number}`;

    setBookmarks((prev) => {
      const exists = prev.find((b) => b.verseKey === verseKey);
      if (exists) {
        return prev.filter((b) => b.verseKey !== verseKey);
      } else {
        const textZh = getVerseTextForTranslation(verse, 'CNVS');
        const textEn = getVerseTextForTranslation(verse, 'NIV');

        const newBookmark: UserBookmark = {
          id: `${Date.now()}_${verseKey}`,
          verseKey,
          bookId: currentBookId,
          chapter: currentChapter,
          verseNumber: verse.number,
          textZh,
          textEn,
          translation1: primaryTrans,
          translation2: parallelTrans,
          categoryTag: 'Favorites',
          createdAt: Date.now(),
        };
        return [newBookmark, ...prev];
      }
    });
  }, [currentBookId, currentChapter, primaryTrans, parallelTrans]);

  // Update Bookmark Tag
  const handleUpdateBookmarkTag = (id: string, tag: string) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, categoryTag: tag } : b))
    );
  };

  // Set Highlight Color for Active Verse
  const handleSetHighlight = useCallback(
    (color: HighlightColor | null) => {
      if (!activeVerse) return;
      const verseKey = `${currentBookId}.${currentChapter}.${activeVerse.number}`;

      setHighlights((prev) => {
        const next = { ...prev };
        if (color === null) {
          delete next[verseKey];
        } else {
          next[verseKey] = color;
        }
        return next;
      });
    },
    [activeVerse, currentBookId, currentChapter]
  );

  // Audio Playback handler
  const playVerseAtIndex = useCallback(
    (index: number, langOverride?: 'zh' | 'en' | 'bilingual') => {
      if (!chapterData || !chapterData.verses[index]) {
        setIsPlayingAudio(false);
        return;
      }

      setAudioVerseIndex(index);
      const targetVerse = chapterData.verses[index];
      const lang = langOverride || audioLanguage;

      const onVerseFinished = () => {
        if (autoAdvanceAudio && index + 1 < chapterData.verses.length) {
          playVerseAtIndex(index + 1, lang);
        } else {
          setIsPlayingAudio(false);
        }
      };

      if (lang === 'zh') {
        speechService.speak(targetVerse.textZh, 'zh', speechRate, onVerseFinished);
      } else if (lang === 'en') {
        const textEn = targetVerse.textEn || getVerseTextForTranslation(targetVerse, 'NIV');
        speechService.speak(textEn, 'en', speechRate, onVerseFinished);
      } else {
        const textEn = targetVerse.textEn || getVerseTextForTranslation(targetVerse, 'NIV');
        speechService.speakBilingual(targetVerse.textZh, textEn, speechRate, onVerseFinished);
      }
    },
    [chapterData, audioLanguage, speechRate, autoAdvanceAudio]
  );

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playVerseAtIndex(audioVerseIndex);
    }
  };

  const handleChangeAudioLanguage = (lang: 'zh' | 'en' | 'bilingual') => {
    setAudioLanguage(lang);
    if (isPlayingAudio) {
      speechService.stop();
      playVerseAtIndex(audioVerseIndex, lang);
    }
  };

  const handleAudioPrevVerse = () => {
    if (audioVerseIndex > 0) {
      playVerseAtIndex(audioVerseIndex - 1);
    }
  };

  const handleAudioNextVerse = () => {
    if (chapterData && audioVerseIndex < chapterData.verses.length - 1) {
      playVerseAtIndex(audioVerseIndex + 1);
    }
  };

  const handleStopAudio = () => {
    speechService.stop();
    setIsPlayingAudio(false);
  };

  // Cycle Pinyin Mode
  const handleCyclePinyinMode = () => {
    setPinyinMode((prev) => {
      if (prev === 'below') return 'inline';
      if (prev === 'inline') return 'above';
      if (prev === 'above') return 'off';
      return 'below';
    });
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeVerseKey = activeVerse
    ? `${currentBookId}.${currentChapter}.${activeVerse.number}`
    : '';

  return (
    <div className={`min-h-screen theme-${theme} ${theme === 'dark' ? 'dark' : ''} transition-colors flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
      {/* Subtle Progress Bar at top of viewport visualizing read position within active chapter */}
      <div
        className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-slate-200/40 dark:bg-slate-800/40"
        aria-hidden="true"
      >
        <div
          className="h-full bg-[#C20009] dark:bg-[#e02e38] transition-[width] duration-100 ease-out shadow-xs"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Top Navbar */}
      <BibleHeader
        currentBook={currentBook}
        currentChapter={currentChapter}
        primaryTrans={primaryTrans}
        parallelTrans={parallelTrans}
        readingMode={readingMode}
        pinyinMode={pinyinMode}
        theme={theme}
        bookmarkCount={bookmarks.length}
        isPlayingAudio={isPlayingAudio}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        onOpenBookPicker={() => setIsBookPickerOpen(true)}
        onOpenVersionPicker={() => setIsVersionPickerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenCustomPassage={() => setIsCustomPassageOpen(true)}
        onToggleAudio={handleToggleAudio}
        onChangeReadingMode={setReadingMode}
        onCyclePinyinMode={handleCyclePinyinMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Resume from last read on this device notification */}
      {resumeToast && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-3 fade-in duration-300 max-w-sm w-[92%] sm:w-auto font-sans pointer-events-auto">
          <div className="flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl shadow-xl border backdrop-blur-md text-xs bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">
                Resumed on this device: <strong className="font-semibold">{resumeToast.bookNameEn} ({resumeToast.bookNameZh}) {resumeToast.chapter}:{resumeToast.verseNumber}</strong>
              </span>
            </div>
            <button
              onClick={() => setResumeToast(null)}
              className="p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Chapter Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-3 sm:pt-6 pb-20 sm:pb-8">
        {/* Chapter Title matching Image 1 */}
        <div className="text-center pt-2 sm:pt-4 pb-2 mb-4 font-sans">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {currentBook.nameEn}
          </h1>
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5" />
        </div>

        {/* Loading State or Reader View */}
        {isLoadingChapter || !chapterData ? (
          <div className="text-center py-24 space-y-3 font-sans">
            <div className="w-8 h-8 border-3 border-slate-900 dark:border-slate-100 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm opacity-70">
              Loading scripture text with Hanyu Pinyin annotations...
            </p>
          </div>
        ) : (
          <>
            {readingMode === 'split' && (
              <SplitReaderView
                chapterData={chapterData}
                primaryTrans={primaryTrans}
                parallelTrans={parallelTrans}
                pinyinMode={pinyinMode}
                pinyinSize={pinyinSize}
                colorTones={colorTones}
                fontSize={fontSize}
                theme={theme}
                redLetter={redLetter}
                activeVerseNumber={activeVerse?.number || null}
                speakingVerseNumber={isPlayingAudio ? chapterData.verses[audioVerseIndex]?.number || null : null}
                highlights={highlights}
                bookmarkedVerses={bookmarkedVerseKeys}
                userNotes={userNotes}
                onSelectVerse={handleSelectVerse}
                onCharClick={(char, pinyin, tone) => setInspectingChar({ char, pinyin, tone })}
                onPrimaryTransChange={setPrimaryTrans}
                onParallelTransChange={setParallelTrans}
                onSwapTranslations={handleSwapTranslations}
                onToggleBookmark={handleToggleBookmarkForVerse}
              />
            )}

            {readingMode === 'interlinear' && (
              <InterlinearReaderView
                chapterData={chapterData}
                primaryTrans={primaryTrans}
                parallelTrans={parallelTrans}
                pinyinMode={pinyinMode}
                pinyinSize={pinyinSize}
                colorTones={colorTones}
                fontSize={fontSize}
                theme={theme}
                redLetter={redLetter}
                activeVerseNumber={activeVerse?.number || null}
                speakingVerseNumber={isPlayingAudio ? chapterData.verses[audioVerseIndex]?.number || null : null}
                highlights={highlights}
                bookmarkedVerses={bookmarkedVerseKeys}
                userNotes={userNotes}
                onSelectVerse={handleSelectVerse}
                onCharClick={(char, pinyin, tone) => setInspectingChar({ char, pinyin, tone })}
                onToggleBookmark={handleToggleBookmarkForVerse}
              />
            )}

            {readingMode === 'single' && (
              <SingleReaderView
                chapterData={chapterData}
                primaryTrans={primaryTrans}
                pinyinMode={pinyinMode}
                pinyinSize={pinyinSize}
                colorTones={colorTones}
                fontSize={fontSize}
                theme={theme}
                redLetter={redLetter}
                activeVerseNumber={activeVerse?.number || null}
                speakingVerseNumber={isPlayingAudio ? chapterData.verses[audioVerseIndex]?.number || null : null}
                highlights={highlights}
                bookmarkedVerses={bookmarkedVerseKeys}
                userNotes={userNotes}
                onSelectVerse={handleSelectVerse}
                onCharClick={(char, pinyin, tone) => setInspectingChar({ char, pinyin, tone })}
                onToggleBookmark={handleToggleBookmarkForVerse}
              />
            )}
          </>
        )}

        {/* Chapter Navigation Footer */}
        {!isLoadingChapter && (
          <ChapterNavFooter
            currentBook={currentBook}
            currentChapter={currentChapter}
            theme={theme}
            isPlayingAudio={isPlayingAudio}
            onToggleAudio={handleToggleAudio}
            onPrevChapter={handlePrevChapter}
            onNextChapter={handleNextChapter}
            onOpenBookPicker={() => setIsBookPickerOpen(true)}
          />
        )}
      </main>

      {/* Floating Verse Action Toolbar */}
      {activeVerse && (
        <VerseActionToolbar
          verse={activeVerse}
          bookNameZh={currentBook.nameZh}
          bookNameEn={currentBook.nameEn}
          chapter={currentChapter}
          isBookmarked={bookmarkedVerseKeys.has(activeVerseKey)}
          highlightColor={highlights[activeVerseKey]}
          theme={theme}
          onToggleBookmark={handleToggleBookmark}
          onSetHighlight={handleSetHighlight}
          onOpenNote={() => setEditingNoteVerse(activeVerse)}
          onOpenCardModal={() => setIsCardModalOpen(true)}
          onClose={() => setActiveVerse(null)}
        />
      )}

      {/* Floating Audio Bar */}
      {isPlayingAudio && chapterData && (
        <AudioPlayerBar
          isPlaying={isPlayingAudio}
          currentVerseNum={chapterData.verses[audioVerseIndex]?.number || 1}
          totalVerses={chapterData.verses.length}
          speechRate={speechRate}
          autoAdvance={autoAdvanceAudio}
          audioLanguage={audioLanguage}
          theme={theme}
          bookNameZh={currentBook.nameZh}
          bookNameEn={currentBook.nameEn}
          chapter={currentChapter}
          onPlayPause={handleToggleAudio}
          onStop={handleStopAudio}
          onPrevVerse={handleAudioPrevVerse}
          onNextVerse={handleAudioNextVerse}
          onChangeRate={setSpeechRate}
          onChangeLanguage={handleChangeAudioLanguage}
          onToggleAutoAdvance={() => setAutoAdvanceAudio(!autoAdvanceAudio)}
          onClose={handleStopAudio}
        />
      )}

      {/* Character Inspector Modal */}
      <CharacterInspectorModal
        charData={inspectingChar}
        onClose={() => setInspectingChar(null)}
        theme={theme}
      />

      {/* Book & Chapter Picker Modal */}
      <BookPickerModal
        currentBookId={currentBookId}
        currentChapter={currentChapter}
        isOpen={isBookPickerOpen}
        theme={theme}
        onClose={() => setIsBookPickerOpen(false)}
        onSelect={handleSelectBookChapter}
      />

      {/* Version Picker Modal matching Image 2 */}
      <VersionPickerModal
        isOpen={isVersionPickerOpen}
        onClose={() => setIsVersionPickerOpen(false)}
        currentPrimaryTrans={primaryTrans}
        currentParallelTrans={parallelTrans}
        theme={theme}
        onSelectVersion={handleSelectVersion}
      />

      {/* Reader Settings Modal */}
      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        pinyinMode={pinyinMode}
        setPinyinMode={setPinyinMode}
        pinyinSize={pinyinSize}
        setPinyinSize={setPinyinSize}
        colorTones={colorTones}
        setColorTones={setColorTones}
        fontSize={fontSize}
        setFontSize={setFontSize}
        theme={theme}
        setTheme={setTheme}
        readingMode={readingMode}
        setReadingMode={setReadingMode}
        redLetter={redLetter}
        setRedLetter={setRedLetter}
        audioLanguage={audioLanguage}
        setAudioLanguage={handleChangeAudioLanguage}
      />

      {/* Scripture Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        theme={theme}
        onClose={() => setIsSearchOpen(false)}
        onJumpToVerse={handleSelectBookChapter}
      />

      {/* Bookmarks & Library Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        theme={theme}
        bookmarks={bookmarks}
        highlights={highlights}
        userNotes={userNotes}
        onClose={() => setIsBookmarksOpen(false)}
        onJumpToVerse={handleSelectBookChapter}
        onRemoveBookmark={(id) => setBookmarks((prev) => prev.filter((b) => b.id !== id))}
        onRemoveHighlight={(key) =>
          setHighlights((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          })
        }
        onRemoveNote={(key) =>
          setUserNotes((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          })
        }
        onUpdateBookmarkTag={handleUpdateBookmarkTag}
      />

      {/* Note Editing Modal */}
      <NoteModal
        verse={editingNoteVerse}
        bookNameZh={currentBook.nameZh}
        bookNameEn={currentBook.nameEn}
        chapter={currentChapter}
        initialNote={editingNoteVerse ? userNotes[`${currentBookId}.${currentChapter}.${editingNoteVerse.number}`] || '' : ''}
        isOpen={Boolean(editingNoteVerse)}
        theme={theme}
        onClose={() => setEditingNoteVerse(null)}
        onSave={(noteText) => {
          if (!editingNoteVerse) return;
          const key = `${currentBookId}.${currentChapter}.${editingNoteVerse.number}`;
          setUserNotes((prev) => {
            const next = { ...prev };
            if (noteText) next[key] = noteText;
            else delete next[key];
            return next;
          });
        }}
      />

      {/* Scripture Card Modal */}
      <VerseCardModal
        verse={activeVerse}
        bookNameZh={currentBook.nameZh}
        bookNameEn={currentBook.nameEn}
        chapter={currentChapter}
        isOpen={isCardModalOpen}
        theme={theme}
        onClose={() => setIsCardModalOpen(false)}
      />

      {/* Custom Passage Annotator Modal */}
      <CustomPassageModal
        isOpen={isCustomPassageOpen}
        theme={theme}
        pinyinMode={pinyinMode}
        pinyinSize={pinyinSize}
        colorTones={colorTones}
        onClose={() => setIsCustomPassageOpen(false)}
        onCharClick={(char, pinyin, tone) => setInspectingChar({ char, pinyin, tone })}
      />
    </div>
  );
}
