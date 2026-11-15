import React, { useRef, useEffect, useCallback } from 'react';
import { VerseItem, VerseSelectionInfo } from '../types/bible';

const LONG_PRESS_DELAY_MS = 450;
const MOVE_THRESHOLD_PX = 10;

export function cleanSelectedVerseText(raw: string): string {
  return raw
    .replace(/\r?\n+/g, ' ')
    // Remove whitespace introduced between consecutive CJK characters/punctuation from flex tokens
    .replace(
      /([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef])\s+(?=[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef])/g,
      '$1'
    )
    .replace(/\s+/g, ' ')
    .trim();
}

export function getCleanSelectionText(sel: Selection | null): string {
  if (!sel || sel.isCollapsed) return '';
  try {
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const fragment = range.cloneContents();
      const wrapper = document.createElement('div');
      wrapper.appendChild(fragment);
      wrapper
        .querySelectorAll('[data-pinyin-annotation], [data-inline-note], rt')
        .forEach((el) => el.remove());
      const cleanedFromDom = cleanSelectedVerseText(wrapper.textContent || '');
      if (cleanedFromDom) {
        return cleanedFromDom;
      }
    }
  } catch {
    // Fallback to Selection.toString() if range cloning fails
  }
  return cleanSelectedVerseText(sel.toString());
}

function getVerseElementFromNode(node: Node | null): HTMLElement | null {
  if (!node) return null;
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
  return el ? el.closest<HTMLElement>('[data-verse-number]') : null;
}

function detectLanguage(text: string, node: Node | null): 'en' | 'zh' {
  const el = node
    ? node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node.parentElement
    : null;
  const langEl = el?.closest<HTMLElement>('[data-verse-lang]');
  const attr = langEl?.getAttribute('data-verse-lang');
  if (attr === 'zh' || attr === 'en') return attr;
  return /[\u4e00-\u9fff]/.test(text) ? 'zh' : 'en';
}

/**
 * Attempts to select and return the word/phrase under the pointer if no native selection exists yet.
 */
function selectTextNearPoint(
  clientX: number,
  clientY: number,
  verseContainer: HTMLElement
): string {
  try {
    const sel = window.getSelection();
    if (!sel) return '';

    let range: Range | null = null;
    if (typeof document.caretRangeFromPoint === 'function') {
      range = document.caretRangeFromPoint(clientX, clientY);
    } else if (typeof (document as any).caretPositionFromPoint === 'function') {
      const pos = (document as any).caretPositionFromPoint(clientX, clientY);
      if (pos && pos.offsetNode) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }

    if (!range || !verseContainer.contains(range.startContainer)) {
      return '';
    }

    // If inside a text node, expand to word or clause around offset
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const text = range.startContainer.textContent || '';
      const offset = range.startOffset;

      if (/[\u4e00-\u9fff]/.test(text)) {
        // Inside Chinese verse container, select the Chinese phrase/verse
        const verseLangEl =
          range.startContainer.parentElement?.closest<HTMLElement>('[data-verse-lang="zh"]');
        if (verseLangEl) {
          const fullRange = document.createRange();
          fullRange.selectNodeContents(verseLangEl);
          sel.removeAllRanges();
          sel.addRange(fullRange);
          return getCleanSelectionText(sel);
        }
      } else {
        // Expand to English clause or word around offset
        let start = offset;
        let end = offset;
        while (start > 0 && /[\w’'-]/.test(text[start - 1])) start--;
        while (end < text.length && /[\w’'-]/.test(text[end])) end++;
        if (end > start) {
          range.setStart(range.startContainer, start);
          range.setEnd(range.startContainer, end);
          sel.removeAllRanges();
          sel.addRange(range);
          return getCleanSelectionText(sel);
        }
      }
    }
  } catch {
    // Ignore caret selection edge cases across browsers
  }
  return '';
}

interface UseVerseTextSelectionOptions {
  verses: VerseItem[];
  onSelectVerse: (verse: VerseItem, selection?: VerseSelectionInfo) => void;
}

export function useVerseTextSelection({ verses, onSelectVerse }: UseVerseTextSelectionOptions) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{
    x: number;
    y: number;
    verseNum: number;
    target: HTMLElement;
    verseEl: HTMLElement;
  } | null>(null);
  const suppressNextClickRef = useRef(false);
  const lastDispatchedSelectionRef = useRef<string>('');

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Capture drag selection whenever mouse/touch drag completes inside a verse
  const checkAndEmitSelection = useCallback(
    (trigger: 'drag' | 'longpress', fallbackVerseEl?: HTMLElement | null) => {
      const sel = window.getSelection();
      const cleaned = getCleanSelectionText(sel);
      if (!cleaned) return false;

      const verseEl =
        getVerseElementFromNode(sel?.anchorNode || null) ||
        getVerseElementFromNode(sel?.focusNode || null) ||
        fallbackVerseEl ||
        null;
      if (!verseEl) return false;

      const verseNum = Number(verseEl.getAttribute('data-verse-number'));
      const matchedVerse = verses.find((v) => v.number === verseNum);
      if (!matchedVerse) return false;

      const sig = `${verseNum}:${trigger}:${cleaned}`;
      if (lastDispatchedSelectionRef.current === sig) return true;
      lastDispatchedSelectionRef.current = sig;
      setTimeout(() => {
        if (lastDispatchedSelectionRef.current === sig) {
          lastDispatchedSelectionRef.current = '';
        }
      }, 400);

      const lang = detectLanguage(cleaned, sel?.anchorNode || verseEl);
      onSelectVerse(matchedVerse, {
        selectedText: cleaned,
        trigger,
        lang,
      });
      return true;
    },
    [verses, onSelectVerse]
  );

  useEffect(() => {
    let selectionDebounce: ReturnType<typeof setTimeout> | null = null;

    const handleSelectionChange = () => {
      if (selectionDebounce) clearTimeout(selectionDebounce);
      selectionDebounce = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const cleaned = getCleanSelectionText(sel);
        if (!cleaned) return;
        const verseEl =
          getVerseElementFromNode(sel.anchorNode) || getVerseElementFromNode(sel.focusNode);
        if (!verseEl) return;

        // If a pointer drag is still active, wait for pointerup/touchend on desktop;
        // on mobile long-press handle adjustments, update live!
        if (!pointerStartRef.current) {
          checkAndEmitSelection('drag', verseEl);
        }
      }, 180);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      if (selectionDebounce) clearTimeout(selectionDebounce);
      document.removeEventListener('selectionchange', handleSelectionChange);
      clearLongPressTimer();
    };
  }, [checkAndEmitSelection, clearLongPressTimer]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Ignore interactive controls inside verse cards
      if (target.closest('button, a, input, textarea, [data-inline-note]')) return;

      const verseEl = target.closest<HTMLElement>('[data-verse-number]');
      if (!verseEl) return;

      const verseNum = Number(verseEl.getAttribute('data-verse-number'));
      if (!verseNum) return;

      clearLongPressTimer();
      suppressNextClickRef.current = false;

      pointerStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        verseNum,
        target,
        verseEl,
      };

      const startX = e.clientX;
      const startY = e.clientY;

      longPressTimerRef.current = setTimeout(() => {
        const currentStart = pointerStartRef.current;
        if (!currentStart) return;

        const matchedVerse = verses.find((v) => v.number === currentStart.verseNum);
        if (!matchedVerse) return;

        suppressNextClickRef.current = true;
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(15);
        }

        // Check if OS already selected a word on touch long-press
        const sel = window.getSelection();
        let selectedText = sel && !sel.isCollapsed ? getCleanSelectionText(sel) : '';

        if (!selectedText) {
          selectedText = selectTextNearPoint(startX, startY, currentStart.verseEl);
        }

        const lang = detectLanguage(selectedText, currentStart.target);
        onSelectVerse(matchedVerse, {
          selectedText,
          trigger: 'longpress',
          lang,
        });
      }, LONG_PRESS_DELAY_MS);
    },
    [verses, onSelectVerse, clearLongPressTimer]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const start = pointerStartRef.current;
      if (!start) return;
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
        clearLongPressTimer();
      }
    },
    [clearLongPressTimer]
  );

  const handlePointerUpOrCancel = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const start = pointerStartRef.current;
      clearLongPressTimer();
      pointerStartRef.current = null;

      if (e.type === 'pointercancel' || !start) return;

      // Delay slightly so browser selection finalizes on mouseup/touchend
      setTimeout(() => {
        const emitted = checkAndEmitSelection('drag', start.verseEl);
        if (emitted) {
          suppressNextClickRef.current = true;
          setTimeout(() => {
            suppressNextClickRef.current = false;
          }, 250);
        }
      }, 30);
    },
    [clearLongPressTimer, checkAndEmitSelection]
  );

  const handleVerseClick = useCallback(
    (verse: VerseItem) => {
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        return;
      }
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && getCleanSelectionText(sel).length > 0) {
        checkAndEmitSelection('drag');
        return;
      }
      onSelectVerse(verse);
    },
    [onSelectVerse, checkAndEmitSelection]
  );

  return {
    containerSelectionHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUpOrCancel,
      onPointerCancel: handlePointerUpOrCancel,
    },
    handleVerseClick,
  };
}
