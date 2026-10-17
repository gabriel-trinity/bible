import { pinyin } from 'pinyin-pro';
import { PinyinCharToken } from '../types/bible';

// Common Biblical & Chinese vocabulary dictionary to enrich the character inspector
export const BIBLICAL_VOCAB_GLOSS: Record<string, { pinyin: string; en: string; note?: string }> = {
  神: { pinyin: 'shén', en: 'God / deity', note: 'Used throughout CUV for Elohim / Theos' },
  上帝: { pinyin: 'shàng dì', en: 'Sovereign God / Lord on High', note: 'Alternative Chinese term for God' },
  天: { pinyin: 'tiān', en: 'Heaven / sky', note: 'The realm of God or celestial heavens' },
  地: { pinyin: 'dì', en: 'Earth / land / ground', note: 'The material earth created by God' },
  创造: { pinyin: 'chuàng zào', en: 'Create / creation', note: 'Hebrew: Bara (ex nihilo creation)' },
  起初: { pinyin: 'qǐ chū', en: 'In the beginning', note: 'Hebrew: Bereshit; Greek: En arche' },
  光: { pinyin: 'guāng', en: 'Light', note: 'Symbol of divine purity, truth, and life' },
  暗: { pinyin: 'àn', en: 'Darkness', note: 'Opposite of light, chaos, spiritual blindness' },
  爱: { pinyin: 'ài', en: 'Love / divine agape', note: 'God’s unconditional covenant love' },
  道: { pinyin: 'dào', en: 'The Word / Logos / Way', note: 'Greek: Logos (John 1:1)' },
  灵: { pinyin: 'líng', en: 'Spirit / soul', note: 'Ruach / Pneuma; Holy Spirit' },
  圣: { pinyin: 'shèng', en: 'Holy / sacred', note: 'Set apart, consecrated to God' },
  主: { pinyin: 'zhǔ', en: 'Lord / Master', note: 'Kyrios / Adonai' },
  信: { pinyin: 'xìn', en: 'Faith / believe / trust', note: 'Pistis: trusting dependence on God' },
  望: { pinyin: 'wàng', en: 'Hope / expectation', note: 'Elpis: confident assurance in God’s promises' },
  恩: { pinyin: 'ēn', en: 'Grace / favor', note: 'Charis / Chen: unmerited divine favor' },
  真理: { pinyin: 'zhēn lǐ', en: 'Truth', note: 'Aletheia: divine reality and truth' },
  生命: { pinyin: 'shēng mìng', en: 'Life / eternal life', note: 'Zoe: the fullness of life in Christ' },
  平安: { pinyin: 'píng ān', en: 'Peace / shalom', note: 'Hebrew: Shalom (wholeness, peace with God)' },
  救: { pinyin: 'jiù', en: 'Save / rescue / redeem', note: 'Salvation from sin through Jesus' },
  耶稣: { pinyin: 'yē sū', en: 'Jesus', note: 'From Yeshua: The LORD is salvation' },
  基督: { pinyin: 'jī dū', en: 'Christ / Messiah', note: 'The Anointed One' },
  父: { pinyin: 'fù', en: 'Father', note: 'Abba / Heavenly Father' },
  子: { pinyin: 'zǐ', en: 'Son', note: 'Son of God (Huios tou Theou)' },
  永生: { pinyin: 'yǒng shēng', en: 'Eternal life', note: 'Life in the kingdom of God' },
  心: { pinyin: 'xīn', en: 'Heart / inner being', note: 'The seat of emotions, will, and conscience' },
  义: { pinyin: 'yì', en: 'Righteousness / justice', note: 'Tzedakah / Dikaiosyne' },
  牧者: { pinyin: 'mù zhě', en: 'Shepherd', note: 'The Lord is my shepherd (Psalm 23)' },
  祷告: { pinyin: 'dǎo gào', en: 'Pray / prayer', note: 'Communing with the Father' },
  荣耀: { pinyin: 'róng yào', en: 'Glory / honor', note: 'Kabod / Doxa: manifest divine presence' },
  喜乐: { pinyin: 'xǐ lè', en: 'Joy / gladness', note: 'Rejoice in the Lord always (Phil 4:4)' },
};

// Memory cache for parsed verses
const parseCache = new Map<string, PinyinCharToken[]>();

export function tokenizeChineseWithPinyin(text: string): PinyinCharToken[] {
  if (parseCache.has(text)) {
    return parseCache.get(text)!;
  }

  const hasRed = text.includes('<red>');
  const cleanText = text.replace(/<\/?red>/g, '');

  try {
    const rawTokens = pinyin(cleanText, { type: 'all' });

    // Calculate character offsets for red spans
    const redRanges: [number, number][] = [];
    if (hasRed) {
      let cleanCursor = 0;
      let rawCursor = 0;
      while (rawCursor < text.length) {
        if (text.startsWith('<red>', rawCursor)) {
          const endIdx = text.indexOf('</red>', rawCursor + 5);
          const content = endIdx !== -1 ? text.substring(rawCursor + 5, endIdx) : text.substring(rawCursor + 5);
          const start = cleanCursor;
          cleanCursor += content.length;
          redRanges.push([start, cleanCursor]);
          rawCursor = endIdx !== -1 ? endIdx + 6 : text.length;
        } else {
          cleanCursor++;
          rawCursor++;
        }
      }
    }

    let cursor = 0;
    const result: PinyinCharToken[] = rawTokens.map((item) => {
      const isRed = redRanges.some(([start, end]) => cursor >= start && cursor < end);
      cursor += item.origin.length;
      return {
        char: item.origin,
        pinyin: item.pinyin,
        tone: item.num || 0,
        isZh: item.isZh ?? false,
        isRed,
      };
    });

    parseCache.set(text, result);
    return result;
  } catch (err) {
    console.error('Error tokenizing pinyin:', err);
    // Fallback: split by character without pinyin
    return Array.from(cleanText).map((char) => ({
      char,
      pinyin: '',
      tone: 0,
      isZh: /[\u4e00-\u9fa5]/.test(char),
    }));
  }
}

export function getToneColor(tone: number, theme: 'parchment' | 'light' | 'sepia' | 'dark' = 'parchment'): string {
  // Return tailored subtle tone colors
  if (theme === 'dark') {
    switch (tone) {
      case 1:
        return 'text-sky-300';
      case 2:
        return 'text-emerald-300';
      case 3:
        return 'text-purple-300';
      case 4:
        return 'text-amber-300';
      default:
        return 'text-stone-400';
    }
  }

  // Light & Parchment modes
  switch (tone) {
    case 1:
      return 'text-sky-700';
    case 2:
      return 'text-emerald-700';
    case 3:
      return 'text-purple-700';
    case 4:
      return 'text-amber-800';
    default:
      return 'text-stone-500';
  }
}

export function getWordExplanation(charOrWord: string): { pinyin: string; en: string; note?: string } {
  if (BIBLICAL_VOCAB_GLOSS[charOrWord]) {
    return BIBLICAL_VOCAB_GLOSS[charOrWord];
  }

  const p = pinyin(charOrWord);
  return {
    pinyin: p,
    en: `Chinese character: ${charOrWord}`,
    note: 'Biblical context character',
  };
}
