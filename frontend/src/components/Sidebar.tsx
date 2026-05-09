import { useStore } from '../store/useStore';
import { Hash, Settings, Briefcase, Shield, ChevronRight, Zap, Plus, Archive } from 'lucide-react';
import { useState } from 'react';
import { JobsPanel } from './JobsPanel';
import { RulesPanel } from './RulesPanel';
import { SettingsDialog } from './SettingsDialog';
import { SessionsPanel } from './SessionsPanel';
import { ArchiveDialog } from './ArchiveDialog';
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
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const displayUsername = settings.username || 'BEN-ADMIN';

  const handleRenameAgent = (id: string, currentLabel: string) => {
    const newLabel = window.prompt(`Rename agent ${id}:`, currentLabel);
    if (newLabel !== null && newLabel.trim() !== currentLabel) {
      sendAction({ type: 'rename_agent', name: id, label: newLabel.trim() });
    }
  };

  const handleArchiveChannel = (name: string) => {
      if (confirm(`Archive channel #${name}? It will be hidden from the sidebar.`)) {
          sendAction({ type: 'channel_archive', name });
      }
  };

  return (
    <>
      <aside className="w-[280px] bg-brand-panel border-r border-brand-border flex flex-col shrink-0 h-full overflow-hidden shadow-xl z-20">
        <div className="px-8 py-10">
            <h1 className="font-black text-on-surface text-2xl tracking-tighter leading-none">AgentChattr</h1>
            <span className="text-[10px] text-primary-500 font-black uppercase tracking-[0.3em] mt-2 block">Neural Suite v4</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-6 pb-4">
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

          <div className="pt-2">
            <div className="flex items-center justify-between px-4 mb-3">
                <h3 className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em]">
                  Neural Channels
                </h3>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setIsArchiveOpen(true)}
                        className="p-1 hover:bg-white/5 text-gray-500 hover:text-amber-500 rounded-md transition-all"
                        title="View archived channels"
                    >
                        <Archive size={14} />
                    </button>
                    <button 
                        onClick={() => {
                            const name = window.prompt('Enter new channel name (lowercase, no spaces):');
                            if (name) sendAction({ type: 'channel_create', name: name.trim().toLowerCase() });
                        }}
                        className="p-1 hover:bg-primary-500/20 text-primary-500 rounded-md transition-all"
                        title="Create new channel"
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                </div>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <div 
                    key={channel} 
                    className={cn(
                        "group flex items-center gap-1 px-1 rounded-xl transition-all",
                        currentChannel === channel ? "bg-primary-container/40" : "hover:bg-surface-low"
                    )}
                >
                    <button
                        onClick={() => setCurrentChannel(channel)}
                        className={cn(
                            "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all min-w-0 text-left relative",
                            currentChannel === channel
                            ? "text-on-primary-container font-bold"
                            : "text-on-surface-variant hover:text-on-surface"
                        )}
                    >
                        <Hash size={16} className={cn("shrink-0", currentChannel === channel ? "text-on-primary-container" : "text-brand-border")} />
                        <span className="truncate">{channel}</span>
                        {currentChannel === channel && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary-500 rounded-full" />
                        )}
                    </button>
                    {channel !== 'general' && (
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleArchiveChannel(channel);
                            }}
                            className="p-2 text-gray-500 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-amber-500/10 shrink-0 relative z-30"
                            title="Archive channel"
                        >
                            <Archive size={14} />
                        </button>
                    )}
                </div>
              ))}
            </div>
          </div>

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

        <div className="p-4 mt-auto bg-black/10">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-between p-4 rounded-[24px] bg-surface-high border border-brand-border hover:bg-primary-container hover:border-primary-500/30 transition-all group"
          >
            <div className="text-left min-w-0">
                <p className="text-xs font-black text-on-surface leading-none truncate group-hover:text-on-primary-container uppercase tracking-widest">
                    {displayUsername}
                </p>
                <p className="text-[9px] text-on-surface-variant font-bold mt-1.5 uppercase tracking-tighter truncate group-hover:text-on-primary-container/70 opacity-60">Terminal Operator</p>
            </div>
            <Settings size={16} className="text-brand-border group-hover:text-on-primary-container group-hover:rotate-45 transition-all duration-500 shrink-0" />
          </button>
        </div>
      </aside>

      <JobsPanel isOpen={isJobsOpen} onClose={() => setIsJobsOpen(false)} />
      <RulesPanel isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SessionsPanel isOpen={isSessionsOpen} onClose={() => setIsSessionsOpen(false)} />
      <ArchiveDialog isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} />
    </>
  );
};
