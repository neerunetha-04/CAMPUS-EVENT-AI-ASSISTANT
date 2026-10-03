import React, { useState } from 'react';
import { 
  Compass, 
  CalendarPlus, 
  HelpCircle, 
  FileText, 
  AlertTriangle, 
  Search, 
  Menu, 
  X, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeEventName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, activeEventName }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'new_event', label: '+ Plan Event', icon: CalendarPlus },
    { id: 'assistant', label: 'Ask Assistant', icon: HelpCircle },
    { id: 'documents', label: 'Document Center', icon: FileText },
    { id: 'inspector', label: 'Inspector', icon: Layers },
    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
  ];

  const handleSelectTab = (id: string) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-[#1e2c47]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleSelectTab('dashboard')}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">CampusFlow</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                  Grounded AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wide hidden sm:block">
                Institutional Event Compliance Assistant
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Active Context & Status Pill */}
          <div className="hidden lg:flex items-center gap-3">
            {activeEventName && (
              <div className="px-2.5 py-1 bg-[#131d33] border border-[#1e293b] rounded-full flex items-center gap-1.5 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-slate-400">Active:</span>
                <span className="font-medium text-slate-200 truncate max-w-[140px]">{activeEventName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Verified Corpus
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0f1d] border-b border-[#1e2c47] px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 text-cyan-400" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};
