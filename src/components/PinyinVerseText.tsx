import React, { useMemo } from 'react';
import { PinyinDisplayMode, PinyinSize, AppTheme } from '../types/bible';
import { tokenizeChineseWithPinyin, getToneColor } from '../services/pinyinService';

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
  const tokens = useMemo(() => tokenizeChineseWithPinyin(text), [text]);

  if (pinyinMode === 'off') {
    const cleanText = text.replace(/<\/?red>/g, '');
    if (!redLetter || !text.includes('<red>')) {
      return <span className={`font-sans ${className}`}>{cleanText}</span>;
    }
    const parts = text.split(/(<red>[\s\S]*?<\/red>)/g);
    return (
      <span className={`font-sans ${className}`}>
        {parts.map((p, i) => {
          if (p.startsWith('<red>') && p.endsWith('</red>')) {
            return (
              <span
                key={i}
                style={{ color: '#C20009' }}
                className="text-[#C20009] font-medium"
              >
                {p.slice(5, -6)}
              </span>
            );
          }
          return <span key={i}>{p}</span>;
        })}
      </span>
    );
  }

  // Option 1: In parentheses next to characters, e.g. 起(qǐ) 初(chū)
  if (pinyinMode === 'inline') {
    return (
      <span className={`leading-relaxed font-sans ${className}`}>
        {tokens.map((t, idx) => {
          const isRed = redLetter && t.isRed;
          const redClass = isRed ? 'text-[#C20009] font-medium' : '';
          if (!t.isZh || !t.pinyin) {
            return (
              <span
                key={idx}
                style={isRed ? { color: '#C20009' } : undefined}
                className={redClass}
              >
                {t.char}
              </span>
            );
          }
          const toneClass = colorTones
            ? getToneColor(t.tone, theme)
            : isRed
            ? 'text-[#C20009]/80'
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
              <span
                style={isRed ? { color: '#C20009' } : undefined}
                className={redClass}
              >
                {t.char}
              </span>
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
        {tokens.map((t, idx) => {
          const isRed = redLetter && t.isRed;
          const redClass = isRed ? 'text-[#C20009] font-medium' : '';
          if (!t.isZh || !t.pinyin) {
            return (
              <ruby
                key={idx}
                className="select-text"
              >
                <span
                  style={isRed ? { color: '#C20009' } : undefined}
                  className={`select-text ${redClass}`}
                >
                  {t.char}
                </span>
                <rt className="invisible select-none" aria-hidden="true">&nbsp;</rt>
              </ruby>
            );
          }

          const toneColorClass = colorTones
            ? getToneColor(t.tone, theme)
            : isRed
            ? 'text-[#C20009]/80'
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
                style={isRed ? { color: '#C20009' } : undefined}
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
      {tokens.map((t, idx) => {
        const isRed = redLetter && t.isRed;
        const redClass = isRed ? 'text-[#C20009] font-medium' : '';

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
                style={isRed ? { color: '#C20009' } : undefined}
                className={`font-sans text-[1em] leading-tight select-text ${
                  isRed ? redClass : 'text-slate-900 dark:text-slate-100 font-normal'
                }`}
              >
                {t.char}
              </span>
              {/* Invisible spacer matching the pinyin sub-row so alignment and height remain completely uniform */}
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
          ? 'text-[#C20009]/80'
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
              style={isRed ? { color: '#C20009' } : undefined}
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
