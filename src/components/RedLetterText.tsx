import React from 'react';
import { InlineNoteTooltip } from './InlineNoteTooltip';

interface RedLetterTextProps {
  text: string;
  enabled?: boolean;
  className?: string;
}

export const RedLetterText: React.FC<RedLetterTextProps> = ({
  text,
  enabled = true,
  className = '',
}) => {
  if (!text) return null;

  const hasRed = enabled && text.includes('<red>');
  const hasNote = text.includes('<note>');

  if (!hasRed && !hasNote) {
    const clean = text.replace(/<\/?red>/g, '');
    return <span className={className}>{clean}</span>;
  }

  const parts = text.split(/(<red>|<\/red>|<note>[\s\S]*?<\/note>)/g);
  let inRed = false;

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part === '<red>') {
          inRed = true;
          return null;
        }
        if (part === '</red>') {
          inRed = false;
          return null;
        }
        if (part.startsWith('<note>') && part.endsWith('</note>')) {
          const noteContent = part.slice(6, -7).replace(/<\/?red>/g, '').trim();
          if (!noteContent) return null;
          return (
            <InlineNoteTooltip
              key={index}
              note={noteContent}
              className="mx-0.5 -mt-0.5"
            />
          );
        }

        if (enabled && inRed) {
          return (
            <span
              key={index}
              className="text-[#C20009] dark:text-[#f87171] font-medium transition-colors"
            >
              {part}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
