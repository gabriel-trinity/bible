import React, { useMemo } from 'react';
import { PinyinDisplayMode, PinyinSize, AppTheme } from '../types/bible';
import { parseChineseVerseWithNotes, getToneColor } from '../services/pinyinService';
import { InlineNoteTooltip } from './InlineNoteTooltip';

interface PinyinVerseTextProps {
  text: string;
  pinyinMode: PinyinDisplayMode;
  pinyinSize: PinyinSize;
  colorTones: boolean;
  theme: AppTheme;
  redLetter?: boolean;
  onCharClick?: (char: string, pinyin: string, tone: number) => void;
  className?: string;
}

export const PinyinVerseText: React.FC<PinyinVerseTextProps> = ({
  text,
  pinyinMode,
  pinyinSize,
  colorTones,
  theme,
  redLetter = true,
  onCharClick,
  className = '',
}) => {
  const items = useMemo(() => parseChineseVerseWithNotes(text), [text]);

  if (pinyinMode === 'off') {
    return (
      <span className={`font-sans ${className}`}>
        {items.map((item, idx) => {
          if (item.kind === 'note') {
            return (
              <InlineNoteTooltip
                key={idx}
                note={item.noteText}
                pinyinMode={pinyinMode}
                pinyinSize={pinyinSize}
                colorTones={colorTones}
                theme={theme}
                onCharClick={onCharClick}
                className="mx-0.5 -mt-0.5"
              />
            );
          }

          const t = item.token;
          const isRed = redLetter && t.isRed;
          return (
            <span
              key={idx}
              className={isRed ? 'text-[#C20009] dark:text-[#f87171] font-medium' : undefined}
            >
              {t.char}
            </span>
          );
        })}
      </span>
    );
  }

  // Option 1: In parentheses next to characters, e.g. 起(qǐ) 初(chū)
  if (pinyinMode === 'inline') {
    return (
      <span className={`leading-relaxed font-sans ${className}`}>
        {items.map((item, idx) => {
          if (item.kind === 'note') {
            return (
              <InlineNoteTooltip
                key={idx}
                note={item.noteText}
                pinyinMode={pinyinMode}
                pinyinSize={pinyinSize}
                colorTones={colorTones}
                theme={theme}
                onCharClick={onCharClick}
                className="mx-0.5 -mt-0.5"
              />
            );
          }

          const t = item.token;
          const isRed = redLetter && t.isRed;
          const redClass = isRed ? 'text-[#C20009] dark:text-[#f87171] font-medium' : '';

          if (!t.isZh || !t.pinyin) {
            return (
              <span key={idx} className={redClass}>
                {t.char}
              </span>
            );
          }

          const toneClass = colorTones
            ? getToneColor(t.tone, theme)
            : isRed
            ? 'text-[#C20009]/80 dark:text-[#f87171]/80'
            : 'text-slate-500 dark:text-slate-400';

          return (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onCharClick?.(t.char, t.pinyin, t.tone);
              }}
              className="inline-block cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded px-0.5 transition-colors"
              title={`${t.char} [${t.pinyin}] - Click for audio & definition`}
            >
              <span className={redClass}>{t.char}</span>
              <span className={`text-[0.72em] font-sans font-medium ml-0.5 ${toneClass}`}>
                ({t.pinyin})
              </span>
            </span>
          );
        })}
      </span>
    );
  }

  // Option 2: Ruby above characters
  if (pinyinMode === 'above') {
    const pinyinSizeClass = `pinyin-${pinyinSize}`;
    return (
      <span className={`inline-block font-sans ${pinyinSizeClass} ${className}`}>
        {items.map((item, idx) => {
          if (item.kind === 'note') {
            return (
              <span
                key={idx}
                className="inline-flex flex-col-reverse items-center align-bottom mx-0.5"
              >
                <span className="inline-flex items-center justify-center h-[1.2em]">
                  <InlineNoteTooltip
                    note={item.noteText}
                    pinyinMode={pinyinMode}
                    pinyinSize={pinyinSize}
                    colorTones={colorTones}
                    theme={theme}
                    onCharClick={onCharClick}
                  />
                </span>
                <span
                  className="text-[0.62em] leading-[1.15] invisible select-none pointer-events-none"
                  aria-hidden="true"
                >
                  &nbsp;
                </span>
              </span>
            );
          }

          const t = item.token;
          const isRed = redLetter && t.isRed;
          const redClass = isRed ? 'text-[#C20009] dark:text-[#f87171] font-medium' : '';

          if (!t.isZh || !t.pinyin) {
            return (
              <ruby key={idx} className="select-text">
                <span className={`select-text ${redClass}`}>{t.char}</span>
                <rt className="invisible select-none" aria-hidden="true">
                  &nbsp;
                </rt>
              </ruby>
            );
          }

          const toneColorClass = colorTones
            ? getToneColor(t.tone, theme)
            : isRed
            ? 'text-[#C20009]/80 dark:text-[#f87171]/80'
            : 'text-slate-500 dark:text-slate-400';

          return (
            <ruby
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onCharClick?.(t.char, t.pinyin, t.tone);
              }}
              className="cursor-pointer group hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded transition-colors"
              title={`${t.char} [${t.pinyin}] - Click for audio & definition`}
            >
              <span
                className={`group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors ${redClass}`}
              >
                {t.char}
              </span>
              <rt className={`transition-colors font-sans ${toneColorClass}`}>{t.pinyin}</rt>
            </ruby>
          );
        })}
      </span>
    );
  }

  // Option 3: Hanyu Pinyin BELOW the text (Default layout)
  const sizeMap: Record<PinyinSize, string> = {
    sm: 'text-[0.52em]',
    base: 'text-[0.60em]',
    lg: 'text-[0.70em]',
  };
  const pinyinSubTextSize = sizeMap[pinyinSize] || sizeMap.base;

  return (
    <span className={`inline-flex flex-wrap items-start gap-y-2 font-sans ${className}`}>
      {items.map((item, idx) => {
        if (item.kind === 'note') {
          return (
            <span
              key={idx}
              className="inline-flex flex-col items-center justify-start mx-0.5 p-[1px] self-start"
            >
              {/* Inline note trigger aligned with the Chinese character row */}
              <span className="inline-flex items-center justify-center h-[1.25em] leading-tight">
                <InlineNoteTooltip
                  note={item.noteText}
                  pinyinMode={pinyinMode}
                  pinyinSize={pinyinSize}
                  colorTones={colorTones}
                  theme={theme}
                  onCharClick={onCharClick}
                />
              </span>
              {/* Invisible spacer matching the pinyin sub-row */}
              <span
                className={`${pinyinSubTextSize} font-sans leading-tight select-none mt-[2px] invisible pointer-events-none`}
                aria-hidden="true"
              >
                &nbsp;
              </span>
            </span>
          );
        }

        const t = item.token;
        const isRed = redLetter && t.isRed;
        const redClass = isRed ? 'text-[#C20009] dark:text-[#f87171] font-medium' : '';

        if (!t.isZh || !t.pinyin) {
          if (/^\s+$/.test(t.char)) {
            return <span key={idx} className="inline-block w-1.5" />;
          }

          return (
            <span
              key={idx}
              className="inline-flex flex-col items-center justify-start p-[1px] select-text self-start"
            >
              {/* Punctuation aligned with the Chinese character row */}
              <span
                className={`font-sans text-[1em] leading-tight select-text ${
                  isRed ? redClass : 'text-slate-900 dark:text-slate-100 font-normal'
                }`}
              >
                {t.char}
              </span>
              {/* Invisible spacer matching the pinyin sub-row */}
              <span
                className={`${pinyinSubTextSize} font-sans leading-tight select-none mt-[2px] invisible pointer-events-none`}
                aria-hidden="true"
              >
                &nbsp;
              </span>
            </span>
          );
        }

        const toneColorClass = colorTones
          ? getToneColor(t.tone, theme)
          : isRed
          ? 'text-[#C20009]/80 dark:text-[#f87171]/80'
          : 'text-slate-500 dark:text-slate-400';

        return (
          <span
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              onCharClick?.(t.char, t.pinyin, t.tone);
            }}
            className="inline-flex flex-col items-center justify-start mx-[1.5px] p-[1px] rounded group cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
            title={`${t.char} [${t.pinyin}] - Click for audio & definition`}
          >
            {/* Chinese Character on Top */}
            <span
              className={`font-sans text-[1em] leading-tight select-text group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors ${
                isRed ? redClass : 'font-normal'
              }`}
            >
              {t.char}
            </span>
            {/* Hanyu Pinyin directly BELOW the text */}
            <span
              className={`${pinyinSubTextSize} font-sans font-medium tracking-tight leading-tight select-none mt-[2px] transition-colors ${toneColorClass}`}
            >
              {t.pinyin}
            </span>
          </span>
        );
      })}
    </span>
  );
};
