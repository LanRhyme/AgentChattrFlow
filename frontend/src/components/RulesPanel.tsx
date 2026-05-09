import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Shield, Plus, Trash2, CheckCircle2, Clock, Edit2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useWebSocket } from '../hooks/useWebSocket';

export const RulesPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { rules } = useStore();
  const { sendAction } = useWebSocket();
  const activeRules = rules.filter(r => r.status === 'active');
  const draftRules = rules.filter(r => r.status === 'draft');
  const [isCreating, setIsCreating] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editRuleText, setEditRuleText] = useState('');

  const updateStatus = (id: number, status: string) => {
      if (status === 'draft') {
          sendAction({ type: 'rule_make_draft', id });
      } else if (status === 'active') {
          sendAction({ type: 'rule_activate', id });
      }
  };

  const deleteRule = (id: number) => {
      sendAction({ type: 'rule_delete', id });
  };

  const handleCreateRule = () => {
      if (newRuleText.trim()) {
          sendAction({ type: 'rule_propose', text: newRuleText });
          setNewRuleText('');
          setIsCreating(false);
      }
  };

  const startEdit = (id: number, text: string) => {
      setEditingRuleId(id);
      setEditRuleText(text);
  };

  const saveEdit = (id: number) => {
      if (editRuleText.trim()) {
          sendAction({ type: 'rule_edit', id, text: editRuleText });
          setEditingRuleId(null);
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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
                  <div className="flex h-full flex-col bg-brand-panel shadow-2xl border-l border-brand-border ring-1 ring-white/5">
                    <div className="flex items-center justify-between px-8 py-8">
                      <div>
                          <div className="flex items-center gap-2 text-primary-500 mb-1">
                             <Shield size={16} strokeWidth={2.5} />
                             <span className="text-[11px] font-black uppercase tracking-[0.2em]">Protocol Control</span>
                          </div>
                          <Dialog.Title className="text-2xl font-bold text-white tracking-tight">
                              System Rules
                          </Dialog.Title>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-3 text-on-surface-variant hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all border border-brand-border"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 space-y-10 pb-12">
                      <section>
                        <h3 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 px-1">
                          <CheckCircle2 size={12} className="text-primary-500" />
                          Active Protocols
                        </h3>
                        {activeRules.length === 0 ? (
                            <div className="p-8 rounded-3xl border border-dashed border-white/5 bg-white/[0.01] text-center">
                                <p className="text-xs font-medium text-gray-600">No active directives found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                            {activeRules.map((rule) => (
                                <div key={rule.id} className="p-5 bg-white/[0.03] border border-brand-border rounded-[24px] group relative hover:bg-white/[0.05] transition-all">
                                    {editingRuleId === rule.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                autoFocus
                                                value={editRuleText}
                                                onChange={(e) => setEditRuleText(e.target.value)}
                                                className="w-full bg-black/20 border border-primary-500/30 rounded-xl p-3 text-sm text-white focus:ring-0 resize-none h-24 custom-scrollbar"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => saveEdit(rule.id)} className="px-3 py-1.5 bg-primary-500 text-brand-bg rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-400">Save</button>
                                                <button onClick={() => setEditingRuleId(null)} className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/20">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[15px] text-gray-200 leading-relaxed pr-8">
                                                {rule.text}
                                            </p>
                                            <div className="mt-4 flex items-center gap-4">
                                                <button onClick={() => updateStatus(rule.id, 'draft')} className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors">Demote to Draft</button>
                                            </div>
                                            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => startEdit(rule.id, rule.text)} className="p-2 text-gray-500 hover:text-primary-400 rounded-lg hover:bg-primary-500/10">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteRule(rule.id)} className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            </div>
                        )}
                      </section>

                      <section>
                        <h3 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 px-1">
                          <Clock size={12} className="text-amber-500" />
                          Neural Drafts
                        </h3>
                        {draftRules.length === 0 ? (
                            <div className="p-8 rounded-3xl border border-dashed border-white/5 bg-white/[0.01] text-center">
                                <p className="text-xs font-medium text-gray-600">Draft sequence is empty.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                            {draftRules.map((rule) => (
                                <div key={rule.id} className="p-5 bg-white/[0.02] border border-white/5 border-dashed rounded-[24px] group relative hover:bg-white/[0.04] transition-all">
                                    {editingRuleId === rule.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                autoFocus
                                                value={editRuleText}
                                                onChange={(e) => setEditRuleText(e.target.value)}
                                                className="w-full bg-black/20 border border-primary-500/30 rounded-xl p-3 text-sm text-white focus:ring-0 resize-none h-24 custom-scrollbar"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => saveEdit(rule.id)} className="px-3 py-1.5 bg-primary-500 text-brand-bg rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-400">Save</button>
                                                <button onClick={() => setEditingRuleId(null)} className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/20">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[14px] text-gray-500 leading-relaxed pr-8 italic">
                                                {rule.text}
                                            </p>
                                            <div className="mt-4 flex items-center gap-4">
                                                <button onClick={() => updateStatus(rule.id, 'active')} className="text-[10px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-400 transition-colors">Activate</button>
                                            </div>
                                            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => startEdit(rule.id, rule.text)} className="p-2 text-gray-500 hover:text-primary-400 rounded-lg hover:bg-primary-500/10">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteRule(rule.id)} className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            </div>
                        )}
                      </section>

                      {isCreating && (
                          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="p-5 bg-white/[0.02] border border-primary-500/30 border-dashed rounded-[24px]">
                                  <textarea
                                      autoFocus
                                      value={newRuleText}
                                      onChange={(e) => setNewRuleText(e.target.value)}
                                      placeholder="Define new directive..."
                                      className="w-full bg-transparent border-none text-sm text-white placeholder-gray-600 focus:ring-0 resize-none h-24 custom-scrollbar mb-4"
                                  />
                                  <div className="flex items-center gap-3">
                                      <button onClick={handleCreateRule} className="px-4 py-2 bg-primary-500 text-brand-bg rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Save Directive</button>
                                      <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                                  </div>
                              </div>
                          </section>
                      )}
                    </div>

                    <div className="p-8 bg-brand-panel border-t border-brand-border">
                      <button 
                        onClick={() => {
                            setIsCreating(true);
                            setTimeout(() => {
                                const el = document.querySelector('.flex-1.overflow-y-auto');
                                if (el) el.scrollTop = el.scrollHeight;
                            }, 50);
                        }} 
                        className="w-full flex items-center justify-center gap-3 py-5 bg-primary-600 text-brand-bg hover:bg-primary-500 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
                      >
                        <Plus size={18} strokeWidth={3} />
                        Inject New Directive
                      </button>
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


