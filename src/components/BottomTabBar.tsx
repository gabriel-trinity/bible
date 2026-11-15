import React from 'react';
import { BookOpen, Sun } from 'lucide-react';
import { AppTheme } from '../types/bible';

export type AppTab = 'bible' | 'votd';

interface BottomTabBarProps {
  activeTab: AppTab;
  theme: AppTheme;
  onChangeTab: (tab: AppTab) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  theme,
  onChangeTab,
}) => {
  return (
    <nav
      aria-label="Primary Bottom Navigation"
      className={`fixed bottom-0 inset-x-0 z-40 h-14 border-t backdrop-blur-md transition-colors font-sans ${
        theme === 'dark'
          ? 'bg-slate-900/95 border-slate-800 text-slate-300'
          : 'bg-white/95 border-slate-200 text-slate-600'
      }`}
    >
      <div className="max-w-md mx-auto h-full grid grid-cols-2">
        <button
          type="button"
          onClick={() => onChangeTab('bible')}
          aria-current={activeTab === 'bible' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'bible'
              ? 'text-slate-900 dark:text-slate-100 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${activeTab === 'bible' ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
          <span className="text-[11px] leading-none">Bible</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('votd')}
          aria-current={activeTab === 'votd' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'votd'
              ? 'text-slate-900 dark:text-slate-100 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sun className={`w-5 h-5 ${activeTab === 'votd' ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
          <span className="text-[11px] leading-none">Verse of the Day</span>
        </button>
      </div>
    </nav>
  );
};
