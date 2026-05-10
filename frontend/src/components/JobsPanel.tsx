import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { X, Briefcase, Plus, ChevronRight, LayoutGrid, Timer, History, Send, Zap, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Job } from '../store/useStore';
import { Markdown } from './Markdown';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const JobsPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { jobs, currentChannel, settings } = useStore();
  const { t } = useTranslation();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [jobMessages, setJobMessages] = useState<any[]>([]);
  const [newJobMessage, setNewJobMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredJobs = jobs.filter(j => j.channel === currentChannel);
  const openJobs = filteredJobs.filter(j => j.status === 'open');
  const activeJobs = filteredJobs.filter(j => j.status === 'active'); 
  const archivedJobs = filteredJobs.filter(j => j.status === 'done' || j.status === 'archived');

  const categories = [
    { id: 'open', name: t('jobs.backlog'), count: openJobs.length, items: openJobs, icon: LayoutGrid },
    { id: 'active', name: t('jobs.active'), count: activeJobs.length, items: activeJobs, icon: Timer },
    { id: 'resolved', name: t('jobs.resolved'), count: archivedJobs.length, items: archivedJobs, icon: History },
  ];

  const fetchJobMessages = async (jobId: number) => {
      try {
          const resp = await fetch(`/api/jobs/${jobId}/messages`, {
              headers: { 'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' }
          });
          if (resp.ok) {
              const data = await resp.json();
              setJobMessages(data);
          }
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {
      // Refresh current selected job if it exists in the main store
      if (selectedJob) {
          const updated = jobs.find(j => j.id === selectedJob.id);
          if (updated) setSelectedJob(updated);
      }
  }, [jobs]);

  useEffect(() => {
      if (selectedJob) {
          fetchJobMessages(selectedJob.id);
          // Simple poll for job messages while panel is open
          const interval = setInterval(() => fetchJobMessages(selectedJob.id), 3000);
          return () => clearInterval(interval);
      } else {
          setJobMessages([]);
      }
  }, [selectedJob?.id]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [jobMessages]);

  const handleCreateJob = async () => {
      if (!newJobTitle.trim()) return;
      try {
          const res = await fetch('/api/jobs', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'X-Session-Token': (window as any).__SESSION_TOKEN__ || ''
              },
              body: JSON.stringify({
                  title: newJobTitle.trim(),
                  channel: currentChannel,
                  type: 'job'
              })
          });
          if (res.ok) {
              setNewJobTitle('');
              setIsCreating(false);
          }
      } catch (err) {
          console.error(err);
      }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
      try {
          await fetch(`/api/jobs/${id}`, {
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json',
                  'X-Session-Token': (window as any).__SESSION_TOKEN__ || ''
              },
              body: JSON.stringify({ status })
          });
      } catch (err) {
          console.error(err);
      }
  };

  const handleDeleteJob = async (id: number) => {
      if (!window.confirm(t('common.delete_confirm'))) return;
      try {
          await fetch(`/api/jobs/${id}?permanent=true`, {
              method: 'DELETE',
              headers: { 'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' }
          });
          if (selectedJob?.id === id) setSelectedJob(null);
      } catch (err) {
          console.error(err);
      }
  };

  const handlePostMessage = async () => {
      if (!selectedJob || !newJobMessage.trim()) return;
      try {
          await fetch(`/api/jobs/${selectedJob.id}/messages`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'X-Session-Token': (window as any).__SESSION_TOKEN__ || ''
              },
              body: JSON.stringify({
                  text: newJobMessage.trim(),
                  sender: settings.username
              })
          });
          setNewJobMessage('');
          fetchJobMessages(selectedJob.id);
      } catch (err) {
          console.error(err);
      }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-md transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-hidden">
          <div className="flex h-full items-center justify-center sm:p-4 sm:p-6 lg:p-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="flex h-full sm:max-h-[90vh] w-full max-w-6xl transform flex-col overflow-hidden sm:rounded-[40px] bg-brand-panel text-left align-middle shadow-[0_32px_120px_-24px_rgba(0,0,0,0.8)] transition-all border border-brand-border ring-1 ring-white/5">
                <div className="flex flex-1 overflow-hidden relative">
                  {/* Left Column: Board */}
                  <div className={cn(
                      "flex flex-col w-full lg:w-96 border-r border-brand-border bg-brand-bg/30 shrink-0 transition-all",
                      selectedJob ? "hidden lg:flex" : "flex"
                  )}>
                    <div className="p-6 sm:p-8 shrink-0">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Briefcase size={20} />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">{t('common.jobs_board')}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIsCreating(!isCreating)}
                                    className={cn(
                                        "p-2 rounded-xl transition-all border",
                                        isCreating 
                                            ? "bg-primary text-brand-bg border-primary rotate-45" 
                                            : "bg-on-surface/5 text-on-surface-variant hover:text-primary hover:bg-primary/10 border-brand-border/50"
                                    )}
                                    title={t('jobs.create_new')}
                                >
                                    <Plus size={20} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface rounded-xl bg-on-surface/5 border border-brand-border/50"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        
                        <Transition
                            show={isCreating}
                            enter="transition-all duration-300 ease-out"
                            enterFrom="opacity-0 -translate-y-4 scale-95"
                            enterTo="opacity-100 translate-y-0 scale-100"
                            leave="transition-all duration-200 ease-in"
                            leaveFrom="opacity-100 translate-y-0 scale-100"
                            leaveTo="opacity-0 -translate-y-4 scale-95"
                        >
                            <div className="relative group mb-6">
                                <input 
                                    type="text"
                                    value={newJobTitle}
                                    onChange={(e) => setNewJobTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateJob()}
                                    placeholder={t('jobs.job_title_placeholder')}
                                    className="w-full bg-on-surface/5 border border-brand-border rounded-[20px] px-5 py-3.5 text-sm text-on-surface placeholder-on-surface-variant/40 focus:border-primary/50 focus:bg-on-surface/[0.08] outline-none transition-all pr-12 shadow-inner"
                                    autoFocus
                                />
                                <button 
                                    onClick={handleCreateJob}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-brand-bg rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95"
                                >
                                    <Send size={16} strokeWidth={3} />
                                </button>
                            </div>
                        </Transition>
                    </div>

                    <Tab.Group className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 sm:px-8">
                            <Tab.List className="flex gap-1 mb-6 bg-on-surface/5 p-1 rounded-2xl border border-brand-border/30">
                                {categories.map((cat) => (
                                    <Tab
                                        key={cat.name}
                                        className={({ selected }) => cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                            selected 
                                                ? "bg-brand-panel text-primary shadow-sm ring-1 ring-white/5" 
                                                : "text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5"
                                        )}
                                    >
                                        <cat.icon size={14} />
                                        <span className="hidden sm:inline">{cat.name}</span>
                                        <span className="opacity-40">{cat.count}</span>
                                    </Tab>
                                ))}
                            </Tab.List>
                        </div>

                        <Tab.Panels className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 pb-8 space-y-4">
                            {categories.map((cat, idx) => (
                                <Tab.Panel key={idx} className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-500">
                                    {cat.items.length === 0 ? (
                                        <div className="py-12 text-center border-2 border-dashed border-brand-border/10 rounded-3xl opacity-20">
                                            <Briefcase size={40} className="mx-auto mb-4" />
                                            <p className="text-xs font-bold uppercase tracking-widest">{t('jobs.no_jobs')}</p>
                                        </div>
                                    ) : (
                                        cat.items.map(job => (
                                            <button
                                                key={job.id}
                                                onClick={() => setSelectedJob(job)}
                                                className={cn(
                                                    "w-full text-left p-4 sm:p-5 rounded-[24px] border transition-all group relative overflow-hidden",
                                                    selectedJob?.id === job.id 
                                                        ? "bg-primary-container border-primary/30 shadow-lg" 
                                                        : "bg-surface-high border-brand-border hover:border-white/10 hover:bg-surface-low"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <h4 className={cn(
                                                        "text-[13px] sm:text-sm font-bold tracking-tight leading-snug flex-1",
                                                        selectedJob?.id === job.id ? "text-on-primary-container" : "text-on-surface"
                                                    )}>
                                                        {job.title}
                                                    </h4>
                                                    <ChevronRight size={16} className={cn(
                                                        "shrink-0 transition-transform",
                                                        selectedJob?.id === job.id ? "text-on-primary-container translate-x-1" : "text-brand-border"
                                                    )} />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border",
                                                        job.status === 'open' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                        job.status === 'done' ? "bg-primary/10 text-primary border-primary/20" :
                                                        "bg-on-surface/5 text-on-surface-variant/50 border-brand-border"
                                                    )}>
                                                        {job.status}
                                                    </span>
                                                    <span className="text-[10px] text-on-surface-variant/50 font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </Tab.Panel>
                            ))}
                        </Tab.Panels>
                    </Tab.Group>
                  </div>

                  {/* Detail Area */}
                  <div className={cn(
                      "flex-1 flex flex-col bg-brand-bg relative",
                      !selectedJob ? "hidden lg:flex" : "flex"
                  )}>
                        {selectedJob ? (
                            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
                                {/* Mobile Back Button */}
                                <div className="lg:hidden p-4 border-b border-brand-border/30 bg-brand-bg/30">
                                    <button 
                                        onClick={() => setSelectedJob(null)}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
                                    >
                                        <ChevronRight size={14} className="rotate-180" /> {t('common.back')}
                                    </button>
                                </div>

                                {/* Detail Header */}
                                <div className="p-6 sm:p-10 border-b border-brand-border/30 shrink-0">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">Task ID #{selectedJob.id}</span>
                                        <div className="h-px flex-1 bg-brand-border/30" />
                                    </div>
                                    <h4 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight mb-6 leading-tight">{selectedJob.title}</h4>
                                    
                                    <div className="flex flex-wrap items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">{t('jobs.status')}</p>
                                            <div className="flex gap-2">
                                                {['open', 'active', 'done', 'archived'].map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleUpdateStatus(selectedJob.id, s)}
                                                        className={cn(
                                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                                                            selectedJob.status === s 
                                                                ? "bg-primary text-brand-bg border-primary" 
                                                                : "bg-on-surface/5 text-on-surface-variant/50 border-brand-border hover:text-on-surface"
                                                        )}
                                                    >
                                                        {t(`jobs.${s}`) || s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteJob(selectedJob.id)}
                                            className="p-2.5 text-on-surface-variant/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                                            title={t('common.delete')}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Feed */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 space-y-8 bg-surface-low/20">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="h-px flex-1 bg-brand-border/30" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30">{t('jobs.messages')}</p>
                                        <div className="h-px flex-1 bg-brand-border/30" />
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {jobMessages.length === 0 ? (
                                            <div className="py-12 text-center border-2 border-dashed border-brand-border/10 rounded-3xl opacity-20">
                                                <p className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-[0.3em]">{t('jobs.no_comms')}</p>
                                            </div>
                                        ) : (
                                            jobMessages.map((msg, i) => (
                                                <div key={i} className="group flex gap-4 sm:gap-5">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-surface-high border border-brand-border flex items-center justify-center text-primary shrink-0">
                                                        <Zap size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline gap-3 mb-2">
                                                            <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant truncate">{msg.sender}</span>
                                                            <span className="text-[9px] text-on-surface-variant/30 font-bold tabular-nums shrink-0">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                                        </div>
                                                        <div className="text-[13px] text-on-surface-variant/80 leading-relaxed bg-on-surface/[0.02] border border-brand-border/30 p-4 rounded-2xl group-hover:bg-on-surface/[0.04] transition-all overflow-hidden break-words">
                                                            <Markdown content={msg.text} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>

                                {/* Detail Input */}
                                <div className="p-4 sm:p-8 border-t border-brand-border/30 bg-surface-low/50">
                                    <div className="relative group max-w-4xl mx-auto">
                                        <div className="absolute -inset-1 bg-primary/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-500" />
                                        <div className="relative flex items-center gap-4 bg-surface-high border border-brand-border group-focus-within:border-primary/50 rounded-[20px] p-2 pl-4 sm:pl-6 transition-all shadow-inner">
                                            <input 
                                                value={newJobMessage}
                                                onChange={(e) => setNewJobMessage(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handlePostMessage()}
                                                placeholder={t('jobs.type_message')}
                                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder-on-surface-variant/40"
                                            />
                                            <button 
                                                onClick={handlePostMessage}
                                                className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary text-brand-bg rounded-[14px] transition-all active:scale-90 shrink-0"
                                            >
                                                <Send size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-12 opacity-20 select-none">
                                <div className="w-24 h-24 rounded-[40px] bg-on-surface/[0.02] border border-brand-border flex items-center justify-center mb-8">
                                    <Briefcase size={40} className="text-primary" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight text-on-surface mb-3 uppercase tracking-[0.2em]">Void Vector</h3>
                                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50">Select a task from the ledger to inspect its neural grid</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Close Button Desktop */}
                <button
                    onClick={onClose}
                    className="hidden lg:flex absolute top-8 right-8 p-3 text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5 rounded-full border border-brand-border transition-all"
                >
                    <X size={24} />
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
