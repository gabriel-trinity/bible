import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Volume2, Check } from 'lucide-react';
import { TranslationId, AppTheme } from '../types/bible';
import { TRANSLATIONS } from '../data/bibleBooks';

interface VersionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrimaryTrans: TranslationId;
  currentParallelTrans: TranslationId;
  theme: AppTheme;
  onSelectVersion: (transId: TranslationId) => void;
}

const LANGUAGE_LABELS: Record<'all' | 'en' | 'zh', string> = {
  all: 'All Languages',
  en: 'English',
  zh: 'Chinese (中文)',
};

export const VersionPickerModal: React.FC<VersionPickerModalProps> = ({
  isOpen,
  onClose,
  currentPrimaryTrans,
  currentParallelTrans,
  onSelectVersion,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'en' | 'zh'>('all');
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFilterQuery('');
      setSelectedLanguage('all');
      setShowLanguageOptions(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const allVersions = useMemo(() => Object.values(TRANSLATIONS), []);

  const filteredVersions = useMemo(() => {
    let list = allVersions;

    if (selectedLanguage !== 'all') {
      list = list.filter((v) => v.lang === selectedLanguage);
    }

    if (!filterQuery.trim()) return list;

    const q = filterQuery.trim().toLowerCase();
    return list.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        v.shortName.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
    );
  }, [allVersions, selectedLanguage, filterQuery]);

  if (!isOpen) return null;

  const handleSelect = (transId: TranslationId) => {
    onSelectVersion(transId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 bg-black/45 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar matching Image 4: Centered "Version", Right "CANCEL" */}
        <div className="relative flex items-center justify-center px-4 pt-4 pb-2.5 shrink-0">
          <h2 className="text-base font-medium text-slate-500 dark:text-slate-400">
            Version
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-3.5 px-2 py-1 text-xs font-medium tracking-wide text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 uppercase transition-colors cursor-pointer"
          >
            CANCEL
          </button>
        </div>

        {/* Filter Input matching Image 4 ("Filter Versions...") */}
        <div className="px-4 pb-3 shrink-0">
          <input
            ref={searchInputRef}
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter Versions..."
            className="w-full px-3 py-2 text-sm rounded-lg border-2 border-slate-900 dark:border-slate-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-hidden"
          />
        </div>

        {/* Bible Language Row matching Image 4 */}
        <div className="px-4 pb-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Bible Language
              </div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                {LANGUAGE_LABELS[selectedLanguage]}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLanguageOptions((prev) => !prev)}
              className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Change Language
            </button>
          </div>

          {showLanguageOptions && (
            <div className="flex items-center gap-1.5 mt-3">
              {(['all', 'en', 'zh'] as const).map((langKey) => (
                <button
                  key={langKey}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(langKey);
                    setShowLanguageOptions(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedLanguage === langKey
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {langKey === 'all' ? 'All' : langKey === 'en' ? 'English' : 'Chinese'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Versions List matching Image 4 */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredVersions.map((version) => {
            const isCurrent =
              version.id === currentPrimaryTrans || version.id === currentParallelTrans;
            const cleanName = version.name.replace(/\s*[\(（][^\)）]*[\)）]/g, '');

            return (
              <button
                key={version.id}
                type="button"
                onClick={() => handleSelect(version.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-100/80 dark:bg-slate-800/70 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <div className="text-[15px] text-slate-900 dark:text-slate-100 leading-snug">
                    {cleanName}{' '}
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1">
                      {version.shortName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 text-slate-700 dark:text-slate-300">
                  <Volume2 className="w-4 h-4 opacity-70" />
                  {isCurrent && (
                    <Check className="w-4 h-4 text-slate-900 dark:text-slate-100 stroke-[2.5]" />
                  )}
                </div>
              </button>
            );
          })}

          {filteredVersions.length === 0 && (
            <div className="text-center py-12 text-sm text-slate-400">
              No matching Bible versions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
