class SpeechManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private chineseVoice: SpeechSynthesisVoice | null = null;
  private englishVoice: SpeechSynthesisVoice | null = null;
  private isCancelled: boolean = false;
  private bilingualTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  public initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Chinese voice preference (Mandarin / Putonghua)
    const mandarinVoices = voices.filter((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return (
        (lang.startsWith('zh') || lang.startsWith('cmn')) &&
        !name.includes('cantonese') &&
        !name.includes('yue') &&
        !lang.includes('hk')
      );
    });

    this.chineseVoice =
      mandarinVoices.find((v) => v.lang.toLowerCase() === 'zh-cn' || v.lang.toLowerCase() === 'zh_cn') ||
      mandarinVoices.find((v) => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online')) ||
      mandarinVoices[0] ||
      voices.find((v) => v.lang.toLowerCase().startsWith('zh')) ||
      null;

    // English voice preference
    this.englishVoice =
      voices.find((v) => v.lang.toLowerCase() === 'en-us' && (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online'))) ||
      voices.find((v) => v.lang.toLowerCase() === 'en-us') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      null;
  }

  public speak(
    text: string,
    lang: 'zh' | 'en' = 'zh',
    rate: number = 0.9,
    onEnd?: () => void
  ) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.stop();
    this.isCancelled = false;

    // Try finding voices again if not yet loaded
    if (!this.chineseVoice || !this.englishVoice) {
      this.initVoices();
    }

    const cleanText = text.trim();
    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    if (lang === 'zh') {
      utterance.lang = 'zh-CN';
      if (this.chineseVoice) utterance.voice = this.chineseVoice;
    } else {
      utterance.lang = 'en-US';
      if (this.englishVoice) utterance.voice = this.englishVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (!this.isCancelled && onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      if (err.error !== 'canceled' && err.error !== 'interrupted') {
        console.warn('Speech synthesis note:', err);
      }
      this.currentUtterance = null;
      if (!this.isCancelled && onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public speakBilingual(
    zhText: string,
    enText: string,
    rate: number = 0.9,
    onEnd?: () => void
  ) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.stop();
    this.isCancelled = false;

    // Speak Chinese first
    this.speak(zhText, 'zh', rate, () => {
      if (this.isCancelled) return;
      this.bilingualTimeout = setTimeout(() => {
        if (this.isCancelled) return;
        this.speak(enText, 'en', rate, () => {
          if (this.isCancelled) return;
          if (onEnd) onEnd();
        });
      }, 350);
    });
  }

  public speakSingleCharacter(char: string) {
    this.speak(char, 'zh', 0.8);
  }

  public stop() {
    this.isCancelled = true;
    if (this.bilingualTimeout) {
      clearTimeout(this.bilingualTimeout);
      this.bilingualTimeout = null;
    }
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

export const speechService = new SpeechManager();
