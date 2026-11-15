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
import { VerseOfTheDayView } from './components/VerseOfTheDayView';
import { BottomTabBar, AppTab } from './components/BottomTabBar';
import { X } from 'lucide-react';

import { BIBLE_BOOKS, getBookById, TRANSLATIONS } from './data/bibleBooks';
import { fetchChapter } from './services/bibleService';
import { speechService } from './services/speechService';
import { fetchVerseOfTheDay } from './services/votdService';
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
  VotdData,
  VerseSelectionInfo,
  VerseSnippet,
  ReaderFont,
} from './types/bible';
import { getVerseTextForTranslation } from './data/curatedChapters';

const STORAGE_KEY_BOOKMARKS = 'pinyin_bible_bookmarks_v2';
const STORAGE_KEY_SNIPPETS = 'pinyin_bible_snippets_v1';
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
  const [readerFont, setReaderFont] = useState<ReaderFont>('serif');
  const [showFootnotes, setShowFootnotes] = useState<boolean>(true);
  const [showNumbersAndTitles, setShowNumbersAndTitles] = useState<boolean>(true);
  const [theme, setTheme] = useState<AppTheme>('light');
  const [redLetter, setRedLetter] = useState<boolean>(true);

  // Interactive Selections
  const [activeVerse, setActiveVerse] = useState<VerseItem | null>(null);
  const [verseSelection, setVerseSelection] = useState<VerseSelectionInfo | null>(null);
  const [cardSnippetText, setCardSnippetText] = useState<string | undefined>(undefined);
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

  // Primary Bottom Navigation Tab ('bible' vs 'votd')
  const [activeTab, setActiveTab] = useState<AppTab>('bible');

  // Bible.com Verse of the Day State
  const [votdData, setVotdData] = useState<VotdData | null>(null);
  const [isLoadingVotd, setIsLoadingVotd] = useState<boolean>(true);

  // User Stored Data
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [snippets, setSnippets] = useState<VerseSnippet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SNIPPETS);
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
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioVerseIndex, setAudioVerseIndex] = useState<number>(0);
  const [verseElapsedSec, setVerseElapsedSec] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [autoAdvanceAudio] = useState<boolean>(true);
  const [focusAudioVerse, setFocusAudioVerse] = useState<boolean>(true);
  const [audioLanguage, setAudioLanguage] = useState<'zh' | 'en' | 'bilingual'>('en');

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

  // Fetch Bible.com Verse of the Day on load
  const loadVotd = useCallback((forceRefresh = false) => {
    setIsLoadingVotd(true);
    fetchVerseOfTheDay(forceRefresh)
      .then((data) => {
        setVotdData(data);
      })
      .finally(() => {
        setIsLoadingVotd(false);
      });
  }, []);

  useEffect(() => {
    loadVotd(false);
  }, [loadVotd]);

  const handleChangeTab = useCallback((tab: AppTab) => {
    setActiveTab(tab);
    speechService.stop();
    setIsPlayingAudio(false);
    if (tab === 'votd') {
      setActiveVerse(null);
      setVerseSelection(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

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
        if (p.readerFont) setReaderFont(p.readerFont);
        if (p.showFootnotes !== undefined) setShowFootnotes(p.showFootnotes);
        if (p.showNumbersAndTitles !== undefined) setShowNumbersAndTitles(p.showNumbersAndTitles);
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
          readerFont,
          showFootnotes,
          showNumbersAndTitles,
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
  }, [
    readingMode,
    pinyinMode,
    pinyinSize,
    colorTones,
    fontSize,
    readerFont,
    showFootnotes,
    showNumbersAndTitles,
    theme,
    redLetter,
    primaryTrans,
    parallelTrans,
    audioLanguage,
  ]);

  // Persist Bookmarks
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
    } catch {
      // Ignore
    }
  }, [bookmarks]);

  // Persist Snippets
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SNIPPETS, JSON.stringify(snippets));
    } catch {
      // Ignore
    }
  }, [snippets]);

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
    setVerseSelection(null);
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

  // Handle Select Verse (from tap, drag selection, or long-press): update active toolbar & save reading position
  const handleSelectVerse = useCallback(
    (verse: VerseItem, selection?: VerseSelectionInfo) => {
      setActiveVerse(verse);
      setVerseSelection(selection || null);
      saveDeviceReadingPosition(verse.number);
    },
    [saveDeviceReadingPosition]
  );

  // Save a text snippet excerpt to Snippets library
  const handleSaveSnippet = useCallback(
    (snippetText: string) => {
      if (!activeVerse) return;
      const trimmed = snippetText.trim();
      if (!trimmed) return;
      const verseKey = `${currentBookId}.${currentChapter}.${activeVerse.number}`;
      const snippetLang =
        verseSelection?.lang || (/[\u4e00-\u9fff]/.test(trimmed) ? 'zh' : 'en');
      const translation: TranslationId =
        snippetLang === 'zh'
          ? 'CNVS'
          : primaryTrans === 'CNVS'
          ? parallelTrans
          : primaryTrans;

      setSnippets((prev) => {
        const filtered = prev.filter(
          (s) => !(s.verseKey === verseKey && s.text.trim() === trimmed)
        );
        const newSnippet: VerseSnippet = {
          id: `${Date.now()}_${verseKey}`,
          verseKey,
          bookId: currentBookId,
          chapter: currentChapter,
          verseNumber: activeVerse.number,
          text: trimmed,
          translation,
          createdAt: Date.now(),
        };
        return [newSnippet, ...filtered];
      });
    },
    [activeVerse, currentBookId, currentChapter, primaryTrans, parallelTrans, verseSelection]
  );

  const handleCloseVerseToolbar = useCallback(() => {
    setActiveVerse(null);
    setVerseSelection(null);
    if (typeof window !== 'undefined') {
      window.getSelection()?.removeAllRanges();
    }
  }, []);

  // Handle Book, Chapter, and Verse Jump
  const handleSelectBookChapter = (bookId: string, chapter: number, verseNumber?: number) => {
    setActiveTab('bible');
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

    speechService.stop();
    setIsPlayingAudio(false);
    setAudioVerseIndex(0);
    setVerseElapsedSec(0);
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
      speechService.stop();
      setIsPlayingAudio(false);
      setAudioVerseIndex(0);
      setVerseElapsedSec(0);
      setCurrentChapter(prevCh);
      setTargetVerseNumber(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      saveDeviceReadingPosition(1);
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < currentBook.chaptersCount) {
      const nextCh = currentChapter + 1;
      speechService.stop();
      setIsPlayingAudio(false);
      setAudioVerseIndex(0);
      setVerseElapsedSec(0);
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

  // Toggle Bookmark for arbitrary book/chapter/verse (e.g. Verse of the Day)
  const handleToggleBookmarkByRef = useCallback(
    (bookId: string, chapter: number, verse: VerseItem) => {
      const verseKey = `${bookId}.${chapter}.${verse.number}`;
      setBookmarks((prev) => {
        const exists = prev.find((b) => b.verseKey === verseKey);
        if (exists) {
          return prev.filter((b) => b.verseKey !== verseKey);
        }
        const textZh = getVerseTextForTranslation(verse, 'CNVS');
        const textEn = getVerseTextForTranslation(verse, 'NIV');
        const newBookmark: UserBookmark = {
          id: `${Date.now()}_${verseKey}`,
          verseKey,
          bookId,
          chapter,
          verseNumber: verse.number,
          textZh,
          textEn,
          translation1: primaryTrans,
          translation2: parallelTrans,
          categoryTag: 'Verse of the Day',
          createdAt: Date.now(),
        };
        return [newBookmark, ...prev];
      });
    },
    [primaryTrans, parallelTrans]
  );

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

  // Audio timeline duration estimation per verse
  const audioTimeline = useMemo(() => {
    const verses = chapterData?.verses || [];
    const safeRate = Math.max(0.5, speechRate);
    const durations: number[] = [];
    const startTimes: number[] = [];
    let total = 0;

    for (const v of verses) {
      startTimes.push(total);
      const zhLen = (v.textZh || '').replace(/<[^>]+>/g, '').length;
      const enText = getVerseTextForTranslation(v, primaryTrans === 'CNVS' ? 'NIV' : primaryTrans);
      const enLen = (enText || v.textEn || '').replace(/<[^>]+>/g, '').length;

      let dur = 4;
      if (audioLanguage === 'zh') {
        dur = Math.max(2.5, zhLen / (4.4 * safeRate));
      } else if (audioLanguage === 'en') {
        dur = Math.max(2.5, enLen / (14.5 * safeRate));
      } else {
        dur = Math.max(4, zhLen / (4.4 * safeRate) + enLen / (14.5 * safeRate) + 0.35);
      }
      durations.push(dur);
      total += dur;
    }

    return {
      durations,
      startTimes,
      totalDurationSec: Math.max(1, total),
    };
  }, [chapterData, audioLanguage, speechRate, primaryTrans]);

  // Smooth elapsed progress ticker while playing audio
  useEffect(() => {
    if (!isPlayingAudio) return;
    const verseDur = audioTimeline.durations[audioVerseIndex] || 5;
    const timer = setInterval(() => {
      setVerseElapsedSec((prev) => Math.min(verseDur, prev + 0.25));
    }, 250);
    return () => clearInterval(timer);
  }, [isPlayingAudio, audioVerseIndex, audioTimeline.durations]);

  // Smooth auto-scroll to active verse during read-along audio playback
  useEffect(() => {
    if (!isAudioPlayerOpen || !focusAudioVerse || !isPlayingAudio || !chapterData) return;
    const verseNum = chapterData.verses[audioVerseIndex]?.number;
    if (!verseNum) return;
    const el = document.getElementById(`verse-${verseNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [audioVerseIndex, isAudioPlayerOpen, focusAudioVerse, isPlayingAudio, chapterData]);

  // Audio Playback handler
  const playVerseAtIndex = useCallback(
    (
      index: number,
      langOverride?: 'zh' | 'en' | 'bilingual',
      rateOverride?: number
    ) => {
      if (!chapterData || !chapterData.verses[index]) {
        setIsPlayingAudio(false);
        return;
      }

      setAudioVerseIndex(index);
      setVerseElapsedSec(0);
      const targetVerse = chapterData.verses[index];
      const lang = langOverride || audioLanguage;
      const rate = rateOverride ?? speechRate;
      const enTrans = primaryTrans === 'CNVS' ? 'NIV' : primaryTrans;

      const onVerseFinished = () => {
        if (autoAdvanceAudio && index + 1 < chapterData.verses.length) {
          playVerseAtIndex(index + 1, lang, rate);
        } else {
          setIsPlayingAudio(false);
        }
      };

      if (lang === 'zh') {
        speechService.speak(targetVerse.textZh, 'zh', rate, onVerseFinished);
      } else if (lang === 'en') {
        const textEn = targetVerse.textEn || getVerseTextForTranslation(targetVerse, enTrans);
        speechService.speak(textEn, 'en', rate, onVerseFinished);
      } else {
        const textEn = targetVerse.textEn || getVerseTextForTranslation(targetVerse, enTrans);
        speechService.speakBilingual(targetVerse.textZh, textEn, rate, onVerseFinished);
      }
    },
    [chapterData, audioLanguage, speechRate, autoAdvanceAudio, primaryTrans]
  );

  const handleToggleAudio = () => {
    if (!isAudioPlayerOpen) {
      setIsAudioPlayerOpen(true);
      setIsPlayingAudio(true);
      playVerseAtIndex(audioVerseIndex);
      return;
    }

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

  const handleChangeSpeechRate = (rate: number) => {
    setSpeechRate(rate);
    if (isPlayingAudio) {
      speechService.stop();
      playVerseAtIndex(audioVerseIndex, audioLanguage, rate);
    }
  };

  const handleSeekAudioSeconds = (targetSec: number) => {
    if (!chapterData || chapterData.verses.length === 0) return;
    const clamped = Math.max(0, Math.min(targetSec, audioTimeline.totalDurationSec - 0.1));
    let targetIdx = 0;
    for (let i = 0; i < audioTimeline.startTimes.length; i++) {
      if (audioTimeline.startTimes[i] <= clamped) {
        targetIdx = i;
      } else {
        break;
      }
    }
    const offsetInVerse = Math.max(0, clamped - (audioTimeline.startTimes[targetIdx] || 0));
    setAudioVerseIndex(targetIdx);
    setVerseElapsedSec(offsetInVerse);

    if (isPlayingAudio) {
      speechService.stop();
      playVerseAtIndex(targetIdx);
    }
  };

  const handleSkipAudioSeconds = (deltaSec: number) => {
    const currentTotal =
      (audioTimeline.startTimes[audioVerseIndex] || 0) + verseElapsedSec;
    handleSeekAudioSeconds(currentTotal + deltaSec);
  };

  const handleCloseAudioBar = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    setIsAudioPlayerOpen(false);
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
    <div className={`min-h-screen theme-${theme} ${theme === 'dark' ? 'dark' : ''} transition-colors flex flex-col font-sans bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
      {/* Subtle Progress Bar at top of viewport visualizing read position within active chapter */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none bg-transparent"
        aria-hidden="true"
      >
        <div
          className="h-full bg-[#C20009] dark:bg-[#e02e38] transition-[width] duration-100 ease-out"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Top Navbar matching Image 1 */}
      <BibleHeader
        currentBook={currentBook}
        currentChapter={currentChapter}
        activeTab={activeTab}
        primaryTrans={primaryTrans}
        parallelTrans={parallelTrans}
        readingMode={readingMode}
        pinyinMode={pinyinMode}
        theme={theme}
        bookmarkCount={bookmarks.length}
        isPlayingAudio={isPlayingAudio}
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
      {resumeToast && activeTab === 'bible' && (
        <div className="fixed top-26 sm:top-28 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-3 fade-in duration-300 max-w-sm w-[92%] sm:w-auto font-sans pointer-events-auto">
          <div className="flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl shadow-lg border backdrop-blur-md text-xs bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800">
            <span className="truncate">
              Resumed: <strong className="font-semibold">{resumeToast.bookNameEn} ({resumeToast.bookNameZh}) {resumeToast.chapter}:{resumeToast.verseNumber}</strong>
            </span>
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

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-5 sm:pt-8 pb-24 sm:pb-24">
        {activeTab === 'votd' ? (
          <VerseOfTheDayView
            votdData={votdData}
            isLoading={isLoadingVotd}
            theme={theme}
            primaryTrans={primaryTrans}
            pinyinMode={pinyinMode}
            pinyinSize={pinyinSize}
            colorTones={colorTones}
            redLetter={redLetter}
            bookmarkedVerses={bookmarkedVerseKeys}
            onRefresh={() => loadVotd(true)}
            onJumpToVerse={handleSelectBookChapter}
            onToggleBookmark={handleToggleBookmarkByRef}
            onCharClick={(char, pinyin, tone) => setInspectingChar({ char, pinyin, tone })}
          />
        ) : (
          <>
            {/* Chapter Title matching Image 1 ("Genesis 1") */}
            {showNumbersAndTitles && (
              <div className="text-center pt-1 pb-4 mb-2">
                <h1
                  className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
                    readerFont === 'serif' ? 'font-serif' : 'font-sans'
                  }`}
                >
                  {currentBook.nameEn} {currentChapter}
                </h1>
              </div>
            )}

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
                    readerFont={readerFont}
                    showFootnotes={showFootnotes}
                    showNumbersAndTitles={showNumbersAndTitles}
                    theme={theme}
                    redLetter={redLetter}
                    activeVerseNumber={activeVerse?.number || null}
                    speakingVerseNumber={
                      isAudioPlayerOpen && focusAudioVerse
                        ? chapterData.verses[audioVerseIndex]?.number || null
                        : null
                    }
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
                    readerFont={readerFont}
                    showFootnotes={showFootnotes}
                    showNumbersAndTitles={showNumbersAndTitles}
                    theme={theme}
                    redLetter={redLetter}
                    activeVerseNumber={activeVerse?.number || null}
                    speakingVerseNumber={
                      isAudioPlayerOpen && focusAudioVerse
                        ? chapterData.verses[audioVerseIndex]?.number || null
                        : null
                    }
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
                    readerFont={readerFont}
                    showFootnotes={showFootnotes}
                    showNumbersAndTitles={showNumbersAndTitles}
                    theme={theme}
                    redLetter={redLetter}
                    activeVerseNumber={activeVerse?.number || null}
                    speakingVerseNumber={
                      isAudioPlayerOpen && focusAudioVerse
                        ? chapterData.verses[audioVerseIndex]?.number || null
                        : null
                    }
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

            {/* Chapter Navigation Footer & Floating Side Chevrons */}
            {!isLoadingChapter && (
              <ChapterNavFooter
                currentBook={currentBook}
                currentChapter={currentChapter}
                theme={theme}
                isPlayingAudio={isPlayingAudio}
                isAudioPlayerOpen={isAudioPlayerOpen}
                onToggleAudio={handleToggleAudio}
                onPrevChapter={handlePrevChapter}
                onNextChapter={handleNextChapter}
                onOpenBookPicker={() => setIsBookPickerOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Verse Action Toolbar */}
      {activeTab === 'bible' && activeVerse && (
        <VerseActionToolbar
          verse={activeVerse}
          bookNameZh={currentBook.nameZh}
          bookNameEn={currentBook.nameEn}
          chapter={currentChapter}
          isBookmarked={bookmarkedVerseKeys.has(activeVerseKey)}
          highlightColor={highlights[activeVerseKey]}
          theme={theme}
          selectionInfo={verseSelection}
          onToggleBookmark={handleToggleBookmark}
          onSetHighlight={handleSetHighlight}
          onOpenNote={() => setEditingNoteVerse(activeVerse)}
          onOpenCardModal={(snippetText) => {
            setCardSnippetText(snippetText);
            setIsCardModalOpen(true);
          }}
          onSaveSnippet={handleSaveSnippet}
          onClearSelection={() => {
            setVerseSelection(null);
            if (typeof window !== 'undefined') {
              window.getSelection()?.removeAllRanges();
            }
          }}
          onClose={handleCloseVerseToolbar}
        />
      )}

      {/* Docked Bottom Audio Listener Bar matching screenshot */}
      {activeTab === 'bible' && isAudioPlayerOpen && chapterData && (
        <AudioPlayerBar
          isPlaying={isPlayingAudio}
          currentVerseNum={chapterData.verses[audioVerseIndex]?.number || 1}
          totalVerses={chapterData.verses.length}
          currentTimeSec={(audioTimeline.startTimes[audioVerseIndex] || 0) + verseElapsedSec}
          totalDurationSec={audioTimeline.totalDurationSec}
          speechRate={speechRate}
          focusAudioVerse={focusAudioVerse}
          audioLanguage={audioLanguage}
          primaryTrans={primaryTrans}
          theme={theme}
          bookNameZh={currentBook.nameZh}
          bookNameEn={currentBook.nameEn}
          chapter={currentChapter}
          onPlayPause={handleToggleAudio}
          onSkipSeconds={handleSkipAudioSeconds}
          onSeekSeconds={handleSeekAudioSeconds}
          onChangeRate={handleChangeSpeechRate}
          onChangeLanguage={handleChangeAudioLanguage}
          onToggleFocusVerse={() => setFocusAudioVerse((prev) => !prev)}
          onClose={handleCloseAudioBar}
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
        readerFont={readerFont}
        setReaderFont={setReaderFont}
        showFootnotes={showFootnotes}
        setShowFootnotes={setShowFootnotes}
        showNumbersAndTitles={showNumbersAndTitles}
        setShowNumbersAndTitles={setShowNumbersAndTitles}
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
        snippets={snippets}
        highlights={highlights}
        userNotes={userNotes}
        onClose={() => setIsBookmarksOpen(false)}
        onJumpToVerse={handleSelectBookChapter}
        onRemoveBookmark={(id) => setBookmarks((prev) => prev.filter((b) => b.id !== id))}
        onRemoveSnippet={(id) => setSnippets((prev) => prev.filter((s) => s.id !== id))}
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
        snippetText={cardSnippetText}
        bookNameZh={currentBook.nameZh}
        bookNameEn={currentBook.nameEn}
        chapter={currentChapter}
        isOpen={isCardModalOpen}
        theme={theme}
        onClose={() => {
          setIsCardModalOpen(false);
          setCardSnippetText(undefined);
        }}
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

      {/* Fixed Bottom Navigation Menu separating Bible & Verse of the Day (hidden when docked AudioPlayerBar is active) */}
      {!(activeTab === 'bible' && isAudioPlayerOpen) && (
        <BottomTabBar
          activeTab={activeTab}
          theme={theme}
          onChangeTab={handleChangeTab}
        />
      )}
    </div>
  );
}
