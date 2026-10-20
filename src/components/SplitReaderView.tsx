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
import { getVerseTextForTranslation } from '../data/curatedChapters';
import { Bookmark, FileText, Volume2 } from 'lucide-react';
import { speechService } from '../services/speechService';

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
  onToggleBookmark,
}) => {
  // Mobile mode: stacked by default
  const [mobileParallelMode] = useState<'split' | 'stacked'>('stacked');

  const isPrimaryChinese = primaryTrans === 'CNVS';
  const isParallelChinese = parallelTrans === 'CNVS';

  return (
    <div className="w-full max-w-7xl mx-auto pb-24 font-sans text-slate-900 dark:text-slate-100">
      {/* Synchronized Verses */}
      <div className="space-y-4">
        {chapterData.verses.map((verse) => {
          const verseKey = `${chapterData.bookId}.${chapterData.chapter}.${verse.number}`;
          const isSelected = activeVerseNumber === verse.number;
          const isSpeaking = speakingVerseNumber === verse.number;
          const highlight = highlights[verseKey];
          const isBookmarked = bookmarkedVerses.has(verseKey);
          const hasNote = Boolean(userNotes[verseKey]);

          const highlightClass = highlight
            ? HIGHLIGHT_STYLES[highlight]
            : 'border-slate-200 dark:border-slate-800/80';

          const textLeft = getVerseTextForTranslation(verse, primaryTrans);
          const textRight = getVerseTextForTranslation(verse, parallelTrans);

          const pericope = chapterData.pericopes?.find((p) => p.start === verse.number);

          return (
            <React.Fragment key={verse.number}>
              {/* Optional Section Heading */}
              {pericope && (
                <div className="pt-6 pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-2">
                  <div className="flex items-start gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-100 mt-2 shrink-0" />
                    <div className="flex-1">
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
                  </div>
                </div>
              )}

              {/* Parallel Verse Container */}
              <div
                id={`verse-${verse.number}`}
                onClick={() => onSelectVerse(verse)}
                className={`rounded-2xl border transition-all cursor-pointer scroll-mt-28 ${
                  isSelected
                    ? 'border-slate-900 dark:border-slate-100 ring-2 ring-slate-900/30 dark:ring-slate-100/30 shadow-md bg-slate-100/80 dark:bg-slate-800/80'
                    : 'hover:border-slate-300 dark:hover:border-slate-700 bg-white/60 dark:bg-slate-900/40 shadow-2xs'
                } ${isSpeaking ? 'ring-2 ring-slate-900 bg-slate-200/50 dark:bg-slate-800' : ''} ${highlightClass}`}
              >
                <div
                  className={`grid ${
                    mobileParallelMode === 'split' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
                  } divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800`}
                >
                  {/* Left / Top Column (English or Primary) */}
                  <div className="p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3.5">
                    {/* Verse Number & Action indicator */}
                    <div className="flex flex-col items-center gap-1.5 select-none shrink-0 pt-0.5">
                      {!isPrimaryChinese && (
                        <span
                          className={`font-sans font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            isSelected || isSpeaking
                              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {verse.number}
                        </span>
                      )}

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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speechService.speak(verse.textZh, 'zh', 0.9);
                        }}
                        className="p-1 rounded-md transition-colors cursor-pointer opacity-30 hover:opacity-100 hover:text-slate-900 dark:hover:text-slate-100"
                        title="Play Chinese Audio (中文朗读)"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
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

                  {/* Right / Bottom Column (Chinese or Parallel - No duplicate verse number!) */}
                  <div className="p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3.5">
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
