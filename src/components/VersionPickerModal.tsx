import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Check, Globe } from 'lucide-react';
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

export const VersionPickerModal: React.FC<VersionPickerModalProps> = ({
  isOpen,
  onClose,
  currentPrimaryTrans,
  currentParallelTrans,
  theme,
  onSelectVersion,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'en' | 'zh'>('all');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFilterQuery('');
      setSelectedLanguage('all');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const allVersions = useMemo(() => {
    return Object.values(TRANSLATIONS);
  }, []);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching Image 2 */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Version</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input matching Image 2 ("Filter Versions...") */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="relative">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 focus-within:ring-2 focus-within:ring-slate-900 dark:focus-within:ring-slate-100 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter Versions..."
                className="w-full text-sm bg-transparent border-none outline-hidden text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-sans"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Bible Language Section matching Image 2 */}
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Bible Language
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedLanguage('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLanguage === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Languages
              </button>
              <button
                onClick={() => setSelectedLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLanguage === 'en'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLanguage('zh')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLanguage === 'zh'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Chinese (中文)
              </button>
            </div>
          </div>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredVersions.map((version) => {
            const isCurrent =
              version.id === currentPrimaryTrans || version.id === currentParallelTrans;

            return (
              <button
                key={version.id}
                onClick={() => handleSelect(version.id)}
                className={`w-full flex items-center justify-between p-3.5 sm:px-4 sm:py-3.5 text-left transition-colors cursor-pointer group ${
                  isCurrent
                    ? 'bg-slate-50 dark:bg-slate-800/60 font-semibold'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex-1 pr-3 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {version.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200 uppercase shrink-0">
                      {version.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {version.description}
                  </p>
                </div>

                {isCurrent && (
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shrink-0 shadow-2xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
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
