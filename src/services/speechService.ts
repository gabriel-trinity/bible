class SpeechManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private chineseVoice: SpeechSynthesisVoice | null = null;
  private englishVoice: SpeechSynthesisVoice | null = null;
  private onVerseCompleteCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();

    // Chinese voice preference (Mandarin)
    this.chineseVoice =
      voices.find((v) => v.lang === 'zh-CN' || v.lang.startsWith('zh-CN')) ||
      voices.find((v) => v.lang.startsWith('zh')) ||
      null;

    // English voice preference
    this.englishVoice =
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;
  }

  public speak(
    text: string,
    lang: 'zh' | 'en' = 'zh',
    rate: number = 0.9,
    onEnd?: () => void
  ) {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
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
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      console.warn('Speech synthesis notification:', err);
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public speakSingleCharacter(char: string) {
    this.speak(char, 'zh', 0.8);
  }

  public stop() {
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
