import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Play, Plus, ChevronRight, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { SessionTemplate } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { Dropdown } from './Dropdown';
import { cn } from '../utils/theme';

export const SessionsPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { templates, setTemplates, currentChannel, settings, agents } = useStore();
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedJob] = useState<SessionTemplate | null>(null);
  const [goal, setGoal] = useState('');
  const [cast, setCast] = useState<Record<string, string>>({});
  const [isDesigning, setIsDesigning] = useState(false);
  const [designDesc, setDesignDesc] = useState('');
  const [designAgent, setDesignDesignAgent] = useState('');

  const [isManual, setIsManual] = useState(false);
  const [manualRoles, setManualRoles] = useState<string[]>(['role1', 'role2']);
  const [manualPhases, setManualPhases] = useState<any[]>([
      { name: 'Phase 1', prompt: '', participants: ['role1'] }
  ]);
  const [manualName, setManualName] = useState('Custom Session');

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

  const handleLaunchManual = async () => {
    try {
      // Auto-assign any roles not manually cast
      const finalCast = { ...cast };
      const pool = [...availableAgents];
      manualRoles.forEach(role => {
          if (!finalCast[role]) {
              if (pool.length > 0) finalCast[role] = pool.shift()!;
              else finalCast[role] = availableAgents[0] || settings.username || 'user';
          }
      });

      // Create a temporary template and start it
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' 
        },
        body: JSON.stringify({
          manual_template: {
              name: manualName,
              roles: manualRoles,
              phases: manualPhases
          },
          channel: currentChannel,
          cast: finalCast,
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

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[150]" onClose={onClose}>
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
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
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
                    <div className="flex items-center justify-between px-6 sm:px-8 py-6 sm:py-8 shrink-0 border-b border-brand-border/30">
                      <div>
                          <div className="flex items-center gap-2 text-primary mb-1">
                             <Zap size={16} strokeWidth={2.5} />
                             <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">{t('sessions.neural_engine')}</span>
                          </div>
                          <Dialog.Title className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                              {t('sessions.title')}
                          </Dialog.Title>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2.5 sm:p-3 text-on-surface-variant hover:text-on-surface rounded-full bg-on-surface/5 hover:bg-on-surface/10 transition-all border border-brand-border"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 pb-12 pt-6">
                      {selectedTemplate ? (
                        <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
                            <button 
                                onClick={() => setSelectedJob(null)}
                                className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 mb-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20 transition-all"
                            >
                                <ChevronRight size={14} className="rotate-180" /> {t('sessions.back_to_templates')}
                            </button>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1">{t('sessions.session_goal')}</label>
                                <input
                                    type="text"
                                    value={goal}
                                    onChange={e => setGoal(e.target.value)}
                                    placeholder={t('sessions.goal_placeholder')}
                                    className="w-full bg-on-surface/[0.03] border border-brand-border rounded-[20px] px-5 py-4 text-sm text-on-surface focus:border-primary/50 outline-none transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1 block">{t('sessions.cast_config')}</label>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedTemplate.roles.map(role => (
                                        <Dropdown 
                                            key={role}
                                            label={role}
                                            value={cast[role] || ''}
                                            onChange={(val) => setCast({ ...cast, [role]: val })}
                                            options={[...availableAgents, settings.username].filter((a): a is string => !!a).map(a => ({ id: a, name: a }))}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleLaunch}
                                className="w-full flex items-center justify-center gap-3 py-5 bg-primary text-brand-bg hover:opacity-90 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
                            >
                                <Play size={18} fill="currentColor" />
                                {t('sessions.launch_sequence')}
                            </button>
                        </div>
                      ) : isManual ? (
                        <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
                            <button 
                                onClick={() => setIsManual(false)}
                                className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 mb-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20 transition-all"
                            >
                                <ChevronRight size={14} className="rotate-180" /> {t('sessions.back_to_templates')}
                            </button>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1">{t('sessions.phase_name')}</label>
                                    <input
                                        type="text"
                                        value={manualName}
                                        onChange={e => setManualName(e.target.value)}
                                        placeholder="Session Name"
                                        className="w-full bg-on-surface/[0.03] border border-brand-border rounded-[20px] px-5 py-4 text-sm text-on-surface focus:border-primary/50 outline-none transition-all shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1">{t('sessions.session_goal')}</label>
                                    <input
                                        type="text"
                                        value={goal}
                                        onChange={e => setGoal(e.target.value)}
                                        placeholder={t('sessions.goal_placeholder')}
                                        className="w-full bg-on-surface/[0.03] border border-brand-border rounded-[20px] px-5 py-4 text-sm text-on-surface focus:border-primary/50 outline-none transition-all shadow-inner"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">{t('sessions.cast_config')}</label>
                                        <button onClick={() => setManualRoles([...manualRoles, `role${manualRoles.length + 1}`])} className="text-primary hover:text-primary/80 transition-colors">
                                            <Plus size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {manualRoles.map((role, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input 
                                                    value={role}
                                                    onChange={e => {
                                                        const newRoles = [...manualRoles];
                                                        newRoles[idx] = e.target.value;
                                                        setManualRoles(newRoles);
                                                    }}
                                                    className="flex-1 bg-on-surface/[0.03] border border-brand-border rounded-xl px-4 py-2 text-xs text-on-surface focus:border-primary/30 outline-none transition-all"
                                                />
                                                <Dropdown 
                                                    value={cast[role] || ''}
                                                    onChange={(val) => setCast({ ...cast, [role]: val })}
                                                    options={[...availableAgents, settings.username].filter((a): a is string => !!a).map(a => ({ id: a, name: a }))}
                                                />
                                                <button onClick={() => setManualRoles(manualRoles.filter((_, i) => i !== idx))} className="p-2 text-on-surface-variant/30 hover:text-red-500 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">{t('sessions.add_phase')}</label>
                                        <button onClick={() => setManualPhases([...manualPhases, { name: `Phase ${manualPhases.length + 1}`, prompt: '', participants: [manualRoles[0] || ''] }])} className="text-primary hover:text-primary/80 transition-colors">
                                            <Plus size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {manualPhases.map((phase, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-on-surface/[0.03] border border-brand-border space-y-3 relative group">
                                                <button onClick={() => setManualPhases(manualPhases.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1.5 text-on-surface-variant/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <X size={14} />
                                                </button>
                                                <input 
                                                    value={phase.name}
                                                    onChange={e => {
                                                        const newPhases = [...manualPhases];
                                                        newPhases[idx].name = e.target.value;
                                                        setManualPhases(newPhases);
                                                    }}
                                                    placeholder={t('sessions.phase_name')}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-on-surface focus:ring-0 placeholder-on-surface-variant/20"
                                                />
                                                <textarea 
                                                    value={phase.prompt}
                                                    onChange={e => {
                                                        const newPhases = [...manualPhases];
                                                        newPhases[idx].prompt = e.target.value;
                                                        setManualPhases(newPhases);
                                                    }}
                                                    placeholder={t('sessions.phase_prompt')}
                                                    className="w-full bg-transparent border-none p-0 text-xs text-on-surface-variant focus:ring-0 resize-none h-12 placeholder-on-surface-variant/20"
                                                />
                                                <div className="flex flex-wrap gap-1.5">
                                                    {manualRoles.map(role => (
                                                        <button 
                                                            key={role}
                                                            onClick={() => {
                                                                const newPhases = [...manualPhases];
                                                                const ps = new Set(newPhases[idx].participants || []);
                                                                if (ps.has(role)) ps.delete(role);
                                                                else ps.add(role);
                                                                newPhases[idx].participants = Array.from(ps);
                                                                setManualPhases(newPhases);
                                                            }}
                                                            className={cn(
                                                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all border",
                                                                phase.participants?.includes(role) 
                                                                    ? "bg-primary text-brand-bg border-primary" 
                                                                    : "bg-on-surface/5 text-on-surface-variant/30 border-brand-border"
                                                            )}
                                                        >
                                                            {role}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleLaunchManual}
                                className="w-full flex items-center justify-center gap-3 py-5 bg-primary text-brand-bg hover:opacity-90 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
                            >
                                <Play size={18} fill="currentColor" />
                                {t('sessions.launch_sequence')}
                            </button>
                        </div>
                      ) : isDesigning ? (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-8">
                             <button 
                                onClick={() => setIsDesigning(false)}
                                className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 mb-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20 transition-all"
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
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1">{t('sessions.requirement_analysis')}</label>
                                <textarea
                                    value={designDesc}
                                    onChange={e => setDesignDesc(e.target.value)}
                                    placeholder={t('sessions.requirement_placeholder')}
                                    className="w-full bg-on-surface/[0.03] border border-brand-border rounded-[24px] px-5 py-5 text-sm text-on-surface focus:border-primary/50 outline-none transition-all h-40 resize-none custom-scrollbar"
                                />
                            </div>

                            <button
                                onClick={handleSendDesignRequest}
                                disabled={!designAgent || !designDesc.trim()}
                                className="w-full flex items-center justify-center gap-3 py-5 bg-primary text-brand-bg hover:opacity-90 disabled:opacity-20 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
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
                                        className="text-left p-5 sm:p-6 rounded-3xl bg-on-surface/[0.03] border border-brand-border hover:bg-on-surface/[0.06] hover:border-primary/30 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{tmpl.name}</h4>
                                            <div className="p-2 bg-primary/10 rounded-xl text-primary opacity-0 group-hover:opacity-100 transition-all">
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                        <p className="text-xs text-on-surface-variant/50 leading-relaxed mb-4 line-clamp-2">{tmpl.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {tmpl.roles.map(r => (
                                                <span key={r} className="px-2 py-0.5 rounded-lg bg-on-surface/10 border border-brand-border text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest">{r}</span>
                                            ))}
                                        </div>
                                    </button>
                                ))}

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setIsDesigning(true)}
                                        className="p-6 rounded-3xl border-2 border-dashed border-brand-border/30 hover:border-primary/30 bg-on-surface/[0.01] hover:bg-on-surface/[0.02] transition-all text-center group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-on-surface/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <Plus size={24} className="text-on-surface-variant/50 group-hover:text-primary" />
                                        </div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/50 group-hover:text-on-surface">{t('sessions.design_custom')}</h4>
                                        <p className="text-[8px] text-on-surface-variant/30 mt-1 uppercase tracking-tighter">{t('sessions.design_desc')}</p>
                                    </button>
                                    <button
                                        onClick={() => { setIsManual(true); setCast({}); }}
                                        className="p-6 rounded-3xl border-2 border-dashed border-brand-border/30 hover:border-primary/30 bg-on-surface/[0.01] hover:bg-on-surface/[0.02] transition-all text-center group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-on-surface/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <Zap size={24} className="text-on-surface-variant/50 group-hover:text-primary" />
                                        </div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/50 group-hover:text-on-surface">{t('sessions.manual_design')}</h4>
                                        <p className="text-[8px] text-on-surface-variant/30 mt-1 uppercase tracking-tighter">{t('sessions.manual_design_desc')}</p>
                                    </button>
                                </div>
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
