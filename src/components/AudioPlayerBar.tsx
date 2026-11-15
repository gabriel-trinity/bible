import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Check } from 'lucide-react';
import { AppTheme, TranslationId } from '../types/bible';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  currentVerseNum: number;
  totalVerses: number;
  currentTimeSec: number;
  totalDurationSec: number;
  speechRate: number;
  focusAudioVerse: boolean;
  audioLanguage: 'zh' | 'en' | 'bilingual';
  primaryTrans: TranslationId;
  theme: AppTheme;
  bookNameZh: string;
  bookNameEn: string;
  chapter: number;
  onPlayPause: () => void;
  onSkipSeconds: (deltaSec: number) => void;
  onSeekSeconds: (targetSec: number) => void;
  onChangeRate: (rate: number) => void;
  onChangeLanguage: (lang: 'zh' | 'en' | 'bilingual') => void;
  onToggleFocusVerse: () => void;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.75, 1, 1.5, 2];

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const Rewind10Icon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12.5 5.25a6.75 6.75 0 1 1-6.56 5.2"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M12.5 2.75 9.75 5.25l2.75 2.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="12"
      y="14.5"
      textAnchor="middle"
      fill="currentColor"
      fontSize="7.2"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      10
    </text>
  </svg>
);

const Forward10Icon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M11.5 5.25a6.75 6.75 0 1 0 6.56 5.2"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M11.5 2.75 14.25 5.25l-2.75 2.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="12"
      y="14.5"
      textAnchor="middle"
      fill="currentColor"
      fontSize="7.2"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      10
    </text>
  </svg>
);

const VoiceSpeakIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="9" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.75" />
    <path
      d="M3.75 18.5c0-2.6 2.35-4.5 5.25-4.5s5.25 1.9 5.25 4.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M15.75 8.5c.9.9.9 2.6 0 3.5M18.25 6.5c1.75 1.85 1.75 5.65 0 7.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

const FollowScriptIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="6" width="2.5" height="6" rx="1" fill="currentColor" />
    <path
      d="M9 7h11M9 11h11M5 15h15M5 19h11"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isPlaying,
  currentVerseNum,
  totalVerses,
  currentTimeSec,
  totalDurationSec,
  speechRate,
  focusAudioVerse,
  audioLanguage,
  primaryTrans,
  theme,
  bookNameZh,
  bookNameEn,
  chapter,
  onPlayPause,
  onSkipSeconds,
  onSeekSeconds,
  onChangeRate,
  onChangeLanguage,
  onToggleFocusVerse,
  onClose,
}) => {
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSpeedMenuOpen) return;
    const handleOutside = (e: PointerEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setIsSpeedMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSpeedMenuOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSpeedMenuOpen]);

  const safeTotal = Math.max(1, totalDurationSec);
  const clampedCurrent = Math.min(Math.max(0, currentTimeSec), safeTotal);
  const progressPct = Math.min(100, Math.max(0, (clampedCurrent / safeTotal) * 100));

  const handleCycleLanguage = () => {
    const next: 'en' | 'zh' | 'bilingual' =
      audioLanguage === 'en' ? 'zh' : audioLanguage === 'zh' ? 'bilingual' : 'en';
    onChangeLanguage(next);
  };

  const formatRateLabel = (rate: number) => {
    if (Math.abs(rate - 1) < 0.01) return '1x';
    return `${Number(rate.toFixed(2))}x`;
  };

  const editionTitle =
    audioLanguage === 'zh'
      ? `${bookNameEn} ${chapter} · 中文朗读`
      : audioLanguage === 'bilingual'
      ? `${bookNameEn} ${chapter} · Bilingual Audio`
      : `${bookNameEn} ${chapter} · ${primaryTrans === 'CNVS' ? 'NIV' : primaryTrans} Edition`;

  const editionSubtitle =
    audioLanguage === 'zh'
      ? `${bookNameZh} · 和合本 / 新译本 · Verse ${currentVerseNum}/${totalVerses}`
      : audioLanguage === 'bilingual'
      ? `${bookNameZh} · 中文 + English · Verse ${currentVerseNum}/${totalVerses}`
      : `Audio Reader · Verse ${currentVerseNum} of ${totalVerses}`;

  const langBadge =
    audioLanguage === 'zh' ? '中文' : audioLanguage === 'bilingual' ? '双语' : 'EN';

  return (
    <div
      role="region"
      aria-label="Audio Chapter Player"
      className={`fixed bottom-0 inset-x-0 z-50 border-t backdrop-blur-md transition-colors font-sans animate-in slide-in-from-bottom-3 duration-200 ${
        theme === 'dark'
          ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-[0_-6px_28px_rgba(0,0,0,0.45)]'
          : 'bg-white/98 border-slate-200/90 text-slate-900 shadow-[0_-4px_24px_rgba(15,23,42,0.06)]'
      }`}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Desktop & Tablet 3-column bar matching screenshot; clean 2-row compact layout on mobile */}
        <div className="flex flex-col sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-6">
          {/* Center Track Info + Red Scrubber Bar (on mobile shown first, on sm+ middle column) */}
          <div className="w-full sm:order-2 sm:max-w-md sm:mx-auto min-w-0">
            <div className="text-center leading-tight">
              <div className="text-xs sm:text-[13px] font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                {editionTitle}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {editionSubtitle}
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400 w-8 text-right shrink-0 select-none">
                {formatTime(clampedCurrent)}
              </span>

              <div className="relative flex-1 h-4 flex items-center group">
                <div className="w-full h-[3.5px] rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-[#ef3e4a] rounded-full transition-[width] duration-150"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#ef3e4a] shadow-xs pointer-events-none opacity-90 group-hover:scale-125 transition-transform"
                  style={{ left: `${progressPct}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={safeTotal}
                  step={1}
                  value={Math.round(clampedCurrent)}
                  onChange={(e) => onSeekSeconds(Number(e.target.value))}
                  aria-label="Seek chapter audio"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400 w-8 text-left shrink-0 select-none">
                {formatTime(safeTotal)}
              </span>
            </div>
          </div>

          {/* Mobile single row holding Left + Right controls, or separate Left & Right columns on sm+ */}
          <div className="w-full sm:w-auto sm:contents flex items-center justify-between gap-2">
            {/* Left Playback Controls: ↺10   ⏸ / ▶   ↻10 */}
            <div className="flex items-center gap-3 sm:gap-4 sm:order-1 shrink-0">
              <button
                type="button"
                onClick={() => onSkipSeconds(-10)}
                className="p-1.5 rounded-full text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Rewind 10 seconds"
                aria-label="Rewind 10 seconds"
              >
                <Rewind10Icon className="w-[22px] h-[22px]" />
              </button>

              <button
                type="button"
                onClick={onPlayPause}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onSkipSeconds(10)}
                className="p-1.5 rounded-full text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Forward 10 seconds"
                aria-label="Forward 10 seconds"
              >
                <Forward10Icon className="w-[22px] h-[22px]" />
              </button>
            </div>

            {/* Right Controls: 1x (with speed popover)  VoiceLang  Follow-Sync  ✕ */}
            <div className="flex items-center gap-2 sm:gap-3 sm:order-3 shrink-0">
              <div className="relative" ref={speedMenuRef}>
                {isSpeedMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Playback speed"
                    className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-40 py-2 rounded-2xl border z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-[0_10px_32px_rgba(0,0,0,0.65)]'
                        : 'bg-white border-slate-200/70 text-slate-900 shadow-[0_10px_32px_rgba(15,23,42,0.14)]'
                    }`}
                  >
                    {SPEED_OPTIONS.map((rate) => {
                      const isSelected = Math.abs(rate - speechRate) < 0.05;
                      return (
                        <button
                          key={rate}
                          type="button"
                          role="menuitemradio"
                          aria-checked={isSelected}
                          onClick={() => {
                            onChangeRate(rate);
                            setIsSpeedMenuOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 flex items-center gap-3 text-left text-[15px] transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#EAEAEA] dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100'
                              : 'font-normal text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="w-4 flex items-center justify-center shrink-0">
                            {isSelected && <Check className="w-4 h-4 stroke-[2.2]" />}
                          </span>
                          <span className="tabular-nums">{formatRateLabel(rate)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsSpeedMenuOpen((prev) => !prev)}
                  className={`px-2 py-1 rounded-lg text-xs sm:text-[13px] font-bold tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                    isSpeedMenuOpen
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Playback speed"
                  aria-label={`Playback speed ${formatRateLabel(speechRate)}`}
                  aria-haspopup="menu"
                  aria-expanded={isSpeedMenuOpen}
                >
                  {formatRateLabel(speechRate)}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCycleLanguage}
                className="relative p-1.5 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                title={`Audio language: ${langBadge} (Click to switch EN / 中文 / 双语)`}
                aria-label={`Switch audio language (current: ${langBadge})`}
              >
                <VoiceSpeakIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400">
                  {langBadge}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleFocusVerse}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  focusAudioVerse
                    ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={
                  focusAudioVerse
                    ? 'Follow active verse highlight (On)'
                    : 'Follow active verse highlight (Off)'
                }
                aria-label="Toggle active verse read-along highlight"
                aria-pressed={focusAudioVerse}
              >
                <FollowScriptIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close audio player"
                aria-label="Close audio player"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
