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
import { getVerseTextForTranslation } from '../data/curatedChapters';
import { Bookmark, FileText } from 'lucide-react';

interface SingleReaderViewProps {
  chapterData: ChapterContent;
  primaryTrans: TranslationId;
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

export const SingleReaderView: React.FC<SingleReaderViewProps> = ({
  chapterData,
  primaryTrans,
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

  return (
    <div className="w-full max-w-3xl mx-auto pb-24 px-4 sm:px-6 font-sans text-slate-900 dark:text-slate-100">
      <div className="space-y-3">
        {chapterData.verses.map((verse) => {
          const verseKey = `${chapterData.bookId}.${chapterData.chapter}.${verse.number}`;
          const isSelected = activeVerseNumber === verse.number;
          const isSpeaking = speakingVerseNumber === verse.number;
          const highlight = highlights[verseKey];
          const isBookmarked = bookmarkedVerses.has(verseKey);
          const hasNote = Boolean(userNotes[verseKey]);

          const highlightBg = highlight ? HIGHLIGHT_STYLES[highlight] : '';
          const text = getVerseTextForTranslation(verse, primaryTrans);

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
                onClick={() => onSelectVerse(verse)}
                className={`p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border scroll-mt-28 ${
                  isSelected
                    ? 'border-slate-900 dark:border-slate-100 ring-2 ring-slate-900/30 dark:ring-slate-100/30 shadow-md bg-slate-100/80 dark:bg-slate-800/80'
                    : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white/60 dark:bg-slate-900/40'
                } ${isSpeaking ? 'ring-2 ring-slate-900 bg-slate-200/50 dark:bg-slate-800' : ''} ${highlightBg}`}
              >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1.5 select-none pt-0.5">
                  <span
                    className={`font-sans font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isSelected || isSpeaking
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {verse.number}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark?.(verse);
                    }}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isBookmarked
                        ? 'text-amber-600 dark:text-amber-400'
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
                    lineHeight: isPrimaryChinese && pinyinMode === 'below' ? 2.3 : 1.75,
                  }}
                >
                  {isPrimaryChinese ? (
                    <PinyinVerseText
                      text={text}
                      pinyinMode={pinyinMode}
                      pinyinSize={pinyinSize}
                      colorTones={colorTones}
                      theme={theme}
                      redLetter={redLetter}
                      onCharClick={onCharClick}
                    />
                  ) : (
                    <RedLetterText
                      text={text}
                      enabled={redLetter}
                      className="font-sans leading-relaxed"
                    />
                  )}
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
