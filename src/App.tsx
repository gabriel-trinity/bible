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

import { BIBLE_BOOKS, getBookById } from './data/bibleBooks';
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

export default function App() {
  // Current Book & Chapter
  const [currentBookId, setCurrentBookId] = useState<string>('GEN');
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [chapterData, setChapterData] = useState<ChapterContent | null>(null);
  const [isLoadingChapter, setIsLoadingChapter] = useState<boolean>(true);

  // Translations: Default side-by-side NIV and CNVS (Chinese New Version with Pinyin below)
  const [primaryTrans, setPrimaryTrans] = useState<TranslationId>('NIV');
  const [parallelTrans, setParallelTrans] = useState<TranslationId>('CNVS');

  // Reader Preferences: Default 'below' for Hanyu Pinyin underneath Chinese characters
  const [readingMode, setReadingMode] = useState<ReadingMode>('split');
  const [pinyinMode, setPinyinMode] = useState<PinyinDisplayMode>('below');
  const [pinyinSize, setPinyinSize] = useState<PinyinSize>('base');
  const [colorTones, setColorTones] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(18);
  const [theme, setTheme] = useState<AppTheme>('light');
  const [redLetter, setRedLetter] = useState<boolean>(true);

  // Interactive Selections
  const [activeVerse, setActiveVerse] = useState<VerseItem | null>(null);
  const [inspectingChar, setInspectingChar] = useState<{ char: string; pinyin: string; tone: number } | null>(null);
  const [editingNoteVerse, setEditingNoteVerse] = useState<VerseItem | null>(null);

  // Modals & Drawers
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
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

  // Load User Preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.readingMode) setReadingMode(p.readingMode);
        if (p.pinyinMode) setPinyinMode(p.pinyinMode);
        if (p.pinyinSize) setPinyinSize(p.pinyinSize);
        if (p.colorTones !== undefined) setColorTones(p.colorTones);
        if (p.fontSize) setFontSize(p.fontSize);
        if (p.theme) setTheme(p.theme);
        if (p.redLetter !== undefined) setRedLetter(p.redLetter);
        if (p.primaryTrans) setPrimaryTrans(p.primaryTrans);
        if (p.parallelTrans) setParallelTrans(p.parallelTrans);
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
        })
      );
    } catch {
      // Ignore
    }
  }, [readingMode, pinyinMode, pinyinSize, colorTones, fontSize, theme, redLetter, primaryTrans, parallelTrans]);

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

  const [targetVerseNumber, setTargetVerseNumber] = useState<number | null>(null);

  const scrollToVerse = useCallback((verseNum: number) => {
    setTimeout(() => {
      const el = document.getElementById(`verse-${verseNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
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

  // Handle Book, Chapter, and Verse Jump
  const handleSelectBookChapter = (bookId: string, chapter: number, verseNumber?: number) => {
    if (currentBookId === bookId && currentChapter === chapter) {
      if (verseNumber && chapterData) {
        const found = chapterData.verses.find((v) => v.number === verseNumber);
        if (found) {
          setActiveVerse(found);
          scrollToVerse(verseNumber);
        }
      }
      return;
    }

    setCurrentBookId(bookId);
    setCurrentChapter(chapter);
    if (verseNumber) {
      setTargetVerseNumber(verseNumber);
    } else {
      setTargetVerseNumber(null);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter((prev) => prev - 1);
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < currentBook.chaptersCount) {
      setCurrentChapter((prev) => prev + 1);
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
    (index: number) => {
      if (!chapterData || !chapterData.verses[index]) {
        setIsPlayingAudio(false);
        return;
      }

      setAudioVerseIndex(index);
      const targetVerse = chapterData.verses[index];
      const isChinese = primaryTrans === 'CNVS';
      const textToSpeak = getVerseTextForTranslation(targetVerse, primaryTrans);
      const langToSpeak = isChinese ? 'zh' : 'en';

      speechService.speak(textToSpeak, langToSpeak, speechRate, () => {
        if (autoAdvanceAudio && index + 1 < chapterData.verses.length) {
          playVerseAtIndex(index + 1);
        } else {
          setIsPlayingAudio(false);
        }
      });
    },
    [chapterData, primaryTrans, speechRate, autoAdvanceAudio]
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
        canGoPrev={currentChapter > 1}
        canGoNext={currentChapter < currentBook.chaptersCount}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        onOpenBookPicker={() => setIsBookPickerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenCustomPassage={() => setIsCustomPassageOpen(true)}
        onToggleAudio={handleToggleAudio}
        onChangeReadingMode={setReadingMode}
        onCyclePinyinMode={handleCyclePinyinMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Chapter Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-3 sm:pt-6">
        {/* Chapter Title */}
        <div className="text-center py-3 sm:py-5 border-b border-slate-200 dark:border-slate-800 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
            {currentBook.nameEn} {currentChapter}
          </h1>
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
                onSelectVerse={setActiveVerse}
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
                onSelectVerse={setActiveVerse}
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
                onSelectVerse={setActiveVerse}
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
          theme={theme}
          bookNameZh={currentBook.nameZh}
          bookNameEn={currentBook.nameEn}
          chapter={currentChapter}
          onPlayPause={handleToggleAudio}
          onStop={handleStopAudio}
          onPrevVerse={handleAudioPrevVerse}
          onNextVerse={handleAudioNextVerse}
          onChangeRate={setSpeechRate}
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
