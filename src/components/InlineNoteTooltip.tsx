import React, { useState, useRef, useEffect, useId, useCallback, useMemo } from 'react';
import { AppTheme, PinyinDisplayMode, PinyinSize, PinyinCharToken } from '../types/bible';
import { tokenizeChineseWithPinyin, getToneColor } from '../services/pinyinService';
import { speechService } from '../services/speechService';

interface InlineNoteTooltipProps {
  note: string;
  badgeLabel?: string;
  pinyinMode?: PinyinDisplayMode;
  pinyinSize?: PinyinSize;
  colorTones?: boolean;
  theme?: AppTheme;
  onCharClick?: (char: string, pinyin: string, tone: number) => void;
  className?: string;
}

const NOTE_OPEN_EVENT = 'bible-inline-note-open';
const HAS_CHINESE_RE = /[\u4e00-\u9fa5]/;

type TooltipSegment =
  | { kind: 'zh'; token: PinyinCharToken }
  | { kind: 'space' }
  | { kind: 'text'; text: string };

function groupTooltipTokens(tokens: PinyinCharToken[]): TooltipSegment[] {
  const segments: TooltipSegment[] = [];
  let textBuffer = '';

  const flushText = () => {
    if (textBuffer) {
      segments.push({ kind: 'text', text: textBuffer });
      textBuffer = '';
    }
  };

  for (const token of tokens) {
    if (token.isZh && token.pinyin) {
      flushText();
      segments.push({ kind: 'zh', token });
    } else if (/^\s+$/.test(token.char)) {
      flushText();
      segments.push({ kind: 'space' });
    } else {
      textBuffer += token.char;
    }
  }
  flushText();

  return segments;
}

export const InlineNoteTooltip: React.FC<InlineNoteTooltipProps> = ({
  note,
  badgeLabel,
  pinyinMode = 'below',
  pinyinSize = 'base',
  colorTones = false,
  theme = 'light',
  onCharClick,
  className = '',
}) => {
  const instanceId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [positionClasses, setPositionClasses] = useState<string>(
    'left-0 max-w-[min(21rem,calc(100vw-3rem))] sm:max-w-[28rem]'
  );

  const containerRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasChinese = useMemo(() => HAS_CHINESE_RE.test(note), [note]);
  const tooltipSegments = useMemo(
    () => (hasChinese ? groupTooltipTokens(tokenizeChineseWithPinyin(note)) : []),
    [hasChinese, note]
  );

  const clearCloseTimer = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const updateHorizontalAlignment = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn || typeof window === 'undefined') return;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth || 375;

    if (vw >= 640) {
      if (rect.left + 448 < vw - 16) {
        setPositionClasses('left-0 sm:max-w-[28rem]');
      } else if (rect.right - 448 > 16) {
        setPositionClasses('right-0 sm:max-w-[28rem]');
      } else {
        setPositionClasses('left-1/2 -translate-x-1/2 sm:max-w-[28rem]');
      }
      return;
    }

    // Mobile viewport (< 640px): 5-zone horizontal clamping so tooltip never clips left or right
    const frac = rect.left / vw;
    if (frac < 0.16) {
      setPositionClasses('left-0 max-w-[min(21rem,calc(100vw-3.5rem))]');
    } else if (frac < 0.34) {
      setPositionClasses('-left-10 max-w-[min(20rem,calc(100vw-5rem))]');
    } else if (frac < 0.5) {
      setPositionClasses('-left-20 max-w-[min(19rem,calc(100vw-6rem))]');
    } else if (frac < 0.68) {
      setPositionClasses('-right-20 max-w-[min(19rem,calc(100vw-6rem))]');
    } else if (frac < 0.84) {
      setPositionClasses('-right-10 max-w-[min(20rem,calc(100vw-5rem))]');
    } else {
      setPositionClasses('right-0 max-w-[min(21rem,calc(100vw-3.5rem))]');
    }
  }, []);

  const openTooltip = useCallback(
    (pin: boolean) => {
      clearCloseTimer();
      updateHorizontalAlignment();
      setIsOpen(true);
      if (pin) {
        setIsPinned(true);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(NOTE_OPEN_EVENT, { detail: instanceId }));
      }
    },
    [clearCloseTimer, instanceId, updateHorizontalAlignment]
  );

  const closeTooltip = useCallback(() => {
    clearCloseTimer();
    setIsOpen(false);
    setIsPinned(false);
  }, [clearCloseTimer]);

  // Close when another inline note tooltip opens anywhere in the reader
  useEffect(() => {
    const handleOtherOpen = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail !== instanceId) {
        closeTooltip();
      }
    };
    window.addEventListener(NOTE_OPEN_EVENT, handleOtherOpen);
    return () => {
      window.removeEventListener(NOTE_OPEN_EVENT, handleOtherOpen);
    };
  }, [instanceId, closeTooltip]);

  // Dismiss on outside tap/click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeTooltip();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTooltip();
      }
    };

    const handleResize = () => {
      updateHorizontalAlignment();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, closeTooltip, updateHorizontalAlignment]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const canHover = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const handleMouseEnter = () => {
    if (canHover()) {
      openTooltip(false);
    }
  };

  const handleMouseLeave = () => {
    if (canHover() && !isPinned) {
      clearCloseTimer();
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 140);
    }
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOpen && isPinned) {
      closeTooltip();
    } else if (isOpen && !canHover()) {
      closeTooltip();
    } else {
      openTooltip(true);
    }
  };

  const handleCharacterTap = (
    e: React.MouseEvent,
    char: string,
    pinyinStr: string,
    tone: number
  ) => {
    e.stopPropagation();
    if (onCharClick) {
      onCharClick(char, pinyinStr, tone);
    } else {
      speechService.speak(char, 'zh', 0.85);
    }
  };

  const renderNoteContent = () => {
    if (!hasChinese) {
      return <span className="block text-[13px] leading-relaxed">{note}</span>;
    }

    // Always include Hanyu Pinyin inside Chinese note tooltips:
    // match 'above' or 'inline' when active, otherwise default to 'below'.
    const effectiveMode: 'below' | 'above' | 'inline' =
      pinyinMode === 'above' ? 'above' : pinyinMode === 'inline' ? 'inline' : 'below';

    const subSizeClass =
      pinyinSize === 'sm'
        ? 'text-[9px]'
        : pinyinSize === 'lg'
        ? 'text-[11px]'
        : 'text-[10px]';

    if (effectiveMode === 'inline') {
      return (
        <span className="block text-[13.5px] leading-relaxed font-sans">
          {tooltipSegments.map((seg, idx) => {
            if (seg.kind === 'space') {
              return <span key={idx}> </span>;
            }
            if (seg.kind === 'text') {
              return <span key={idx}>{seg.text}</span>;
            }
            const t = seg.token;
            const toneClass = colorTones
              ? getToneColor(t.tone, theme)
              : 'text-slate-500 dark:text-slate-400';

            return (
              <span
                key={idx}
                onClick={(e) => handleCharacterTap(e, t.char, t.pinyin, t.tone)}
                className="inline-block cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-0.5 transition-colors"
                title={`${t.char} [${t.pinyin}]`}
              >
                <span>{t.char}</span>
                <span className={`${subSizeClass} font-medium ml-0.5 ${toneClass}`}>
                  ({t.pinyin})
                </span>
              </span>
            );
          })}
        </span>
      );
    }

    if (effectiveMode === 'above') {
      return (
        <span className="inline-flex flex-wrap items-end gap-y-1 text-[14px] leading-snug font-sans">
          {tooltipSegments.map((seg, idx) => {
            if (seg.kind === 'space') {
              return <span key={idx} className="inline-block w-1.5" />;
            }
            if (seg.kind === 'text') {
              return (
                <ruby key={idx} className="select-text">
                  <span className="select-text">{seg.text}</span>
                  <rt className={`${subSizeClass} invisible select-none`} aria-hidden="true">
                    &nbsp;
                  </rt>
                </ruby>
              );
            }
            const t = seg.token;
            const toneClass = colorTones
              ? getToneColor(t.tone, theme)
              : 'text-slate-500 dark:text-slate-400';

            return (
              <ruby
                key={idx}
                onClick={(e) => handleCharacterTap(e, t.char, t.pinyin, t.tone)}
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-[1px] transition-colors"
                title={`${t.char} [${t.pinyin}]`}
              >
                <span>{t.char}</span>
                <rt className={`${subSizeClass} font-sans font-medium ${toneClass}`}>
                  {t.pinyin}
                </rt>
              </ruby>
            );
          })}
        </span>
      );
    }

    // Default: Hanyu Pinyin directly below each Chinese character, with punctuation aligned to the Chinese row
    return (
      <span className="inline-flex flex-wrap items-start gap-y-1.5 font-sans">
        {tooltipSegments.map((seg, idx) => {
          if (seg.kind === 'space') {
            return <span key={idx} className="inline-block w-1.5" />;
          }

          if (seg.kind === 'text') {
            return (
              <span
                key={idx}
                className="inline-flex flex-col items-center justify-start p-[1px] select-text self-start"
              >
                <span className="text-[14px] leading-tight text-slate-800 dark:text-slate-100 select-text">
                  {seg.text}
                </span>
                <span
                  className={`${subSizeClass} font-sans leading-tight select-none mt-[2px] invisible pointer-events-none`}
                  aria-hidden="true"
                >
                  &nbsp;
                </span>
              </span>
            );
          }

          const t = seg.token;
          const toneClass = colorTones
            ? getToneColor(t.tone, theme)
            : 'text-slate-500 dark:text-slate-400';

          return (
            <span
              key={idx}
              onClick={(e) => handleCharacterTap(e, t.char, t.pinyin, t.tone)}
              className="inline-flex flex-col items-center justify-start mx-[1px] p-[1px] rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`${t.char} [${t.pinyin}]`}
            >
              <span className="text-[14px] leading-tight text-slate-800 dark:text-slate-100 select-text">
                {t.char}
              </span>
              <span
                className={`${subSizeClass} font-sans font-medium tracking-tight leading-tight select-none mt-[2px] ${toneClass}`}
              >
                {t.pinyin}
              </span>
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => e.stopPropagation()}
      className={`relative inline-flex items-center justify-center align-middle select-none ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={badgeLabel || '查看注释 (View note)'}
        aria-expanded={isOpen}
        onClick={handleToggleClick}
        className={`relative inline-flex items-center justify-center rounded-full p-0.5 transition-colors duration-150 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 before:content-[''] before:absolute before:-inset-2 ${
          isOpen
            ? 'text-slate-700 dark:text-slate-100 bg-slate-200/70 dark:bg-slate-700/70'
            : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="w-[15px] h-[15px] shrink-0"
          fill="none"
        >
          <path
            d="M12 3.75c-5.11 0-9.25 3.47-9.25 7.75 0 2.02.93 3.86 2.45 5.24-.22 1.24-.82 2.44-1.64 3.26 1.72-.16 3.48-.72 4.78-1.56 1.13.4 2.36.61 3.66.61 5.11 0 9.25-3.47 9.25-7.75S17.11 3.75 12 3.75Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.25" cy="11.4" r="1.2" fill="currentColor" />
          <circle cx="12" cy="11.4" r="1.2" fill="currentColor" />
          <circle cx="15.75" cy="11.4" r="1.2" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <span
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-full mt-1.5 z-50 ${positionClasses} w-max rounded-md border border-slate-200/95 dark:border-slate-700/90 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 font-normal font-sans tracking-normal shadow-[0_4px_18px_rgba(15,23,42,0.11),0_1px_3px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.55)] text-left whitespace-normal break-words select-text cursor-auto animate-in fade-in zoom-in-95 duration-150`}
        >
          {badgeLabel && (
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              {badgeLabel}
            </span>
          )}
          {renderNoteContent()}
        </span>
      )}
    </span>
  );
};
