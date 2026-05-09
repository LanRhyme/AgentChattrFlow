import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Play, Plus, ChevronRight, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { SessionTemplate } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { Dropdown } from './Dropdown';

export const SessionsPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { templates, setTemplates, currentChannel, settings, agents } = useStore();
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedJob] = useState<SessionTemplate | null>(null);
  const [goal, setGoal] = useState('');
  const [cast, setCast] = useState<Record<string, string>>({});
  const [isDesigning, setIsDesigning] = useState(false);
  const [designDesc, setDesignDesc] = useState('');
  const [designAgent, setDesignDesignAgent] = useState('');

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/sessions/templates', {
        headers: { 'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' }
      });
      if (res.ok) setTemplates(await res.json());
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
        fetchTemplates();
        // Reset state
        setSelectedJob(null);
        setGoal('');
        setCast({});
        setIsDesigning(false);
    }
  }, [isOpen]);

  const availableAgents = Object.entries(agents)
    .filter(([_, cfg]) => cfg.state === 'active')
    .map(([name]) => name);

  const startCast = (tmpl: SessionTemplate) => {
    setSelectedJob(tmpl);
    const initialCast: Record<string, string> = {};
    const pool = [...availableAgents];
    tmpl.roles.forEach(role => {
        if (pool.length > 0) initialCast[role] = pool.shift()!;
        else initialCast[role] = availableAgents[0] || '';
    });
    setCast(initialCast);
  };

  const handleLaunch = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' 
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          channel: currentChannel,
          cast: cast,
          goal: goal,
          started_by: settings.username || 'user',
        }),
      });
      if (res.ok) onClose();
      else alert('Failed to start session');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendDesignRequest = async () => {
    if (!designAgent || !designDesc.trim()) return;
    try {
      const res = await fetch('/api/sessions/request-draft', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' 
        },
        body: JSON.stringify({ 
            agent: designAgent, 
            description: designDesc, 
            channel: currentChannel, 
            sender: settings.username 
        }),
      });
      if (res.ok) onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-xl">
                  <div className="flex h-full flex-col bg-brand-panel shadow-2xl border-l border-brand-border ring-1 ring-white/5">
                    <div className="flex items-center justify-between px-8 py-8 shrink-0">
                      <div>
                          <div className="flex items-center gap-2 text-primary-500 mb-1">
                             <Zap size={16} strokeWidth={2.5} />
                             <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t('sessions.neural_engine')}</span>
                          </div>
                          <Dialog.Title className="text-2xl font-bold text-white tracking-tight">
                              {t('sessions.title')}
                          </Dialog.Title>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-3 text-on-surface-variant hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all border border-brand-border"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-12">
                      {selectedTemplate ? (
                        <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
                            <button 
                                onClick={() => setSelectedJob(null)}
                                className="inline-flex items-center gap-2 text-xs font-bold text-primary-500 hover:text-primary-400 mb-2 bg-primary-500/5 px-3 py-1.5 rounded-full border border-primary-500/20 transition-all"
                            >
                                <ChevronRight size={14} className="rotate-180" /> {t('sessions.back_to_templates')}
                            </button>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">{t('sessions.session_goal')}</label>
                                <input
                                    type="text"
                                    value={goal}
                                    onChange={e => setGoal(e.target.value)}
                                    placeholder={t('sessions.goal_placeholder')}
                                    className="w-full bg-white/[0.03] border border-brand-border rounded-[20px] px-5 py-4 text-sm text-gray-100 focus:border-primary-500/50 outline-none transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1 block">{t('sessions.cast_config')}</label>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedTemplate.roles.map(role => (
                                        <Dropdown 
                                            key={role}
                                            label={role}
                                            value={cast[role] || ''}
                                            onChange={(val) => setCast({ ...cast, [role]: val })}
                                            options={[...availableAgents, settings.username].map(a => ({ id: a, name: a }))}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleLaunch}
                                className="w-full flex items-center justify-center gap-3 py-5 bg-primary-500 text-brand-bg hover:bg-primary-400 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
                            >
                                <Play size={18} fill="currentColor" />
                                {t('sessions.launch_sequence')}
                            </button>
                        </div>
                      ) : isDesigning ? (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-8">
                             <button 
                                onClick={() => setIsDesigning(false)}
                                className="inline-flex items-center gap-2 text-xs font-bold text-primary-500 hover:text-primary-400 mb-2 bg-primary-500/5 px-3 py-1.5 rounded-full border border-primary-500/20 transition-all"
                            >
                                <ChevronRight size={14} className="rotate-180" /> {t('common.back')}
                            </button>

                            <Dropdown 
                                label={t('sessions.orchestrator_agent')}
                                value={designAgent}
                                onChange={(val) => setDesignDesignAgent(val)}
                                options={availableAgents.map(a => ({ id: a, name: a }))}
                                placeholder={t('sessions.select_agent_to_draft')}
                            />

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">{t('sessions.requirement_analysis')}</label>
                                <textarea
                                    value={designDesc}
                                    onChange={e => setDesignDesc(e.target.value)}
                                    placeholder={t('sessions.requirement_placeholder')}
                                    className="w-full bg-white/[0.03] border border-brand-border rounded-[24px] px-5 py-5 text-sm text-gray-100 focus:border-primary-500/50 outline-none transition-all h-40 resize-none custom-scrollbar"
                                />
                            </div>

                            <button
                                onClick={handleSendDesignRequest}
                                disabled={!designAgent || !designDesc.trim()}
                                className="w-full flex items-center justify-center gap-3 py-5 bg-white text-brand-bg hover:bg-primary-100 disabled:opacity-20 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
                            >
                                <Plus size={18} strokeWidth={3} />
                                {t('sessions.propose_custom')}
                            </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                {templates.map(tmpl => (
                                    <button
                                        key={tmpl.id}
                                        onClick={() => startCast(tmpl)}
                                        className="text-left p-6 rounded-3xl bg-white/[0.03] border border-brand-border hover:bg-white/[0.06] hover:border-primary-500/30 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="text-lg font-bold text-gray-100 group-hover:text-primary-400 transition-colors">{tmpl.name}</h4>
                                            <div className="p-2 bg-primary-500/10 rounded-xl text-primary-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{tmpl.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {tmpl.roles.map(r => (
                                                <span key={r} className="px-2 py-0.5 rounded-lg bg-black/30 border border-white/5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">{r}</span>
                                            ))}
                                        </div>
                                    </button>
                                ))}

                                <button
                                    onClick={() => setIsDesigning(true)}
                                    className="p-6 rounded-3xl border-2 border-dashed border-white/5 hover:border-primary-500/30 bg-white/[0.01] hover:bg-white/[0.02] transition-all text-center group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <Plus size={24} className="text-gray-500 group-hover:text-primary-500" />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-500 group-hover:text-white">{t('sessions.design_custom')}</h4>
                                    <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">{t('sessions.design_desc')}</p>
                                </button>
                            </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
