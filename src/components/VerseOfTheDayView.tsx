import React, { useEffect, useState } from 'react';
import {
  Share,
  Volume2,
  Square,
  BookOpen,
  Copy,
  Check,
  Bookmark,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import {
  AppTheme,
  PinyinDisplayMode,
  PinyinSize,
  TranslationId,
  VerseItem,
  VotdData,
  VotdEntry,
} from '../types/bible';
import { HydratedVotd, hydrateVotdEntry } from '../services/votdService';
import { PinyinVerseText } from './PinyinVerseText';
import { RedLetterText } from './RedLetterText';
import { speechService } from '../services/speechService';
import { stripVerseMarkup } from '../services/pinyinService';

interface VerseOfTheDayViewProps {
  votdData: VotdData | null;
  isLoading: boolean;
  theme: AppTheme;
  primaryTrans: TranslationId;
  pinyinMode: PinyinDisplayMode;
  pinyinSize: PinyinSize;
  colorTones: boolean;
  redLetter: boolean;
  bookmarkedVerses: Set<string>;
  onRefresh: () => void;
  onJumpToVerse: (bookId: string, chapter: number, verseNumber?: number) => void;
  onToggleBookmark: (bookId: string, chapter: number, verse: VerseItem) => void;
  onCharClick: (char: string, pinyin: string, tone: number) => void;
}

const CurvedLeftBracket: React.FC = () => (
  <div
    className="flex flex-col items-start text-slate-900 dark:text-slate-200 shrink-0 select-none py-0.5"
    aria-hidden="true"
  >
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="shrink-0">
      <path
        d="M8.25 1C4 1 1.25 3.75 1.25 8V9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
    <div className="w-[1.75px] flex-1 bg-current ml-[0.375px] min-h-[16px]" />
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="shrink-0">
      <path
        d="M1.25 0V1C1.25 5.25 4 8 8.25 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

interface WeeklyVerseRowProps {
  entry: VotdEntry;
  theme: AppTheme;
  primaryTrans: TranslationId;
  pinyinMode: PinyinDisplayMode;
  pinyinSize: PinyinSize;
  colorTones: boolean;
  redLetter: boolean;
  bookmarkedVerses: Set<string>;
  speakingId: string | null;
  onPlayAudio: (rowId: string, lang: 'zh' | 'en', text: string) => void;
  onJumpToVerse: (bookId: string, chapter: number, verseNumber?: number) => void;
  onToggleBookmark: (bookId: string, chapter: number, verse: VerseItem) => void;
  onCharClick: (char: string, pinyin: string, tone: number) => void;
  onPreviewImage: (entry: VotdEntry) => void;
}

const WeeklyVerseRow: React.FC<WeeklyVerseRowProps> = ({
  entry,
  theme,
  primaryTrans,
  pinyinMode,
  pinyinSize,
  colorTones,
  redLetter,
  bookmarkedVerses,
  speakingId,
  onPlayAudio,
  onJumpToVerse,
  onToggleBookmark,
  onCharClick,
  onPreviewImage,
}) => {
  const [hydrated, setHydrated] = useState<HydratedVotd | null>(null);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hydrateVotdEntry(entry, primaryTrans).then((res) => {
      if (!cancelled) setHydrated(res);
    });
    return () => {
      cancelled = true;
    };
  }, [entry, primaryTrans]);

  const rowKey = `${entry.day}-${entry.referenceHuman}`;
  const thumb = entry.images?.[0]?.thumbnailUrl || entry.images?.[0]?.url || '';
  const englishLabel = primaryTrans === 'CNVS' ? entry.versionAbbr || 'NIV' : primaryTrans;
  const firstVerse = hydrated?.verses?.[0];
  const canJump = Boolean(hydrated?.book && hydrated?.chapter);
  const bookmarkKey =
    hydrated?.book && hydrated?.chapter && firstVerse
      ? `${hydrated.book.id}.${hydrated.chapter}.${firstVerse.number}`
      : '';
  const isBookmarked = bookmarkKey ? bookmarkedVerses.has(bookmarkKey) : false;

  const zhSpeakingKey = `${rowKey}-zh`;
  const enSpeakingKey = `${rowKey}-en`;

  const handleCopy = () => {
    const refZh =
      hydrated?.book && hydrated?.chapter && hydrated?.verseStart
        ? `${hydrated.book.nameZh} ${hydrated.chapter}:${hydrated.verseStart}${
            hydrated.verseEnd && hydrated.verseEnd > hydrated.verseStart ? `-${hydrated.verseEnd}` : ''
          }`
        : '';
    const cleanEn = hydrated?.textEnRaw || entry.content;
    const cleanZh = hydrated?.textZhCombined
      ? stripVerseMarkup(hydrated.textZhCombined, { stripNotes: true })
      : '';
    const lines = [
      `${entry.referenceHuman}${refZh ? ` · ${refZh}` : ''} (${englishLabel})`,
      cleanEn,
      cleanZh,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="space-y-2.5">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {entry.day}
      </div>

      <div className="flex items-start justify-between gap-4 sm:gap-6">
        <div className="flex items-stretch gap-3.5 flex-1 min-w-0">
          <CurvedLeftBracket />

          <div className="flex-1 min-w-0 py-0.5 space-y-2.5">
            <div className="text-[15px] sm:text-base leading-relaxed text-slate-900 dark:text-slate-100">
              {hydrated?.textEnCombined ? (
                <RedLetterText
                  text={hydrated.textEnCombined}
                  enabled={redLetter}
                  className="font-sans"
                />
              ) : (
                <p>{entry.content}</p>
              )}
            </div>

            {hydrated?.textZhCombined && (
              <div
                className="text-base sm:text-[17px] text-slate-800 dark:text-slate-200 pt-0.5"
                style={{ lineHeight: pinyinMode === 'below' ? 2.2 : 1.7 }}
              >
                <PinyinVerseText
                  text={hydrated.textZhCombined}
                  pinyinMode={pinyinMode === 'off' ? 'below' : pinyinMode}
                  pinyinSize={pinyinSize}
                  colorTones={colorTones}
                  theme={theme}
                  redLetter={redLetter}
                  onCharClick={onCharClick}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold tracking-wide text-slate-600 dark:text-slate-400 uppercase pt-0.5">
              <span>
                {entry.referenceHuman} ({englishLabel})
              </span>
              {hydrated?.book && hydrated?.chapter && hydrated?.verseStart && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="normal-case font-semibold">
                    {hydrated.book.nameZh} {hydrated.chapter}:{hydrated.verseStart}
                    {hydrated.verseEnd && hydrated.verseEnd > hydrated.verseStart
                      ? `-${hydrated.verseEnd}`
                      : ''}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {canJump && (
                <button
                  onClick={() =>
                    onJumpToVerse(hydrated!.book!.id, hydrated!.chapter!, hydrated!.verseStart || 1)
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 text-[11px] font-semibold flex items-center gap-1 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Read Chapter</span>
                </button>
              )}

              {hydrated?.textZhCombined && (
                <button
                  onClick={() => onPlayAudio(zhSpeakingKey, 'zh', hydrated.textZhCombined)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    speakingId === zhSpeakingKey
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-stone-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {speakingId === zhSpeakingKey ? (
                    <Square className="w-2.5 h-2.5 fill-current" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                  <span>{speakingId === zhSpeakingKey ? 'Stop' : '中文'}</span>
                </button>
              )}

              <button
                onClick={() =>
                  onPlayAudio(enSpeakingKey, 'en', hydrated?.textEnRaw || entry.content)
                }
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  speakingId === enSpeakingKey
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-stone-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {speakingId === enSpeakingKey ? (
                  <Square className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
                <span>{speakingId === enSpeakingKey ? 'Stop' : 'EN'}</span>
              </button>

              {hydrated?.book && hydrated?.chapter && firstVerse && (
                <button
                  onClick={() => onToggleBookmark(hydrated.book!.id, hydrated.chapter!, firstVerse)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isBookmarked
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      : 'border-stone-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>
              )}

              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onPreviewImage(entry)}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 cursor-pointer hover:opacity-90 transition-opacity shadow-xs"
          title={`View ${entry.referenceHuman} verse image`}
          aria-label={`View ${entry.referenceHuman} verse image`}
        >
          {thumb && !imgError ? (
            <img
              src={thumb}
              alt={`${entry.referenceHuman} — ${entry.day}`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-100">
              <ImageIcon className="w-4 h-4 opacity-50 mb-1" />
              <span className="text-[10px] font-semibold leading-tight line-clamp-2">
                {entry.referenceHuman}
              </span>
            </div>
          )}
        </button>
      </div>
    </article>
  );
};

export const VerseOfTheDayView: React.FC<VerseOfTheDayViewProps> = ({
  votdData,
  isLoading,
  theme,
  primaryTrans,
  pinyinMode,
  pinyinSize,
  colorTones,
  redLetter,
  bookmarkedVerses,
  onRefresh,
  onJumpToVerse,
  onToggleBookmark,
  onCharClick,
}) => {
  const [todayHydrated, setTodayHydrated] = useState<HydratedVotd | null>(null);
  const [heroImageIdx, setHeroImageIdx] = useState(0);
  const [heroImgError, setHeroImgError] = useState(false);
  const [sharedToday, setSharedToday] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<VotdEntry | null>(null);
  const [previewImgIdx, setPreviewImgIdx] = useState(0);

  const today = votdData?.today || null;

  useEffect(() => {
    if (!today) return;
    let cancelled = false;
    setHeroImageIdx(0);
    setHeroImgError(false);
    hydrateVotdEntry(today, primaryTrans).then((res) => {
      if (!cancelled) setTodayHydrated(res);
    });
    return () => {
      cancelled = true;
    };
  }, [today, primaryTrans]);

  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  const handlePlayAudio = (rowId: string, lang: 'zh' | 'en', text: string) => {
    if (speakingId === rowId) {
      speechService.stop();
      setSpeakingId(null);
      return;
    }
    if (!text) return;
    setSpeakingId(rowId);
    speechService.speak(text, lang, 0.9, () => setSpeakingId(null));
  };

  const handleShareToday = async () => {
    if (!today) return;
    const englishLabel = primaryTrans === 'CNVS' ? today.versionAbbr || 'NIV' : primaryTrans;
    const refZh =
      todayHydrated?.book && todayHydrated?.chapter && todayHydrated?.verseStart
        ? `${todayHydrated.book.nameZh} ${todayHydrated.chapter}:${todayHydrated.verseStart}`
        : '';
    const cleanEn = todayHydrated?.textEnRaw || today.content;
    const cleanZh = todayHydrated?.textZhCombined
      ? stripVerseMarkup(todayHydrated.textZhCombined, { stripNotes: true })
      : '';
    const shareText = `${today.referenceHuman}${refZh ? ` · ${refZh}` : ''} (${englishLabel})\n${cleanEn}${
      cleanZh ? `\n${cleanZh}` : ''
    }`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Verse of the Day — ${today.referenceHuman}`,
          text: shareText,
          url: 'https://www.bible.com/verse-of-the-day',
        });
        return;
      } catch {
        // Fallback to clipboard copy if user dismissed or share blocked
      }
    }

    navigator.clipboard.writeText(shareText);
    setSharedToday(true);
    setTimeout(() => setSharedToday(false), 2000);
  };

  if (isLoading && !today) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-3 font-sans">
        <div className="w-8 h-8 border-3 border-slate-900 dark:border-slate-100 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading Verse of the Day from Bible.com...
        </p>
      </div>
    );
  }

  if (!today) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-3 font-sans">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Unable to load Verse of the Day right now.
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const todayImages = today.images || [];
  const activeHeroImage = todayImages[heroImageIdx] || todayImages[0] || null;
  const englishLabel = primaryTrans === 'CNVS' ? today.versionAbbr || 'NIV' : primaryTrans;
  const todayFirstVerse = todayHydrated?.verses?.[0];
  const canJumpToday = Boolean(todayHydrated?.book && todayHydrated?.chapter);
  const todayBookmarkKey =
    todayHydrated?.book && todayHydrated?.chapter && todayFirstVerse
      ? `${todayHydrated.book.id}.${todayHydrated.chapter}.${todayFirstVerse.number}`
      : '';
  const isTodayBookmarked = todayBookmarkKey ? bookmarkedVerses.has(todayBookmarkKey) : false;
  const historyEntries = votdData?.history || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 font-sans">
      {/* 1. Featured "Verse of the Day" Card matching screenshot */}
      <section
        aria-label="Verse of the Day"
        className={`rounded-2xl p-5 sm:p-7 border transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-[#f4f4f2] border-stone-200/80 text-slate-900'
        }`}
      >
        {/* Top Row: "Verse of the Day" + Date on left, crimson "Share" button on right */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Verse of the Day
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {today.day}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShareToday}
              className="px-4 py-1.5 rounded-full bg-[#ef3e4a] hover:bg-[#dc2c38] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              {sharedToday ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Share className="w-3.5 h-3.5" />
              )}
              <span>{sharedToday ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Featured Square Verse Image Carousel */}
        {activeHeroImage && (
          <div className="relative aspect-square w-full max-w-md mx-auto rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 mb-6 shadow-xs">
            {!heroImgError ? (
              <img
                src={activeHeroImage.url}
                alt={`${today.referenceHuman} — Verse of the Day`}
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-100">
                <ImageIcon className="w-8 h-8 opacity-50 mb-2" />
                <p className="text-sm font-semibold">{today.referenceHuman}</p>
              </div>
            )}

            {/* Left / Right Image Navigation Arrows matching screenshot */}
            {todayImages.length > 1 && (
              <>
                {heroImageIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setHeroImageIdx((prev) => (prev - 1 + todayImages.length) % todayImages.length);
                      setHeroImgError(false);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-11 rounded-md bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Previous verse image"
                    aria-label="Previous verse image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setHeroImageIdx((prev) => (prev + 1) % todayImages.length);
                    setHeroImgError(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-11 rounded-md bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Next verse image"
                  aria-label="Next verse image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Bottom-right Share circular overlay icon matching screenshot */}
            <button
              type="button"
              onClick={handleShareToday}
              className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs"
              title="Share Verse of the Day"
              aria-label="Share Verse of the Day"
            >
              {sharedToday ? <Check className="w-4 h-4" /> : <Share className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Curved Left Bracket Quote Block */}
        <div className="flex items-stretch gap-3.5">
          <CurvedLeftBracket />

          <div className="flex-1 min-w-0 py-0.5 space-y-3">
            {/* English Verse */}
            <div className="text-base sm:text-lg leading-relaxed text-slate-900 dark:text-slate-100">
              {todayHydrated?.textEnCombined ? (
                <RedLetterText
                  text={todayHydrated.textEnCombined}
                  enabled={redLetter}
                  className="font-sans"
                />
              ) : (
                <p>{today.content}</p>
              )}
            </div>

            {/* Chinese + Hanyu Pinyin */}
            {todayHydrated?.textZhCombined && (
              <div
                className="text-lg sm:text-xl text-slate-900 dark:text-slate-100 pt-1"
                style={{ lineHeight: pinyinMode === 'below' ? 2.25 : 1.75 }}
              >
                <PinyinVerseText
                  text={todayHydrated.textZhCombined}
                  pinyinMode={pinyinMode === 'off' ? 'below' : pinyinMode}
                  pinyinSize={pinyinSize}
                  colorTones={colorTones}
                  theme={theme}
                  redLetter={redLetter}
                  onCharClick={onCharClick}
                />
              </div>
            )}

            {/* Bold Uppercase Reference */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold tracking-wide text-slate-600 dark:text-slate-400 uppercase pt-0.5">
              <span>
                {today.referenceHuman} ({englishLabel})
              </span>
              {todayHydrated?.book && todayHydrated?.chapter && todayHydrated?.verseStart && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="normal-case font-semibold">
                    {todayHydrated.book.nameZh} {todayHydrated.chapter}:{todayHydrated.verseStart}
                    {todayHydrated.verseEnd && todayHydrated.verseEnd > todayHydrated.verseStart
                      ? `-${todayHydrated.verseEnd}`
                      : ''}
                  </span>
                </>
              )}
            </div>

            {/* Working Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {canJumpToday && (
                <button
                  type="button"
                  onClick={() =>
                    onJumpToVerse(
                      todayHydrated!.book!.id,
                      todayHydrated!.chapter!,
                      todayHydrated!.verseStart || 1
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Full Chapter</span>
                </button>
              )}

              {todayHydrated?.textZhCombined && (
                <button
                  type="button"
                  onClick={() =>
                    handlePlayAudio('today-zh', 'zh', todayHydrated.textZhCombined)
                  }
                  className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    speakingId === 'today-zh'
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-stone-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {speakingId === 'today-zh' ? (
                    <Square className="w-3 h-3 fill-current" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>{speakingId === 'today-zh' ? 'Stop 中文' : '中文朗读'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handlePlayAudio('today-en', 'en', todayHydrated?.textEnRaw || today.content)
                }
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  speakingId === 'today-en'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-stone-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {speakingId === 'today-en' ? (
                  <Square className="w-3 h-3 fill-current" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>{speakingId === 'today-en' ? 'Stop EN' : 'Listen EN'}</span>
              </button>

              {todayHydrated?.book && todayHydrated?.chapter && todayFirstVerse && (
                <button
                  type="button"
                  onClick={() =>
                    onToggleBookmark(
                      todayHydrated.book!.id,
                      todayHydrated.chapter!,
                      todayFirstVerse
                    )
                  }
                  className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isTodayBookmarked
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      : 'border-stone-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isTodayBookmarked ? 'fill-current' : ''}`} />
                  <span>{isTodayBookmarked ? 'Saved' : 'Save'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. "This Weeks Bible Verses" Card below */}
      {historyEntries.length > 0 && (
        <section
          aria-label="This Weeks Bible Verses"
          className={`rounded-2xl p-5 sm:p-7 border transition-colors ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-slate-100'
              : 'bg-[#f4f4f2] border-stone-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              This Weeks Bible Verses
            </h2>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-40"
                title="Refresh from Bible.com"
                aria-label="Refresh from Bible.com"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <a
                href="https://www.bible.com/verse-of-the-day"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                title="Open on Bible.com"
                aria-label="Open on Bible.com"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-7">
            {historyEntries.map((entry, idx) => (
              <WeeklyVerseRow
                key={`${entry.day}-${entry.referenceHuman}-${idx}`}
                entry={entry}
                theme={theme}
                primaryTrans={primaryTrans}
                pinyinMode={pinyinMode}
                pinyinSize={pinyinSize}
                colorTones={colorTones}
                redLetter={redLetter}
                bookmarkedVerses={bookmarkedVerses}
                speakingId={speakingId}
                onPlayAudio={handlePlayAudio}
                onJumpToVerse={onJumpToVerse}
                onToggleBookmark={onToggleBookmark}
                onCharClick={onCharClick}
                onPreviewImage={(e) => {
                  setPreviewEntry(e);
                  setPreviewImgIdx(0);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Optional Lightbox for clicking any thumbnail in This Weeks Bible Verses */}
      {previewEntry && previewEntry.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setPreviewEntry(null)}
        >
          <div
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {previewEntry.referenceHuman}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {previewEntry.day} ·{' '}
                  {previewEntry.images[previewImgIdx]?.attribution || '© YouVersion'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEntry(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                aria-label="Close image preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={previewEntry.images[previewImgIdx]?.url || previewEntry.images[0].url}
                alt={previewEntry.referenceHuman}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {previewEntry.images.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                {previewEntry.images.slice(0, 5).map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setPreviewImgIdx(i)}
                    className={`w-10 h-10 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      i === previewImgIdx
                        ? 'border-slate-900 dark:border-slate-100 ring-2 ring-slate-900/30 dark:ring-slate-100/30'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.thumbnailUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
