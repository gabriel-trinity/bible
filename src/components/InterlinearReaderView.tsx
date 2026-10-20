import React from 'react';
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
import { Bookmark, FileText } from 'lucide-react';

interface InterlinearReaderViewProps {
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
  onToggleBookmark?: (verse: VerseItem) => void;
}

const HIGHLIGHT_STYLES: Record<HighlightColor, string> = {
  gold: 'bg-amber-200/50 dark:bg-amber-900/30',
  emerald: 'bg-emerald-200/50 dark:bg-emerald-900/30',
  sky: 'bg-sky-200/50 dark:bg-sky-900/30',
  rose: 'bg-rose-200/50 dark:bg-rose-900/30',
};

export const InterlinearReaderView: React.FC<InterlinearReaderViewProps> = ({
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
  const isPrimaryChinese = primaryTrans === 'CNVS';
  const isParallelChinese = parallelTrans === 'CNVS';

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 px-3 sm:px-4 space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {chapterData.verses.map((verse) => {
        const verseKey = `${chapterData.bookId}.${chapterData.chapter}.${verse.number}`;
        const isSelected = activeVerseNumber === verse.number;
        const isSpeaking = speakingVerseNumber === verse.number;
        const highlight = highlights[verseKey];
        const isBookmarked = bookmarkedVerses.has(verseKey);
        const hasNote = Boolean(userNotes[verseKey]);

        const highlightClass = highlight ? HIGHLIGHT_STYLES[highlight] : 'border-slate-200 dark:border-slate-800/80';

        const textLeft = getVerseTextForTranslation(verse, primaryTrans);
        const textRight = getVerseTextForTranslation(verse, parallelTrans);

        // Enforce: English to show first / above Chinese in bilingual feature
        // Determine whether Left is English or Chinese
        let topText = textLeft;
        let topTrans = primaryTrans;
        let isTopChinese = isPrimaryChinese;

        let bottomText = textRight;
        let bottomTrans = parallelTrans;
        let isBottomChinese = isParallelChinese;

        // If primary is Chinese and parallel is English, swap rows so English is on top!
        if (isPrimaryChinese && !isParallelChinese) {
          topText = textRight;
          topTrans = parallelTrans;
          isTopChinese = false;

          bottomText = textLeft;
          bottomTrans = primaryTrans;
          isBottomChinese = true;
        }

        const pericope = chapterData.pericopes?.find((p) => p.start === verse.number);

        return (
          <React.Fragment key={verse.number}>
            {pericope && (
              <div className="pt-6 pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-3.5">
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

            <div
              id={`verse-${verse.number}`}
              onClick={() => onSelectVerse(verse)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer scroll-mt-28 ${
                isSelected
                  ? 'border-slate-900 dark:border-slate-100 ring-2 ring-slate-900/30 dark:ring-slate-100/30 shadow-md bg-slate-100/80 dark:bg-slate-800/80'
                  : 'hover:border-slate-300 dark:hover:border-slate-700 bg-white/60 dark:bg-slate-900/40 shadow-2xs'
              } ${isSpeaking ? 'ring-2 ring-slate-900 bg-slate-200/50 dark:bg-slate-800' : ''} ${highlightClass}`}
            >
              {/* Header: Verse Number & Badges */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {!isTopChinese && (
                    <span
                      className={`font-sans font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center transition-colors select-none ${
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
                    className={`flex items-center gap-1 text-[11px] font-sans font-medium px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                      isBookmarked
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'opacity-40 hover:opacity-100'
                    }`}
                    title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                  >
                    <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-current' : ''}`} />
                    <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                  </button>

                  {hasNote && (
                    <span className="flex items-center gap-1 text-[11px] opacity-75 font-sans font-medium">
                      <FileText className="w-3 h-3" /> Note
                    </span>
                  )}
                </div>
              </div>

              {/* Top Row (English first if bilingual) */}
              <div
                className="py-1 transition-all"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: isTopChinese && pinyinMode === 'below' ? 2.3 : 1.75,
                }}
              >
                {isTopChinese ? (
                  <PinyinVerseText
                    text={topText}
                    pinyinMode={pinyinMode}
                    pinyinSize={pinyinSize}
                    colorTones={colorTones}
                    theme={theme}
                    redLetter={redLetter}
                    onCharClick={onCharClick}
                  />
                ) : (
                  <RedLetterText
                    text={topText}
                    enabled={redLetter}
                    className="font-sans leading-relaxed"
                  />
                )}
              </div>

              {/* Bottom Row (Chinese below) */}
              <div
                className="pt-2 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 opacity-90 transition-all"
                style={{
                  fontSize: `${Math.max(fontSize - 1, 14)}px`,
                  lineHeight: isBottomChinese && pinyinMode === 'below' ? 2.3 : 1.7,
                }}
              >
                {isBottomChinese ? (
                  <PinyinVerseText
                    text={bottomText}
                    pinyinMode={pinyinMode}
                    pinyinSize={pinyinSize}
                    colorTones={colorTones}
                    theme={theme}
                    redLetter={redLetter}
                    onCharClick={onCharClick}
                  />
                ) : (
                  <RedLetterText
                    text={bottomText}
                    enabled={redLetter}
                    className="font-sans leading-relaxed opacity-85"
                  />
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
