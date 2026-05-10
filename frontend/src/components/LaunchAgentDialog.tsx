import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Terminal, Rocket, Search, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { cn } from '../utils/theme';

export const LaunchAgentDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { agents } = useStore();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailable = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent-types', {
          headers: { 'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' }
      });
      if (res.ok) setAvailableAgents(await res.json());
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAvailable();
  }, [isOpen]);

  const handleLaunch = async (name: string, mode?: string) => {
    try {
      await fetch('/api/launch-agent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' 
        },
        body: JSON.stringify({ agent: name, mode: mode || '' })
      });
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = availableAgents.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[150]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full h-full sm:h-auto sm:max-w-2xl transform overflow-hidden sm:rounded-[32px] bg-brand-panel p-6 sm:p-10 text-left align-middle shadow-2xl transition-all border border-brand-border ring-1 ring-white/5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow">
                      <Terminal size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                        {t('common.launch_ai') || 'Agent Deployment'}
                      </Dialog.Title>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mt-1">{t('common.launch_desc') || 'Initialize autonomous neural entities'}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="relative mb-8 group">
                  <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('common.search_agents') || 'Search neural grid...'}
                    className="w-full bg-on-surface/[0.03] border border-brand-border rounded-2xl py-4 pl-14 pr-6 text-sm text-on-surface focus:border-primary/50 outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {isLoading ? (
                    <div className="py-20 text-center animate-pulse">
                        <Terminal size={40} className="mx-auto mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30">Scanning available nodes...</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-brand-border/20 rounded-[32px] opacity-20">
                      <Search size={40} className="mx-auto mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">{t('common.no_agents_found') || 'No entities detected'}</p>
                    </div>
                  ) : (
                    filtered.map((agent, idx) => {
                      const isRunning = agents[agent.name] && !agent.mode; // Mode variants are always launchable
                      return (
                        <div 
                          key={`${agent.name}-${agent.mode || 'std'}-${idx}`} 
                          className={cn(
                            "flex items-center justify-between p-5 rounded-3xl border transition-all relative overflow-hidden group",
                            isRunning 
                                ? "bg-on-surface/[0.01] border-brand-border/30 opacity-50 cursor-not-allowed" 
                                : "bg-on-surface/[0.03] border-brand-border hover:bg-on-surface/[0.05] hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-surface-high border border-brand-border flex items-center justify-center shrink-0">
                                <Terminal size={20} className={isRunning ? "text-on-surface-variant/20" : "text-primary"} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-on-surface tracking-tight flex items-center gap-2">
                                {agent.label || agent.name}
                                {isRunning && <span className="text-[8px] font-black uppercase tracking-widest bg-on-surface/10 px-1.5 py-0.5 rounded">Active</span>}
                              </h4>
                              <p className="text-xs text-on-surface-variant/50 line-clamp-1 mt-0.5">
                                {agent.mode ? <span className="text-amber-500 font-bold uppercase tracking-tighter mr-2">{agent.mode}</span> : null}
                                {agent.name} • {agent.description || 'Neural entity waiting for initialization'}
                              </p>
                            </div>
                          </div>
                          {!isRunning && (
                            <button
                                onClick={() => handleLaunch(agent.name, agent.mode)}
                                className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary text-primary hover:text-brand-bg transition-all shadow-sm group-hover:shadow-lg active:scale-95"
                            >
                                <Rocket size={20} fill="currentColor" className="opacity-80" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-10 flex gap-4">
                    <div className="flex-1 p-4 rounded-2xl bg-on-surface/[0.03] border border-brand-border flex items-start gap-3">
                        <Info size={16} className="text-primary mt-0.5 shrink-0" />
                        <p className="text-[10px] text-on-surface-variant/60 leading-relaxed font-medium">
                            {t('common.launch_hint') || 'Deployed agents will automatically register with the current neural node and be available for @mentions in all channels.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-8 py-4 rounded-2xl bg-on-surface/[0.03] border border-brand-border text-on-surface-variant font-black text-[10px] uppercase tracking-widest hover:bg-on-surface/5 transition-all"
                    >
                        {t('common.close')}
                    </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
