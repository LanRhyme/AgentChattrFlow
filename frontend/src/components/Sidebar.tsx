import { useStore } from '../store/useStore';
import { Hash, Settings, Briefcase, Shield, ChevronRight, User, Zap } from 'lucide-react';
import { useState } from 'react';
import { JobsPanel } from './JobsPanel';
import { RulesPanel } from './RulesPanel';
import { SettingsDialog } from './SettingsDialog';
import { SessionsPanel } from './SessionsPanel';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useWebSocket } from '../hooks/useWebSocket';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = () => {
  const { channels, currentChannel, setCurrentChannel, agents, settings } = useStore();
  const { sendAction } = useWebSocket();
  const [isJobsOpen, setIsJobsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);

  const displayUsername = settings.username || 'BEN-ADMIN';

  const handleRenameAgent = (id: string, currentLabel: string) => {
    const newLabel = window.prompt(`Rename agent ${id}:`, currentLabel);
    if (newLabel !== null && newLabel.trim() !== currentLabel) {
      sendAction({ type: 'rename_agent', name: id, label: newLabel.trim() });
    }
  };

  return (
    <>
      <aside className="w-[280px] bg-brand-panel border-r border-brand-border flex flex-col shrink-0 h-full overflow-hidden shadow-xl z-20">
        {/* Header - M3 Style */}
        <div className="px-6 py-10">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
                    <span className="font-black text-brand-bg text-xl tracking-tighter">A</span>
                </div>
                <div>
                    <h1 className="font-bold text-on-surface text-lg tracking-tight leading-tight">AgentChattr</h1>
                    <span className="text-[11px] text-primary-400 font-bold uppercase tracking-widest mt-0.5 block">Material Suite</span>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-6 pb-4">
          {/* Action Cards */}
          <div className="space-y-2">
             <button 
                onClick={() => setIsSessionsOpen(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-high rounded-2xl transition-all group border border-transparent hover:border-brand-border shadow-sm"
              >
                <div className="flex items-center gap-3">
                    <Zap size={18} className="text-primary-400 group-hover:text-primary-300" />
                    <span className="font-semibold tracking-wide">Orchestration</span>
                </div>
                <ChevronRight size={14} className="text-brand-border group-hover:text-primary-400" />
              </button>
             <button 
                onClick={() => setIsJobsOpen(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-high rounded-2xl transition-all group border border-transparent hover:border-brand-border shadow-sm"
              >
                <div className="flex items-center gap-3">
                    <Briefcase size={18} className="text-primary-400 group-hover:text-primary-300" />
                    <span className="font-semibold tracking-wide">Jobs Board</span>
                </div>
                <ChevronRight size={14} className="text-brand-border group-hover:text-primary-400" />
              </button>
              <button 
                onClick={() => setIsRulesOpen(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-high rounded-2xl transition-all group border border-transparent hover:border-brand-border shadow-sm"
              >
                <div className="flex items-center gap-3">
                    <Shield size={18} className="text-primary-400 group-hover:text-primary-300" />
                    <span className="font-semibold tracking-wide">Governance</span>
                </div>
                <ChevronRight size={14} className="text-brand-border group-hover:text-primary-400" />
              </button>
          </div>


          {/* Channels Section */}
          <div className="pt-2">
            <h3 className="px-4 text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-3">
              Neural Channels
            </h3>
            <div className="space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel}
                  onClick={() => setCurrentChannel(channel)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all relative group",
                    currentChannel === channel
                      ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-low"
                  )}
                >
                  <Hash size={16} className={cn(currentChannel === channel ? "text-on-primary-container" : "text-brand-border")} />
                  {channel}
                  {currentChannel === channel && (
                      <div className="absolute left-1 top-2 bottom-2 w-1 bg-primary-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Agents Section */}
          <div className="pt-2">
            <h3 className="px-4 text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-3">
              Intelligence Grid
            </h3>
            <div className="space-y-1">
              {Object.entries(agents).map(([id, info]: [string, any]) => (
                <div
                  key={id}
                  onClick={() => handleRenameAgent(id, info.label || id)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant group cursor-pointer hover:bg-surface-low rounded-xl transition-all"
                  title="Click to rename agent"
                >
                  <div className="relative">
                    <div 
                        className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(76,175,80,0.3)]" 
                        style={{ backgroundColor: info.color }}
                    />
                  </div>
                  <span className="font-semibold group-hover:text-on-surface truncate">{info.label || id}</span>
                  {info.state === 'busy' && (
                      <div className="ml-auto flex gap-0.5 shrink-0">
                          <div className="w-1 h-1 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1 h-1 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1 h-1 rounded-full bg-primary-500 animate-bounce" />
                      </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 mt-auto bg-black/10">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-[24px] bg-surface-high border border-brand-border hover:bg-primary-container hover:border-primary-500/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-on-surface-variant group-hover:text-on-primary-container transition-colors shadow-inner">
                <User size={20} />
            </div>
            <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-on-surface leading-none truncate group-hover:text-on-primary-container uppercase tracking-tight">
                    {displayUsername}
                </p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-1 uppercase tracking-tighter truncate group-hover:text-on-primary-container/70">Terminal Operator</p>
            </div>
            <Settings size={16} className="text-brand-border group-hover:text-on-primary-container group-hover:rotate-45 transition-all duration-500" />
          </button>
        </div>
      </aside>

      <JobsPanel isOpen={isJobsOpen} onClose={() => setIsJobsOpen(false)} />
      <RulesPanel isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SessionsPanel isOpen={isSessionsOpen} onClose={() => setIsSessionsOpen(false)} />
    </>
  );
};

