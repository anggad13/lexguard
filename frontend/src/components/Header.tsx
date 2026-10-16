import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleMobile: () => void;
  backendHealthy: boolean | null;
  documentName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobile,
  backendHealthy,
  documentName,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobile}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-md lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {documentName ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Analyzing:</span>
            <span className="text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {documentName}
            </span>
          </div>
        ) : (
          <div className="hidden sm:block text-xs text-slate-500 font-medium">
            LexGuard — NLP Legal Risk Assessment
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Backend health status badge */}
        <div className="flex items-center space-x-1.5 text-xs">
          {backendHealthy === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 hidden sm:inline">Engine connected</span>
            </>
          ) : backendHealthy === false ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-600 font-medium">Engine offline</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-slate-400">Connecting...</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
