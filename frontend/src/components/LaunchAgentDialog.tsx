import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, Terminal, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface AgentType {
  name: string;
  label: string;
  color: string;
  type: 'cli' | 'api';
  mode?: string;
}

interface LaunchAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LaunchAgentDialog = ({ isOpen, onClose }: LaunchAgentDialogProps) => {
  const { t } = useTranslation();
  const [agentTypes, setAgentTypes] = useState<AgentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAgentTypes();
    }
  }, [isOpen]);

  const fetchAgentTypes = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/agent-types', {
        headers: { 'x-session-token': (window as any).__SESSION_TOKEN__ || '' }
      });
      const data = await resp.json();
      setAgentTypes(data);
    } catch (e) {
      console.error('Error fetching agent types', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunch = async (agent: AgentType) => {
    const launchId = agent.mode ? `${agent.name}-${agent.mode}` : agent.name;
    setIsLaunching(launchId);
    try {
      const resp = await fetch('/api/launch-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': (window as any).__SESSION_TOKEN__ || '',
        },
        body: JSON.stringify({ 
          agent: agent.name,
          mode: agent.mode
        }),
      });
      if (resp.ok) {
        onClose();
      } else {
        const data = await resp.json();
        alert(data.error || 'Failed to launch agent');
      }
    } catch (e) {
      alert('Error launching agent');
    } finally {
      setIsLaunching(null);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[32px] bg-brand-panel border border-brand-border p-8 shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-8">
                  <Dialog.Title className="text-xl font-black text-on-surface uppercase tracking-tight flex items-center gap-3">
                    <Terminal size={24} className="text-primary" />
                    {t('common.launch_ai')}
                  </Dialog.Title>
                  <button onClick={onClose} className="p-2 hover:bg-surface-high rounded-full transition-colors">
                    <X size={20} className="text-on-surface-variant" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-on-surface-variant">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-sm font-bold uppercase tracking-widest">{t('messages.thinking')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {agentTypes.map((agent, idx) => {
                      const launchId = agent.mode ? `${agent.name}-${agent.mode}` : agent.name;
                      const isApi = agent.type === 'api';
                      
                      return (
                        <button
                          key={`${agent.name}-${agent.mode || 'std'}-${idx}`}
                          onClick={() => handleLaunch(agent)}
                          disabled={!!isLaunching}
                          className={cn(
                            "group flex flex-col p-4 rounded-2xl border transition-all text-left active:scale-[0.98] disabled:opacity-50 relative",
                            isApi 
                              ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40" 
                              : "bg-surface-low border-brand-border hover:bg-surface-high hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                             <div 
                                className="w-2.5 h-2.5 rounded-full shadow-lg" 
                                style={{ backgroundColor: agent.color }} 
                              />
                              {isApi && (
                                <span className="text-[8px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">API</span>
                              )}
                              {agent.mode && (
                                <span className="text-[8px] font-black bg-primary text-brand-bg px-1.5 py-0.5 rounded-full uppercase tracking-tighter">{agent.mode}</span>
                              )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-on-surface leading-tight">{agent.label}</p>
                              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 mt-0.5">{agent.name}</p>
                            </div>
                            {isLaunching === launchId ? (
                              <Loader2 size={16} className="animate-spin text-primary" />
                            ) : (
                              <Terminal size={16} className={cn(
                                "transition-colors",
                                isApi ? "text-amber-500/50 group-hover:text-amber-500" : "text-brand-border group-hover:text-primary"
                              )} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                   <button
                      onClick={onClose}
                      className="px-6 py-3 rounded-2xl bg-surface-high text-on-surface-variant font-bold text-sm hover:bg-surface-highest transition-all"
                    >
                      {t('common.close') || 'Close'}
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
