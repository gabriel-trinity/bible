import React from 'react';
import {
  ChapterContent,
  PinyinDisplayMode,
  PinyinSize,
  AppTheme,
  HighlightColor,
  TranslationId,
  VerseItem,
  VerseSelectionInfo,
  ReaderFont,
} from '../types/bible';
import { PinyinVerseText } from './PinyinVerseText';
import { RedLetterText } from './RedLetterText';
import { InlineNoteTooltip } from './InlineNoteTooltip';
import { getVerseTextForTranslation } from '../data/curatedChapters';
import { useVerseTextSelection } from '../hooks/useVerseTextSelection';

interface InterlinearReaderViewProps {
  chapterData: ChapterContent;
  primaryTrans: TranslationId;
  parallelTrans: TranslationId;
  pinyinMode: PinyinDisplayMode;
  pinyinSize: PinyinSize;
  colorTones: boolean;
  fontSize: number;
  readerFont?: ReaderFont;
  showFootnotes?: boolean;
  showNumbersAndTitles?: boolean;
  theme: AppTheme;
  redLetter?: boolean;
  activeVerseNumber: number | null;
  speakingVerseNumber: number | null;
  highlights: Record<string, HighlightColor>;
  bookmarkedVerses: Set<string>;
  userNotes: Record<string, string>;
  onSelectVerse: (verse: VerseItem, selection?: VerseSelectionInfo) => void;
  onCharClick: (char: string, pinyin: string, tone: number) => void;
  onToggleBookmark?: (verse: VerseItem) => void;
}

const HIGHLIGHT_STYLES: Record<HighlightColor, string> = {
  gold: 'bg-amber-200/45 dark:bg-amber-900/30',
  emerald: 'bg-emerald-200/45 dark:bg-emerald-900/30',
  sky: 'bg-sky-200/45 dark:bg-sky-900/30',
  rose: 'bg-rose-200/45 dark:bg-rose-900/30',
};

export const InterlinearReaderView: React.FC<InterlinearReaderViewProps> = ({
  chapterData,
  primaryTrans,
  parallelTrans,
  pinyinMode,
  pinyinSize,
  colorTones,
  fontSize,
  readerFont = 'serif',
  showFootnotes = true,
  showNumbersAndTitles = true,
  theme,
  redLetter = true,
  activeVerseNumber,
  speakingVerseNumber,
  highlights,
  bookmarkedVerses,
  userNotes,
  onSelectVerse,
  onCharClick,
}) => {
  const isPrimaryChinese = primaryTrans === 'CNVS';
  const isParallelChinese = parallelTrans === 'CNVS';
  const proseFontClass = readerFont === 'serif' ? 'font-serif' : 'font-sans';
  const isAudioFocusActive = speakingVerseNumber !== null;

  const { containerSelectionHandlers, handleVerseClick } = useVerseTextSelection({
    verses: chapterData.verses,
    onSelectVerse,
  });

  return (
    <div
      {...containerSelectionHandlers}
      className="w-full max-w-xl mx-auto pb-28 px-5 sm:px-6 font-sans text-slate-900 dark:text-slate-100"
    >
      {chapterData.verses.map((verse, idx) => {
        const verseKey = `${chapterData.bookId}.${chapterData.chapter}.${verse.number}`;
        const isSelected = activeVerseNumber === verse.number;
        const isSpeaking = speakingVerseNumber === verse.number;
        const highlight = highlights[verseKey];
        const isBookmarked = bookmarkedVerses.has(verseKey);
        const hasNote = Boolean(userNotes[verseKey]);
        const isLastVerse = idx === chapterData.verses.length - 1;
        const nextHasPericope = Boolean(
          !isLastVerse &&
            chapterData.pericopes?.some((p) => p.start === chapterData.verses[idx + 1].number)
        );

        const highlightClass = highlight ? `${HIGHLIGHT_STYLES[highlight]} rounded-xl px-3 -mx-3` : '';

        const textLeft = getVerseTextForTranslation(verse, primaryTrans);
        const textRight = getVerseTextForTranslation(verse, parallelTrans);

        // Enforce English above Chinese in bilingual view
        let topText = textLeft;
        let isTopChinese = isPrimaryChinese;

        let bottomText = textRight;
        let isBottomChinese = isParallelChinese;

        if (isPrimaryChinese && !isParallelChinese) {
          topText = textRight;
          isTopChinese = false;
          bottomText = textLeft;
          isBottomChinese = true;
        }

        const pericope = chapterData.pericopes?.find((p) => p.start === verse.number);
        const isDimmed = isAudioFocusActive && !isSpeaking;

        return (
          <React.Fragment key={verse.number}>
            {showNumbersAndTitles && pericope && (
              <div
                className={`pt-6 pb-2 transition-opacity duration-300 ${
                  isAudioFocusActive ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {pericope.titleEn && (
                  <h4
                    className={`font-bold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-slate-100 ${proseFontClass}`}
                  >
                    {pericope.titleEn}
                  </h4>
                )}
                {pericope.titleZh && (
                  <div
                    className={`font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-300 font-sans ${
                      pericope.titleEn ? 'mt-1' : ''
                    }`}
                    style={{ lineHeight: pinyinMode === 'below' ? 2.0 : 1.5 }}
                  >
                    <PinyinVerseText
                      text={pericope.titleZh}
                      overridePinyin={pericope.titlePinyin}
                      pinyinMode={pinyinMode}
                      pinyinSize={pinyinSize}
                      colorTones={colorTones}
                      theme={theme}
                      redLetter={false}
                      showFootnotes={false}
                      onCharClick={onCharClick}
                    />
                  </div>
                )}
              </div>
            )}

            <div
              id={`verse-${verse.number}`}
              data-verse-number={verse.number}
              onClick={() => handleVerseClick(verse)}
              className={`relative hover:z-20 focus-within:z-20 has-[[aria-expanded=true]]:z-30 py-4 transition-all duration-300 cursor-pointer scroll-mt-32 ${
                !isLastVerse && !nextHasPericope
                  ? 'border-b border-slate-200/80 dark:border-slate-800/80'
                  : ''
              } ${isDimmed ? 'opacity-40' : 'opacity-100'} ${
                isSelected && !highlight
                  ? 'bg-slate-100/80 dark:bg-slate-800/60 rounded-xl px-3 -mx-3'
                  : highlightClass
              }`}
            >
              {/* Vertical left black indicator bar matching active speaker/selection layout */}
              {(isSpeaking || isSelected) && (
                <span
                  aria-hidden="true"
                  className="absolute -left-3.5 sm:-left-5 top-3 bottom-3 w-[2.5px] rounded-full bg-slate-900 dark:bg-slate-100"
                />
              )}

              {/* Top Row (English first if bilingual) */}
              <div
                data-verse-lang={isTopChinese ? 'zh' : 'en'}
                className="transition-all select-text cursor-text"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: isTopChinese && pinyinMode === 'below' ? 2.3 : 1.75,
                }}
              >
                {showNumbersAndTitles && (
                  <sup
                    className={`text-[0.64em] font-sans font-medium mr-1.5 select-none tabular-nums ${
                      isSpeaking
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {verse.number}
                  </sup>
                )}

                {isTopChinese ? (
                  <PinyinVerseText
                    text={topText}
                    pinyinMode={pinyinMode}
                    pinyinSize={pinyinSize}
                    colorTones={colorTones}
                    theme={theme}
                    redLetter={redLetter}
                    showFootnotes={showFootnotes}
                    onCharClick={onCharClick}
                  />
                ) : (
                  <RedLetterText
                    text={topText}
                    enabled={redLetter}
                    className={`${proseFontClass} leading-relaxed`}
                  />
                )}

                {showFootnotes && hasNote && (
                  <span className="inline-flex align-middle ml-1.5">
                    <InlineNoteTooltip
                      note={userNotes[verseKey]}
                      badgeLabel="Study Note"
                      pinyinMode={pinyinMode}
                      pinyinSize={pinyinSize}
                      colorTones={colorTones}
                      theme={theme}
                      onCharClick={onCharClick}
                    />
                  </span>
                )}

                {isBookmarked && !isDimmed && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 align-super ml-1"
                    title="Bookmarked verse"
                  />
                )}
              </div>

              {/* Bottom Row (Chinese + Centered Hanyu Pinyin) */}
              <div
                data-verse-lang={isBottomChinese ? 'zh' : 'en'}
                className="mt-1.5 opacity-90 transition-all select-text cursor-text"
                style={{
                  fontSize: `${Math.max(fontSize - 1, 14)}px`,
                  lineHeight: isBottomChinese && pinyinMode === 'below' ? 2.25 : 1.7,
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
                    showFootnotes={showFootnotes}
                    onCharClick={onCharClick}
                  />
                ) : (
                  <RedLetterText
                    text={bottomText}
                    enabled={redLetter}
                    className={`${proseFontClass} leading-relaxed opacity-85`}
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
