import { useStore } from '../store/useStore';
import { Hash, Settings, Briefcase, Shield, ChevronRight, Zap, Plus, Archive, Folder, Terminal, Trash2, Pin } from 'lucide-react';
import { useState } from 'react';
import { JobsPanel } from './JobsPanel';
import { RulesPanel } from './RulesPanel';
import { SettingsDialog } from './SettingsDialog';
import { SessionsPanel } from './SessionsPanel';
import { ArchiveDialog } from './ArchiveDialog';
import { AddWorkspaceDialog } from './AddWorkspaceDialog';
import { LaunchAgentDialog } from './LaunchAgentDialog';
import { AgentDetailDialog } from './AgentDetailDialog';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTranslation } from 'react-i18next';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = () => {
  const { channels, currentChannel, setCurrentChannel, agents, settings, status, workspaces, activeWorkspace, pinnedAgents } = useStore();
  const { sendAction } = useWebSocket();
  const { t } = useTranslation();
  const [isJobsOpen, setIsJobsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isAddWorkspaceOpen, setIsAddWorkspaceOpen] = useState(false);
  const [isLaunchAgentOpen, setIsLaunchAgentOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const displayUsername = settings.username || 'BEN-ADMIN';

  const handleArchiveChannel = (name: string) => {
      if (confirm(t('sidebar.archive_channel_confirm', { name }))) {
          sendAction({ type: 'channel_archive', name });
      }
  };

  const handleSetActiveWorkspace = async (name: string) => {
    try {
      await fetch('/api/workspaces/active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': (window as any).__SESSION_TOKEN__ || '',
        },
        body: JSON.stringify({ name }),
      });
    } catch (e) {
      console.error('Error setting active workspace', e);
    }
  };

  const handleDeleteWorkspace = async (name: string) => {
    if (!confirm(t('common.delete') + ' ' + name + '?')) return;
    try {
      await fetch(`/api/workspaces/${name}`, {
        method: 'DELETE',
        headers: {
          'x-session-token': (window as any).__SESSION_TOKEN__ || '',
        },
      });
    } catch (e) {
      console.error('Error deleting workspace', e);
    }
  };

  return (
    <>
      <aside className="w-[280px] bg-brand-panel border-r border-brand-border flex flex-col shrink-0 h-full overflow-hidden shadow-xl z-20">
        <div className="px-8 py-10 group cursor-default">
            <h1 className="font-black text-on-surface text-2xl tracking-tighter leading-none">AgentChattrFlow</h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-6 pb-4">
          <div className="space-y-2">
             <button 
                onClick={() => setIsSessionsOpen(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-high rounded-2xl transition-all group border border-transparent hover:border-brand-border shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                    <Zap size={18} className="text-primary group-hover:animate-pulse" />
                    <span className="font-semibold tracking-wide">{t('common.orchestration')}</span>
                </div>
                <ChevronRight size={14} className="text-brand-border group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
             <button 
                onClick={() => setIsJobsOpen(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-high rounded-2xl transition-all group border border-transparent hover:border-brand-border shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                    <Briefcase size={18} className="text-primary group-hover:opacity-80" />
                    <span className="font-semibold tracking-wide">{t('common.jobs_board')}</span>
                </div>
                <ChevronRight size={14} className="text-brand-border group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
              <button 
                onClick={() => setIsRulesOpen(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-high rounded-2xl transition-all group border border-transparent hover:border-brand-border shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                    <Shield size={18} className="text-primary group-hover:opacity-80" />
                    <span className="font-semibold tracking-wide">{t('common.governance')}</span>
                </div>
                <ChevronRight size={14} className="text-brand-border group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
          </div>

          {/* Workspaces Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-4 mb-3">
                <h3 className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em]">
                  {t('common.workspaces')}
                </h3>
                <button 
                    onClick={() => setIsAddWorkspaceOpen(true)}
                    className="p-1.5 hover:bg-primary/20 text-primary rounded-lg transition-all"
                    title={t('common.add_workspace')}
                >
                    <Plus size={14} strokeWidth={3} />
                </button>
            </div>
            <div className="space-y-1">
              {workspaces.map((ws) => (
                <div 
                    key={ws.name} 
                    className={cn(
                        "group flex items-center gap-1 px-1 rounded-xl transition-all",
                        activeWorkspace === ws.name ? "bg-primary-container/40" : "hover:bg-surface-low"
                    )}
                >
                    <button
                        onClick={() => handleSetActiveWorkspace(ws.name)}
                        className={cn(
                            "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all min-w-0 text-left relative",
                            activeWorkspace === ws.name
                            ? "text-on-primary-container font-bold"
                            : "text-on-surface-variant hover:text-on-surface"
                        )}
                        title={ws.path}
                    >
                        <Folder size={16} className={cn("shrink-0", activeWorkspace === ws.name ? "text-on-primary-container" : "text-brand-border")} />
                        <span className="truncate">{ws.name}</span>
                        {activeWorkspace === ws.name && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full" />
                        )}
                    </button>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteWorkspace(ws.name);
                        }}
                        className="p-2 text-on-surface-variant/50 hover:text-error opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-error/10 shrink-0 relative z-30"
                        title={t('common.delete')}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between px-4 mb-3">
                <h3 className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em]">
                  {t('common.neural_channels')}
                </h3>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setIsArchiveOpen(true)}
                        className="p-1.5 hover:bg-on-surface/5 text-on-surface-variant/50 hover:text-amber-500 rounded-lg transition-all"
                        title={t('sidebar.view_archived')}
                    >
                        <Archive size={14} />
                    </button>
                    <button 
                        onClick={() => {
                            const name = window.prompt(t('sidebar.new_channel_prompt'));
                            if (name) sendAction({ type: 'channel_create', name: name.trim().toLowerCase() });
                        }}
                        className="p-1.5 hover:bg-primary/20 text-primary rounded-lg transition-all"
                        title={t('sidebar.create_channel')}
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
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full" />
                        )}
                    </button>
                    {channel !== 'general' && (
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleArchiveChannel(channel);
                            }}
                            className="p-2 text-on-surface-variant/50 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-amber-500/10 shrink-0 relative z-30"
                            title={t('common.archive')}
                        >
                            <Archive size={14} />
                        </button>
                    )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between px-4 mb-3">
                <h3 className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em]">
                  {t('common.intelligence_grid')}
                </h3>
                <button 
                    onClick={() => setIsLaunchAgentOpen(true)}
                    className="p-1.5 hover:bg-primary/20 text-primary rounded-lg transition-all"
                    title={t('common.launch_ai')}
                >
                    <Terminal size={14} strokeWidth={2.5} />
                </button>
            </div>
            <div className="space-y-1">
              {Object.entries(agents).map(([id, info]: [string, any]) => {
                const isThinking = status?.[id]?.busy;
                const isPinned = pinnedAgents.includes(id);
                
                return (
                  <div
                    key={id}
                    onClick={() => setSelectedAgentId(id)}
                    className={cn(
                        "flex items-center gap-3 px-4 py-2.5 text-sm group cursor-pointer hover:bg-surface-low rounded-xl transition-all active:scale-[0.98]",
                        isPinned ? "text-primary font-bold bg-primary/5" : "text-on-surface-variant"
                    )}
                    title={info.label || id}
                  >
                    <div className="relative">
                      <div 
                          className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(76,175,80,0.3)] group-hover:scale-125 transition-transform" 
                          style={{ backgroundColor: info.color }}
                      />
                      {isPinned && (
                        <div className="absolute -top-1.5 -right-1.5">
                          <Pin size={10} className="text-primary fill-primary" />
                        </div>
                      )}
                    </div>
                    <span className="truncate">{info.label || id}</span>
                    {isThinking && (
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-[9px] font-black text-primary uppercase tracking-tighter animate-pulse">{t('messages.thinking')}</span>
                            <div className="flex gap-0.5 shrink-0">
                                <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                            </div>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 mt-auto bg-black/10">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-between p-4 rounded-[24px] bg-surface-high border border-brand-border hover:bg-primary-container hover:border-primary-500/30 transition-all group active:scale-95"
          >
            <div className="text-left min-w-0">
                <p className="text-xs font-black text-on-surface leading-none truncate group-hover:text-on-primary-container uppercase tracking-widest">
                    {displayUsername}
                </p>
                <p className="text-[9px] text-on-surface-variant font-bold mt-1.5 uppercase tracking-tighter truncate group-hover:text-on-primary-container/70 opacity-60">{t('common.terminal_operator')}</p>
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
      <AddWorkspaceDialog isOpen={isAddWorkspaceOpen} onClose={() => setIsAddWorkspaceOpen(false)} />
      <LaunchAgentDialog isOpen={isLaunchAgentOpen} onClose={() => setIsLaunchAgentOpen(false)} />
      
      {selectedAgentId && (
        <AgentDetailDialog 
          agentId={selectedAgentId} 
          mode="modal" 
          onClose={() => setSelectedAgentId(null)} 
        />
      )}
    </>
  );
};
