import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-[#111a2e]/60 border border-[#1e2c47] rounded-xl border-dashed">
      <div className="p-3 bg-cyan-950/60 border border-cyan-800/40 rounded-xl text-cyan-400 mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs sm:text-sm font-medium rounded-lg shadow-md shadow-cyan-950/40 transition-all flex items-center gap-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
