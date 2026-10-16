import React from 'react';
import { 
  FileText, 
  Search, 
  BarChart2, 
  Download, 
  Info, 
  Shield, 
  X,
  FileCheck
} from 'lucide-react';
import type { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasResults: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  hasResults,
  mobileOpen,
  onToggleMobile,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'analyze', label: 'Analyze document', icon: Search },
    ...(hasResults ? [{ id: 'results' as ActiveTab, label: 'Analysis results', icon: BarChart2, badge: 'Ready' }] : []),
    { id: 'reports', label: 'Reports', icon: Download },
    { id: 'about', label: 'About & Metrics', icon: Info },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    if (mobileOpen) {
      onToggleMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 tracking-tight text-base">LexGuard</span>
              <span className="block text-[10px] text-slate-400 font-mono -mt-0.5">TERMS ANALYZER</span>
            </div>
          </div>
          <button
            onClick={onToggleMobile}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-200 text-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Active State pill */}
        {hasResults && (
          <div className="px-4 py-3 mx-3 mb-3 rounded-md bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center space-x-2 text-slate-700 font-medium mb-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Document</span>
            </div>
            <p className="text-slate-500 text-[11px] truncate">Current policy analyzed</p>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div className="p-4 border-t border-slate-100">
          <div className="text-[11px] leading-relaxed text-slate-400">
            <p className="font-medium text-slate-500">Academic Prototype</p>
            <p>Not legally binding or formal legal advice.</p>
          </div>
        </div>
      </aside>
    </>
  );
};
