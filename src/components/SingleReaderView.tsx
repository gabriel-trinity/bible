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

interface SingleReaderViewProps {
  chapterData: ChapterContent;
  primaryTrans: TranslationId;
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
  gold: 'bg-amber-200/50 dark:bg-amber-900/35',
  emerald: 'bg-emerald-200/50 dark:bg-emerald-900/35',
  sky: 'bg-sky-200/50 dark:bg-sky-900/35',
  rose: 'bg-rose-200/50 dark:bg-rose-900/35',
};

export const SingleReaderView: React.FC<SingleReaderViewProps> = ({
  chapterData,
  primaryTrans,
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
        const hasNote = Boolean(userNotes[verseKey]);
        const isBookmarked = bookmarkedVerses.has(verseKey);
        const text = getVerseTextForTranslation(verse, primaryTrans);

        const isLastVerse = idx === chapterData.verses.length - 1;
        const nextHasPericope = Boolean(
          !isLastVerse &&
            chapterData.pericopes?.some((p) => p.start === chapterData.verses[idx + 1].number)
        );

        const pericope = chapterData.pericopes?.find((p) => p.start === verse.number);
        const isDimmed = isAudioFocusActive && !isSpeaking;
        const highlightClass = highlight ? `${HIGHLIGHT_STYLES[highlight]} rounded-xl px-3 -mx-3` : '';

        return (
          <React.Fragment key={verse.number}>
            {showNumbersAndTitles && pericope && (
              <div
                className={`pt-6 pb-2 transition-opacity duration-300 ${
                  isAudioFocusActive ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {isPrimaryChinese ? (
                  <div>
                    {pericope.titleZh && (
                      <div
                        className="font-bold text-xl sm:text-2xl tracking-tight font-sans text-slate-900 dark:text-slate-100"
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
                    {pericope.titleEn && (
                      <div
                        className={`mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400 ${proseFontClass}`}
                      >
                        {pericope.titleEn}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
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
              </div>
            )}

            <div
              id={`verse-${verse.number}`}
              data-verse-number={verse.number}
              data-verse-lang={isPrimaryChinese ? 'zh' : 'en'}
              onClick={() => handleVerseClick(verse)}
              className={`relative hover:z-20 focus-within:z-20 has-[[aria-expanded=true]]:z-30 py-3.5 transition-all duration-300 cursor-text select-text scroll-mt-32 ${
                !isLastVerse && !nextHasPericope
                  ? 'border-b border-slate-200/80 dark:border-slate-800/80'
                  : ''
              } ${isDimmed ? 'opacity-40' : 'opacity-100'} ${
                isSelected && !highlight
                  ? 'bg-slate-100/80 dark:bg-slate-800/60 rounded-xl px-3 -mx-3'
                  : highlightClass
              }`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: isPrimaryChinese && pinyinMode === 'below' ? 2.3 : 1.8,
              }}
            >
              {(isSpeaking || isSelected) && (
                <span
                  aria-hidden="true"
                  className="absolute -left-3.5 sm:-left-5 top-2.5 bottom-2.5 w-[2.5px] rounded-full bg-slate-900 dark:bg-slate-100"
                />
              )}

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

              {isPrimaryChinese ? (
                <PinyinVerseText
                  text={text}
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
                  text={text}
                  enabled={redLetter}
                  className={proseFontClass}
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
          </React.Fragment>
        );
      })}
    </div>
  );
};
