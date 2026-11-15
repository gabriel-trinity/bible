import { stripVerseMarkup } from './pinyinService';

export type SpeechChannel = 'chapter' | 'votd' | 'single';

class SpeechManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private chineseVoice: SpeechSynthesisVoice | null = null;
  private englishVoice: SpeechSynthesisVoice | null = null;
  private playbackId: number = 0;
  private bilingualTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingSpeakTimer: ReturnType<typeof setTimeout> | null = null;
  private activeChannel: SpeechChannel | null = null;
  private channelStopListeners = new Map<SpeechChannel, Set<() => void>>();

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
      voices.find(
        (v) =>
          v.lang.toLowerCase() === 'en-us' &&
          (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online'))
      ) ||
      voices.find((v) => v.lang.toLowerCase() === 'en-us') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      null;
  }

  /**
   * Subscribe to notifications when playback on a specific channel is stopped
   * or interrupted by another channel (e.g., triggering single-verse speech while
   * chapter audio is playing).
   */
  public onChannelStopped(channel: SpeechChannel, listener: () => void): () => void {
    let set = this.channelStopListeners.get(channel);
    if (!set) {
      set = new Set();
      this.channelStopListeners.set(channel, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
    };
  }

  private notifyChannelStopped(channel: SpeechChannel | null) {
    if (!channel) return;
    const set = this.channelStopListeners.get(channel);
    if (!set) return;
    for (const listener of set) {
      try {
        listener();
      } catch {
        // Ignore listener errors
      }
    }
  }

  private clearTimers() {
    if (this.pendingSpeakTimer) {
      clearTimeout(this.pendingSpeakTimer);
      this.pendingSpeakTimer = null;
    }
    if (this.bilingualTimeout) {
      clearTimeout(this.bilingualTimeout);
      this.bilingualTimeout = null;
    }
  }

  private cancelActiveUtterance(): boolean {
    if (!this.synth) return false;
    const wasBusy = Boolean(
      this.pendingSpeakTimer ||
        this.bilingualTimeout ||
        this.currentUtterance ||
        this.synth.speaking ||
        this.synth.pending
    );

    this.clearTimers();

    if (this.currentUtterance) {
      // Detach handlers before cancel() so async canceled events never touch state
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }

    if (this.synth.speaking || this.synth.pending) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore browser cancel exceptions
      }
    }

    return wasBusy;
  }

  private speakUtterance(
    cleanText: string,
    lang: 'zh' | 'en',
    rate: number,
    sessionId: number,
    onComplete?: () => void
  ) {
    if (!this.synth || this.playbackId !== sessionId) return;

    if (!this.chineseVoice || !this.englishVoice) {
      this.initVoices();
    }

    // Recover if Chromium paused synthesis queue during tab switch / cancel
    if (this.synth.paused) {
      try {
        this.synth.resume();
      } catch {
        // Ignore
      }
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = Math.min(2, Math.max(0.5, rate));
    utterance.pitch = 1.0;

    if (lang === 'zh') {
      utterance.lang = 'zh-CN';
      if (this.chineseVoice) utterance.voice = this.chineseVoice;
    } else {
      utterance.lang = 'en-US';
      if (this.englishVoice) utterance.voice = this.englishVoice;
    }

    let settled = false;
    const finishSuccess = () => {
      if (settled) return;
      settled = true;
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      if (this.playbackId !== sessionId) return;
      onComplete?.();
    };

    utterance.onend = () => {
      finishSuccess();
    };

    utterance.onerror = (err) => {
      if (settled) return;
      settled = true;
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      // Never treat cancel/interrupt as completion — doing so when switching
      // audio races with the newly scheduled utterance and skips or stops it.
      if (err.error === 'canceled' || err.error === 'interrupted') {
        return;
      }
      if (this.playbackId !== sessionId) return;
      console.warn('Speech synthesis error:', err.error);
      onComplete?.();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public speak(
    text: string,
    lang: 'zh' | 'en' = 'zh',
    rate: number = 0.9,
    onEnd?: () => void,
    channel: SpeechChannel = 'single'
  ) {
    if (!this.synth) {
      onEnd?.();
      return;
    }

    const prevChannel = this.activeChannel;
    const sessionId = ++this.playbackId;
    const wasBusy = this.cancelActiveUtterance();
    this.activeChannel = channel;

    if (prevChannel && prevChannel !== channel) {
      this.notifyChannelStopped(prevChannel);
    }

    const cleanText = stripVerseMarkup(text, { stripNotes: true }).trim();
    if (!cleanText) {
      this.pendingSpeakTimer = setTimeout(() => {
        this.pendingSpeakTimer = null;
        if (this.playbackId !== sessionId) return;
        if (this.activeChannel === channel) this.activeChannel = null;
        onEnd?.();
      }, 40);
      return;
    }

    const handleComplete = () => {
      if (this.playbackId !== sessionId) return;
      if (!onEnd && this.activeChannel === channel) {
        this.activeChannel = null;
      }
      onEnd?.();
    };

    if (wasBusy) {
      // Yield slightly after cancel() so Chromium/WebKit flushes the previous
      // utterance cleanly and rapid audio switching / scrubbing debounces safely.
      this.pendingSpeakTimer = setTimeout(() => {
        this.pendingSpeakTimer = null;
        this.speakUtterance(cleanText, lang, rate, sessionId, handleComplete);
      }, 75);
    } else {
      // Call speak() synchronously when idle to preserve browser user-gesture activation.
      this.speakUtterance(cleanText, lang, rate, sessionId, handleComplete);
    }
  }

  public speakBilingual(
    zhText: string,
    enText: string,
    rate: number = 0.9,
    onEnd?: () => void,
    channel: SpeechChannel = 'chapter'
  ) {
    if (!this.synth) {
      onEnd?.();
      return;
    }

    const prevChannel = this.activeChannel;
    const sessionId = ++this.playbackId;
    const wasBusy = this.cancelActiveUtterance();
    this.activeChannel = channel;

    if (prevChannel && prevChannel !== channel) {
      this.notifyChannelStopped(prevChannel);
    }

    const cleanZh = stripVerseMarkup(zhText, { stripNotes: true }).trim();
    const cleanEn = stripVerseMarkup(enText, { stripNotes: true }).trim();

    const startSequence = () => {
      if (this.playbackId !== sessionId) return;

      const speakEnglishPart = () => {
        if (this.playbackId !== sessionId) return;
        if (!cleanEn) {
          onEnd?.();
          return;
        }
        this.speakUtterance(cleanEn, 'en', rate, sessionId, onEnd);
      };

      if (!cleanZh) {
        speakEnglishPart();
        return;
      }

      this.speakUtterance(cleanZh, 'zh', rate, sessionId, () => {
        if (this.playbackId !== sessionId) return;
        this.bilingualTimeout = setTimeout(() => {
          this.bilingualTimeout = null;
          speakEnglishPart();
        }, 300);
      });
    };

    if (wasBusy) {
      this.pendingSpeakTimer = setTimeout(() => {
        this.pendingSpeakTimer = null;
        startSequence();
      }, 75);
    } else {
      startSequence();
    }
  }

  public speakSingleCharacter(char: string) {
    this.speak(char, 'zh', 0.8, undefined, 'single');
  }

  public stop(channel?: SpeechChannel) {
    if (channel && this.activeChannel && this.activeChannel !== channel) {
      return;
    }
    const prevChannel = this.activeChannel;
    this.playbackId++;
    this.cancelActiveUtterance();
    this.activeChannel = null;
    if (prevChannel && (!channel || prevChannel === channel)) {
      this.notifyChannelStopped(prevChannel);
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth && (this.synth.speaking || this.pendingSpeakTimer !== null));
  }
}

export const speechService = new SpeechManager();
