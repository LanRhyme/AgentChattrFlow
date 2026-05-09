import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { X, Briefcase, Plus, ChevronRight, LayoutGrid, Timer, History, Trash2, CheckCircle2, Send } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Job } from '../store/useStore';
import { Markdown } from './Markdown';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const JobsPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { jobs, currentChannel, settings } = useStore();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  
  const [jobMessages, setJobMessages] = useState<any[]>([]);
  const [newJobMessage, setNewJobMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredJobs = jobs.filter(j => j.channel === currentChannel);
  const openJobs = filteredJobs.filter(j => j.status === 'open');
  const activeJobs = filteredJobs.filter(j => j.status === 'done'); 
  const archivedJobs = filteredJobs.filter(j => j.status === 'archived');

  const categories = [
    { name: 'Backlog', count: openJobs.length, items: openJobs, icon: LayoutGrid },
    { name: 'Active', count: activeJobs.length, items: activeJobs, icon: Timer },
    { name: 'Resolved', count: archivedJobs.length, items: archivedJobs, icon: History },
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
      if (selectedJob) {
          fetchJobMessages(selectedJob.id);
          // Simple poll for job messages while panel is open
          const interval = setInterval(() => fetchJobMessages(selectedJob.id), 3000);
          return () => clearInterval(interval);
      } else {
          setJobMessages([]);
      }
  }, [selectedJob]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [jobMessages]);

  const handleCreateJob = async () => {
      if (!newJobTitle.trim()) return;
      try {
          await fetch('/api/jobs', {
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
          setNewJobTitle('');
          setIsCreating(false);
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
      try {
          await fetch(`/api/jobs/${id}?permanent=true`, {
              method: 'DELETE',
              headers: {
                  'X-Session-Token': (window as any).__SESSION_TOKEN__ || ''
              }
          });
          if (selectedJob?.id === id) setSelectedJob(null);
      } catch (err) {
          console.error(err);
      }
  };

  const handleSendJobMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newJobMessage.trim() || !selectedJob) return;
      try {
          await fetch(`/api/jobs/${selectedJob.id}/messages`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'X-Session-Token': (window as any).__SESSION_TOKEN__ || ''
              },
              body: JSON.stringify({
                  text: newJobMessage.trim(),
                  sender: settings.username || 'user'
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
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-8 shrink-0">
                      <div>
                          <div className="flex items-center gap-2 text-primary-500 mb-1">
                             <Briefcase size={16} strokeWidth={2.5} />
                             <span className="text-[11px] font-black uppercase tracking-[0.2em]">Matrix Control</span>
                          </div>
                          <Dialog.Title className="text-2xl font-bold text-white tracking-tight">
                              Jobs Intelligence
                          </Dialog.Title>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-3 text-on-surface-variant hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all border border-brand-border"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 flex flex-col">
                      {selectedJob ? (
                        <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col flex-1 pb-6">
                            <button 
                                onClick={() => setSelectedJob(null)}
                                className="inline-flex items-center gap-2 text-xs font-bold text-primary-500 hover:text-primary-400 mb-6 bg-primary-500/5 px-3 py-1.5 rounded-full border border-primary-500/20 transition-all self-start shrink-0"
                            >
                                <ChevronRight size={14} className="rotate-180" /> Return to Hub
                            </button>
                            
                            <div className="p-6 rounded-[24px] bg-white/[0.03] border border-brand-border relative overflow-hidden mb-6 shadow-inner shrink-0">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Briefcase size={60} />
                                </div>
                                <h3 className="text-xl font-extrabold text-white leading-tight mb-4 relative z-10">{selectedJob.title}</h3>
                                <div className="flex flex-wrap gap-2 relative z-10 mb-4">
                                    <div className="px-2 py-0.5 rounded flex items-center bg-primary-500/10 border border-primary-500/20 text-[9px] font-black text-primary-400 uppercase tracking-widest">
                                        Source: {selectedJob.created_by}
                                    </div>
                                </div>
                                {selectedJob.body && (
                                    <div className="prose prose-invert prose-sm max-w-none text-gray-400 relative z-10 bg-black/20 p-4 rounded-xl border border-white/5">
                                        <Markdown content={selectedJob.body} />
                                    </div>
                                )}

                                <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedJob.id, selectedJob.status === 'open' ? 'done' : 'open')}
                                        className="p-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 rounded-lg transition-all"
                                        title="Toggle Status"
                                    >
                                        <CheckCircle2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteJob(selectedJob.id)}
                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                                        title="Delete Job"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Job Conversation View */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/10 rounded-[24px] border border-white/5 p-4 flex flex-col gap-3 min-h-[300px]">
                                {jobMessages.length === 0 ? (
                                    <div className="m-auto text-center opacity-30">
                                        <Briefcase size={32} className="mx-auto mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No transmissions yet</p>
                                    </div>
                                ) : (
                                    jobMessages.map((msg, idx) => {
                                        const isSelf = msg.sender.toLowerCase() === settings.username?.toLowerCase();
                                        return (
                                            <div key={idx} className={cn("flex flex-col max-w-[85%]", isSelf ? "self-end items-end" : "self-start items-start")}>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1 px-1">{msg.sender}</span>
                                                <div className={cn(
                                                    "p-3 text-sm rounded-2xl shadow-sm",
                                                    isSelf 
                                                        ? "bg-primary-container text-on-primary-container rounded-tr-none border border-primary-500/20" 
                                                        : "bg-surface-high text-on-surface rounded-tl-none border border-brand-border"
                                                )}>
                                                    <Markdown content={msg.text} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Job Input */}
                            <form onSubmit={handleSendJobMessage} className="mt-4 flex gap-3 shrink-0">
                                <input
                                    type="text"
                                    value={newJobMessage}
                                    onChange={e => setNewJobMessage(e.target.value)}
                                    placeholder={`Send to @${selectedJob.created_by}...`}
                                    className="flex-1 bg-surface-high border border-brand-border rounded-xl px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500/50 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newJobMessage.trim()}
                                    className="p-3 bg-primary-500 hover:bg-primary-400 disabled:opacity-20 text-brand-bg rounded-xl transition-all shadow-lg"
                                >
                                    <Send size={18} strokeWidth={2.5} />
                                </button>
                            </form>
                        </div>
                      ) : (
                        <Tab.Group>
                          <Tab.List className="flex gap-2 p-1.5 rounded-2xl bg-white/5 border border-brand-border mb-10">
                            {categories.map((category) => (
                              <Tab
                                key={category.name}
                                className={({ selected }) => cn(
                                  "flex-1 flex items-center justify-center gap-2 rounded-[14px] py-3 text-[11px] font-bold uppercase tracking-wider transition-all outline-none",
                                   selected 
                                     ? "bg-primary-500 text-brand-bg shadow-[0_8px_20px_-4px_rgba(76,175,80,0.4)]"
                                     : "text-on-surface-variant hover:text-white hover:bg-white/5"
                                )}
                              >
                                {({ selected }) => (
                                    <>
                                        <category.icon size={14} strokeWidth={selected ? 3 : 2} />
                                        {category.name}
                                        <span className={cn(
                                            "ml-1 text-[10px] opacity-60",
                                            selected ? "text-brand-bg font-black" : "text-gray-500"
                                        )}>
                                          {category.count}
                                        </span>
                                    </>
                                )}
                              </Tab>
                            ))}
                          </Tab.List>
                          <Tab.Panels>
                            {categories.map((category, idx) => (
                              <Tab.Panel key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none pb-12">
                                {category.items.length === 0 ? (
                                  <div className="text-center py-32 rounded-[40px] border-2 border-dashed border-white/5 bg-white/[0.01]">
                                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em]">Sector Dormant</p>
                                  </div>
                                ) : (
                                  category.items.map((job) => (
                                    <div
                                      key={job.id}
                                      className="w-full flex items-stretch text-left p-6 rounded-3xl bg-white/[0.03] border border-brand-border hover:bg-white/[0.06] hover:border-primary-500/30 transition-all group shadow-sm hover:shadow-primary-900/10 cursor-pointer relative"
                                      onClick={() => setSelectedJob(job)}
                                    >
                                      <div className="flex-1">
                                          <div className="flex justify-between items-start gap-4 mb-4">
                                            <h4 className="text-lg font-bold text-gray-100 group-hover:text-primary-400 transition-colors leading-tight">
                                              {job.title}
                                            </h4>
                                            <ChevronRight size={16} className="text-gray-600 group-hover:text-primary-500 transition-all mt-1" />
                                          </div>
                                          <div className="flex items-center justify-between mt-auto">
                                              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-tighter bg-black/20 px-2.5 py-1 rounded-lg">
                                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                                  {job.created_by}
                                              </div>
                                              <div className="text-[10px] font-black text-white/10 italic">SEQ_{job.id}</div>
                                          </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </Tab.Panel>
                            ))}
                          </Tab.Panels>
                        </Tab.Group>
                      )}

                      {/* Create Form */}
                      {isCreating && !selectedJob && (
                          <div className="mt-8 mb-12 p-6 bg-white/[0.02] border border-primary-500/30 border-dashed rounded-[24px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                               <input
                                  type="text"
                                  autoFocus
                                  value={newJobTitle}
                                  onChange={(e) => setNewJobTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCreateJob();
                                      if (e.key === 'Escape') setIsCreating(false);
                                  }}
                                  placeholder="Enter job sequence title..."
                                  className="w-full bg-transparent border-none text-lg font-bold text-white placeholder-gray-600 focus:ring-0 mb-4"
                              />
                              <div className="flex items-center gap-3">
                                  <button onClick={handleCreateJob} className="px-4 py-2 bg-primary-500 text-brand-bg rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Execute Sequence</button>
                                  <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-white transition-all">Abort</button>
                              </div>
                          </div>
                      )}
                    </div>

                    {!selectedJob && (
                        <div className="p-8 bg-brand-panel border-t border-brand-border shrink-0">
                          <button 
                              onClick={() => {
                                  setIsCreating(true);
                                  setTimeout(() => {
                                      const el = document.querySelector('.flex-1.overflow-y-auto');
                                      if (el) el.scrollTop = el.scrollHeight;
                                  }, 50);
                              }}
                              className="w-full flex items-center justify-center gap-3 py-5 bg-white text-brand-bg hover:bg-primary-100 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
                          >
                            <Plus size={18} strokeWidth={3} />
                            Sync New Job
                          </button>
                        </div>
                    )}
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

