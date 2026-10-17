import React, { useState } from 'react';
import {
  ChapterContent,
  PinyinDisplayMode,
  PinyinSize,
  AppTheme,
  HighlightColor,
  TranslationId,
  VerseItem,
} from '../types/bible';
import { PinyinVerseText } from './PinyinVerseText';
import { RedLetterText } from './RedLetterText';
import { TRANSLATIONS } from '../data/bibleBooks';
import { getVerseTextForTranslation } from '../data/curatedChapters';
import { Bookmark, FileText, ArrowLeftRight, Columns, Rows } from 'lucide-react';

interface SplitReaderViewProps {
  chapterData: ChapterContent;
  primaryTrans: TranslationId;
  parallelTrans: TranslationId;
  pinyinMode: PinyinDisplayMode;
  pinyinSize: PinyinSize;
  colorTones: boolean;
  fontSize: number;
  theme: AppTheme;
  redLetter?: boolean;
  activeVerseNumber: number | null;
  speakingVerseNumber: number | null;
  highlights: Record<string, HighlightColor>;
  bookmarkedVerses: Set<string>;
  userNotes: Record<string, string>;
  onSelectVerse: (verse: VerseItem) => void;
  onCharClick: (char: string, pinyin: string, tone: number) => void;
  onPrimaryTransChange: (trans: TranslationId) => void;
  onParallelTransChange: (trans: TranslationId) => void;
  onSwapTranslations: () => void;
  onToggleBookmark?: (verse: VerseItem) => void;
}

const HIGHLIGHT_STYLES: Record<HighlightColor, string> = {
  gold: 'bg-amber-200/50 dark:bg-amber-900/30',
  emerald: 'bg-emerald-200/50 dark:bg-emerald-900/30',
  sky: 'bg-sky-200/50 dark:bg-sky-900/30',
  rose: 'bg-rose-200/50 dark:bg-rose-900/30',
};

const TRANSLATION_OPTIONS: TranslationId[] = ['CNVS', 'ESV', 'NASB', 'NIV', 'NKJV', 'NLT'];

export const SplitReaderView: React.FC<SplitReaderViewProps> = ({
  chapterData,
  primaryTrans,
  parallelTrans,
  pinyinMode,
  pinyinSize,
  colorTones,
  fontSize,
  theme,
  redLetter = true,
  activeVerseNumber,
  speakingVerseNumber,
  highlights,
  bookmarkedVerses,
  userNotes,
  onSelectVerse,
  onCharClick,
  onPrimaryTransChange,
  onParallelTransChange,
  onSwapTranslations,
  onToggleBookmark,
}) => {
  const [hoveredVerse, setHoveredVerse] = useState<number | null>(null);
  const [mobileParallelMode, setMobileParallelMode] = useState<'split' | 'stacked'>('split');

  const isPrimaryChinese = primaryTrans === 'CNVS';
  const isParallelChinese = parallelTrans === 'CNVS';

  return (
    <div className="w-full max-w-7xl mx-auto pb-24 font-sans text-slate-900 dark:text-slate-100">
      {/* Synchronized Column Translation Controls */}
      <div className="rounded-2xl border pb-3 pt-3 mb-6 px-3 sm:px-4 transition-colors border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left Column Selector */}
          <div className="w-full sm:w-[48%] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Primary:
              </span>
              <select
                value={primaryTrans}
                onChange={(e) => onPrimaryTransChange(e.target.value as TranslationId)}
                className="text-xs font-sans font-semibold rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 cursor-pointer shadow-xs"
              >
                {TRANSLATION_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {TRANSLATIONS[id].shortName} — {TRANSLATIONS[id].name}
                  </option>
                ))}
              </select>
            </div>
            {isPrimaryChinese && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-sans font-semibold">
                汉语拼音
              </span>
            )}
          </div>

          {/* Center Swap Button & Mobile Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSwapTranslations}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300"
              title="Swap Left and Right translations"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Swap</span>
            </button>

            {/* Mobile View Toggle */}
            <div className="flex md:hidden items-center p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setMobileParallelMode('split')}
                className={`p-1 rounded cursor-pointer ${
                  mobileParallelMode === 'split' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs' : 'opacity-60 text-slate-700 dark:text-slate-300'
                }`}
                title="Mobile Side-by-Side"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMobileParallelMode('stacked')}
                className={`p-1 rounded cursor-pointer ${
                  mobileParallelMode === 'stacked' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs' : 'opacity-60 text-slate-700 dark:text-slate-300'
                }`}
                title="Mobile Stacked"
              >
                <Rows className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column Selector */}
          <div className="w-full sm:w-[48%] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Parallel:
              </span>
              <select
                value={parallelTrans}
                onChange={(e) => onParallelTransChange(e.target.value as TranslationId)}
                className="text-xs font-sans font-semibold rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 cursor-pointer shadow-xs"
              >
                {TRANSLATION_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {TRANSLATIONS[id].shortName} — {TRANSLATIONS[id].name}
                  </option>
                ))}
              </select>
            </div>
            {isParallelChinese && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-sans font-semibold">
                汉语拼音
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Synchronized Verses List */}
      <div className="space-y-3 px-2 sm:px-4">
        {chapterData.verses.map((verse) => {
          const verseKey = `${chapterData.bookId}.${chapterData.chapter}.${verse.number}`;
          const isSelected = activeVerseNumber === verse.number;
          const isHovered = hoveredVerse === verse.number;
          const isSpeaking = speakingVerseNumber === verse.number;
          const highlight = highlights[verseKey];
          const isBookmarked = bookmarkedVerses.has(verseKey);
          const hasNote = Boolean(userNotes[verseKey]);

          const highlightBg = highlight ? HIGHLIGHT_STYLES[highlight] : '';

          const textLeft = getVerseTextForTranslation(verse, primaryTrans);
          const textRight = getVerseTextForTranslation(verse, parallelTrans);

          const pericope = chapterData.pericopes?.find((p) => p.start === verse.number);

          return (
            <React.Fragment key={verse.number}>
              {pericope && (
                <div className="pt-6 pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-100 mt-2 shrink-0" />
                    <div className="flex-1">
                      {isPrimaryChinese ? (
                        <div>
                          {pericope.titleZh && (
                            <div>
                              <h4 className="font-bold text-base sm:text-lg tracking-tight font-sans text-slate-900 dark:text-slate-100">
                                {pericope.titleZh}
                              </h4>
                              {pericope.titlePinyin && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                                  {pericope.titlePinyin}
                                </div>
                              )}
                            </div>
                          )}
                          {pericope.titleEn && (
                            <div className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400 font-sans">
                              {pericope.titleEn}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {pericope.titleEn && (
                            <h4 className="font-bold text-base sm:text-lg tracking-tight font-sans text-slate-900 dark:text-slate-100">
                              {pericope.titleEn}
                            </h4>
                          )}
                          {pericope.titleZh && (
                            <div className={pericope.titleEn ? 'mt-1.5' : ''}>
                              <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 font-sans">
                                {pericope.titleZh}
                              </div>
                              {pericope.titlePinyin && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                                  {pericope.titlePinyin}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div
                id={`verse-${verse.number}`}
                onMouseEnter={() => setHoveredVerse(verse.number)}
                onMouseLeave={() => setHoveredVerse(null)}
                onClick={() => onSelectVerse(verse)}
                className={`group relative rounded-2xl transition-all border cursor-pointer scroll-mt-28 ${
                  isSelected
                    ? 'border-slate-900 dark:border-slate-100 ring-2 ring-slate-900/30 dark:ring-slate-100/30 shadow-md bg-slate-100/80 dark:bg-slate-800/80'
                    : isHovered
                    ? 'border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40'
                } ${isSpeaking ? 'ring-2 ring-slate-900 bg-slate-200/50 dark:bg-slate-800' : ''} ${highlightBg}`}
              >
                {/* Responsive Layout */}
                <div
                  className={`grid ${
                    mobileParallelMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'
                  } md:grid-cols-2 divide-x md:divide-x divide-slate-200 dark:divide-slate-800 items-stretch`}
                >
                  {/* Left Column */}
                  <div className="p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3.5">
                    <div className="flex flex-col items-center gap-1.5 select-none shrink-0 pt-0.5">
                      {/* Verse Number Badge */}
                      <span
                        className={`font-sans font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          isSelected || isSpeaking
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {verse.number}
                      </span>

                      {/* Instant 1-Click Bookmark Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark?.(verse);
                        }}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'text-amber-500'
                            : 'opacity-30 hover:opacity-100 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                        title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                      </button>

                      {hasNote && <FileText className="w-3 h-3 opacity-70" />}
                    </div>

                    <div
                      className="flex-1 transition-all"
                      style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: isPrimaryChinese && pinyinMode === 'below' ? 2.3 : 1.7,
                      }}
                    >
                      {isPrimaryChinese ? (
                        <PinyinVerseText
                          text={textLeft}
                          pinyinMode={pinyinMode}
                          pinyinSize={pinyinSize}
                          colorTones={colorTones}
                          theme={theme}
                          redLetter={redLetter}
                          onCharClick={onCharClick}
                        />
                      ) : (
                        <RedLetterText
                          text={textLeft}
                          enabled={redLetter}
                          className="font-sans leading-relaxed"
                        />
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3.5">
                    {mobileParallelMode === 'stacked' && (
                      <div className="flex flex-col items-center gap-1.5 select-none shrink-0 pt-0.5 md:hidden">
                        <span className="font-sans font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {verse.number}
                        </span>
                      </div>
                    )}

                    <div
                      className="flex-1 transition-all"
                      style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: isParallelChinese && pinyinMode === 'below' ? 2.3 : 1.7,
                      }}
                    >
                      {isParallelChinese ? (
                        <PinyinVerseText
                          text={textRight}
                          pinyinMode={pinyinMode}
                          pinyinSize={pinyinSize}
                          colorTones={colorTones}
                          theme={theme}
                          redLetter={redLetter}
                          onCharClick={onCharClick}
                        />
                      ) : (
                        <RedLetterText
                          text={textRight}
                          enabled={redLetter}
                          className="font-sans leading-relaxed"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
