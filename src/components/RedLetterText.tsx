import React from 'react';

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

  if (!enabled || !text.includes('<red>')) {
    const clean = text.replace(/<\/?red>/g, '');
    return <span className={className}>{clean}</span>;
  }

  // Split on <red>...</red>
  const parts = text.split(/(<red>[\s\S]*?<\/red>)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('<red>') && part.endsWith('</red>')) {
          const content = part.slice(5, -6);
          return (
            <span
              key={index}
              style={{ color: '#C20009' }}
              className="text-[#C20009] font-medium transition-colors"
            >
              {content}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
