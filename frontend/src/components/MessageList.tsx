import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Message as MessageType } from '../store/useStore';
import { Markdown } from './Markdown';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { File, ArrowRight, ArrowLeft, Briefcase, Shield, CheckCircle, Clock, Reply as ReplyIcon, Trash2, Copy, Pin, Play, Zap, AlertCircle } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTranslation } from 'react-i18next';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const Message = ({ message }: { message: MessageType }) => {
  const { agents, settings, setReplyingTo, messages, status } = useStore();
  const { sendAction } = useWebSocket();
  const { t } = useTranslation();
  const lowerSender = message.sender.toLowerCase();
  const agent = agents[message.sender]; // Use original case for lookup
  const color = agent?.color || 'var(--color-primary-400)';
  const isSelf = lowerSender === settings.username?.toLowerCase();
  
  // High-fidelity thinking state detection
  const isThinking = status?.[message.sender]?.busy;

  const handleReply = () => setReplyingTo(message);
  const handleDelete = () => sendAction({ type: 'delete', ids: [message.id] });

  const handleCopy = async () => {
      try {
          await navigator.clipboard.writeText(message.text || '');
      } catch (err) {
          console.error('Failed to copy', err);
      }
  };

  const handleTodoToggle = () => {
      sendAction({ type: 'todo_toggle', id: message.id });
  };

  const handleDemote = async () => {
      try {
          await fetch(`/api/messages/${message.id}/demote`, {
              method: 'POST',
              headers: { 'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' }
          });
      } catch (err) {
          console.error(err);
      }
  };

  const handleRequestChanges = () => {
      handleDemote();
      setReplyingTo(message);
  };

  const handleResolveDecision = async (choice: string) => {
      try {
          await fetch(`/api/messages/${message.id}/resolve_decision`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' 
              },
              body: JSON.stringify({ choice })
          });
      } catch (err) {
          console.error(err);
      }
  };

  const handleRunDraft = async () => {
      try {
          await fetch('/api/sessions/start', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' 
              },
              body: JSON.stringify({
                  draft_message_id: message.id,
                  channel: message.channel,
                  started_by: settings.username
              }),
          });
      } catch (err) {
          console.error(err);
      }
  };

  const parentMessage = message.reply_to ? messages.find(m => m.id === message.reply_to) : null;

  // Special Message Types
  if (message.type === 'join' || message.type === 'leave') {
      return (
          <div className="flex items-center justify-center py-2 opacity-50">
              <div className="bg-on-surface/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-on-surface/5">
                  {message.type === 'join' ? <ArrowRight size={12} className="text-primary" /> : <ArrowLeft size={12} className="text-red-500" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface">
                      <span style={{ color }}>{message.sender}</span> {message.type === 'join' ? t('messages.connected') : t('messages.disconnected')}
                  </span>
              </div>
          </div>
      );
  }

  if (message.type === 'summary') {
      return (
          <div className="px-10 py-6">
              <div className="max-w-2xl mx-auto bg-surface-high border border-brand-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex items-center gap-3 mb-4">
                      <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/20">{t('messages.summary')}</div>
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest" style={{ color }}>{message.sender}</span>
                  </div>
                  <div className="text-sm leading-relaxed text-on-surface">
                      {message.text}
                  </div>
              </div>
          </div>
      );
  }

  if (message.type === 'session_start' || message.type === 'session_end' || message.type === 'session_phase') {
      const isStart = message.type === 'session_start';
      const isEnd = message.type === 'session_end';
      return (
          <div className="px-10 py-4 flex justify-center">
              <div className={cn(
                  "px-6 py-3 rounded-2xl border flex items-center gap-4 shadow-lg",
                  isStart ? "bg-primary/10 border-primary/30 text-primary" : 
                  isEnd ? "bg-surface-high border-brand-border text-on-surface-variant" :
                  "bg-surface-low border-brand-border text-on-surface"
              )}>
                  <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isStart ? "bg-primary text-brand-bg" : "bg-surface-high text-on-surface"
                  )}>
                      {isStart ? <Play size={16} fill="currentColor" /> : isEnd ? <Zap size={16} /> : <ArrowRight size={16} />}
                  </div>
                  <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">
                          {isStart ? t('messages.orchestration_initiated') : isEnd ? t('messages.sequence_terminated') : t('messages.phase_transition')}
                      </p>
                      <p className="text-sm font-bold text-on-surface truncate">{message.text}</p>
                  </div>
              </div>
          </div>
      );
  }

  if (message.type === 'session_draft') {
      const meta = message.metadata || {};
      const tmpl = meta.template || {};
      const phases = tmpl.phases || [];
      return (
          <div className={cn("flex gap-4 px-10 py-5", isSelf ? "flex-row-reverse" : "flex-row")}>
              <div className="flex flex-col max-w-[85%] lg:max-w-[75%] items-start w-full">
                  <div className="w-full bg-surface-high border border-brand-border rounded-[28px] overflow-hidden shadow-xl relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                      <div className="p-5 border-b border-white/5 bg-black/10 flex items-center gap-3">
                          <Zap size={16} className="text-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{t('messages.session_proposal')}</span>
                          <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest ml-auto" style={{ color }}>{t('messages.proposed_by', { sender: message.sender })}</span>
                      </div>
                      <div className="p-6 space-y-6">
                          <div>
                              <h4 className="text-lg font-bold text-on-surface leading-tight mb-2">{tmpl.name}</h4>
                              <p className="text-xs text-on-surface-variant/70 leading-relaxed">{tmpl.description}</p>
                          </div>
                          
                          {!meta.valid && (
                              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex gap-3">
                                  <AlertCircle size={16} className="shrink-0" />
                                  <div>
                                      <p className="font-black uppercase tracking-widest mb-2">{t('messages.invalid_draft')}</p>
                                      <ul className="list-disc pl-4 space-y-1">
                                          {meta.errors?.map((e: string, i: number) => <li key={i}>{e}</li>)}
                                      </ul>
                                  </div>
                              </div>
                          )}

                          <div className="space-y-3">
                              {phases.map((p: any, i: number) => (
                                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-on-surface/[0.02] border border-brand-border/50">
                                      <div className="w-6 h-6 rounded-lg bg-on-surface/5 flex items-center justify-center text-[10px] font-black text-on-surface-variant/50 shrink-0">{i+1}</div>
                                      <div className="min-w-0">
                                          <p className="text-xs font-bold text-on-surface mb-1">{p.name}</p>
                                          <div className="flex flex-wrap gap-1.5 mb-2">
                                              {p.participants?.map((role: string) => (
                                                  <span key={role} className="px-1.5 py-0.5 rounded bg-surface-low/50 text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-tighter border border-brand-border/50">{role}</span>
                                              ))}
                                          </div>
                                          <p className="text-[11px] text-on-surface-variant/50 italic line-clamp-2">{p.prompt}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <div className="flex flex-wrap gap-3">
                              {meta.valid && (
                                  <button onClick={handleRunDraft} className="px-5 py-2.5 bg-primary text-brand-bg rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 active:scale-95">
                                      <Play size={14} fill="currentColor" /> {t('messages.run_session')}
                                  </button>
                              )}
                              <button onClick={handleRequestChanges} className="px-5 py-2.5 bg-on-surface/5 hover:bg-on-surface/10 text-on-surface border border-brand-border rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                                  {t('messages.request_changes')}
                              </button>
                              <button onClick={handleDemote} className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                                  {t('messages.dismiss')}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (message.type === 'job_proposal') {
      const meta = message.metadata || {};
      const isPending = (meta.status || 'pending') === 'pending';
      return (
          <div className={cn("flex gap-4 px-10 py-5 group relative", isSelf ? "flex-row-reverse" : "flex-row")}>
              {/* Message Actions */}
              <div className={cn(
                  "absolute top-5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1",
                  isSelf ? "left-10" : "right-10"
              )}>
                  <button onClick={handleReply} className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.reply')}>
                      <ReplyIcon size={16} />
                  </button>
                  <button onClick={handleCopy} className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.copy')}>
                      <Copy size={16} />
                  </button>
                  <button onClick={handleTodoToggle} className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.pin_todo')}>
                      <Pin size={16} />
                  </button>
                  <button onClick={handleDelete} className="p-2 text-on-surface-variant/50 hover:text-red-500 hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.delete')}>
                      <Trash2 size={16} />
                  </button>
              </div>
              <div className="flex flex-col max-w-[85%] lg:max-w-[75%] items-start w-full">
                  <div className="w-full bg-surface-high border border-brand-border rounded-[28px] overflow-hidden shadow-lg">
                      <div className="p-5 border-b border-brand-border/50 bg-surface-low/50 flex items-center gap-3">
                          <Briefcase size={16} className="text-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{t('messages.job_proposal')}</span>
                          <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest ml-auto" style={{ color }}>{t('messages.from', { sender: message.sender })}</span>
                      </div>
                      <div className="p-6 space-y-4">
                          <h4 className="text-lg font-bold text-on-surface leading-tight">{meta.title}</h4>
                          {meta.body && (
                              <div className="text-sm text-on-surface-variant/70 p-4 rounded-2xl bg-on-surface/[0.02] border border-brand-border/50">
                                  <Markdown content={meta.body} />
                              </div>
                          )}
                          {isPending ? (
                              <div className="flex flex-wrap gap-3 pt-2">
                                  <button onClick={handleDemote} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95">
                                      <CheckCircle size={14} /> {t('messages.accept_via_system')}
                                  </button>
                                  <button onClick={handleRequestChanges} className="px-4 py-2 bg-on-surface/5 hover:bg-on-surface/10 text-on-surface border border-brand-border rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95">
                                      {t('messages.request_changes')}
                                  </button>
                                  <button onClick={handleDemote} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                                      {t('messages.dismiss')}
                                  </button>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest bg-surface-low/50 px-3 py-2 rounded-xl inline-flex border border-brand-border/50">
                                  <Clock size={14} /> {meta.status === 'accepted' ? t('messages.accepted') : t('messages.dismissed')}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (message.type === 'rule_proposal') {
      const meta = message.metadata || {};
      const ruleText = meta.text || message.text || '';
      const isPending = (meta.status || 'pending') === 'pending';
      return (
          <div className={cn("flex gap-4 px-10 py-5 group relative", isSelf ? "flex-row-reverse" : "flex-row")}>
              {/* Message Actions */}
              <div className={cn(
                  "absolute top-5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1",
                  isSelf ? "left-10" : "right-10"
              )}>
                  <button onClick={handleReply} className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.reply')}>
                      <ReplyIcon size={16} />
                  </button>
                  <button onClick={handleCopy} className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.copy')}>
                      <Copy size={16} />
                  </button>
                  <button onClick={handleTodoToggle} className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.pin_todo')}>
                      <Pin size={16} />
                  </button>
                  <button onClick={handleDelete} className="p-2 text-on-surface-variant/50 hover:text-red-500 hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.delete')}>
                      <Trash2 size={16} />
                  </button>
              </div>
              <div className="flex flex-col max-w-[85%] lg:max-w-[75%] items-start w-full">
                  <div className="w-full bg-surface-high border border-brand-border rounded-[28px] overflow-hidden shadow-lg relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                      <div className="p-5 border-b border-brand-border/50 bg-surface-low/50 flex items-center gap-3">
                          <Shield size={16} className="text-purple-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">{t('messages.directive_proposal')}</span>
                          <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest ml-auto" style={{ color }}>{t('messages.from', { sender: message.sender })}</span>
                      </div>
                      <div className="p-6 space-y-4">
                          <div className="text-sm font-medium text-on-surface italic pl-4 border-l-2 border-brand-border/50">
                              "{ruleText}"
                          </div>
                          {isPending ? (
                              <div className="flex flex-wrap gap-3 pt-2">
                                  <button onClick={handleDemote} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95">
                                      {t('messages.accept_via_system')}
                                  </button>
                                  <button onClick={handleRequestChanges} className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95">
                                      {t('messages.draft')}
                                  </button>
                                  <button onClick={handleDemote} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95">
                                      {t('messages.dismiss')}
                                  </button>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest bg-surface-low/50 px-3 py-2 rounded-xl inline-flex border border-brand-border/50">
                                  <Clock size={14} /> {meta.status}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className={cn(
        "flex gap-4 group transition-colors px-10 py-4 hover:bg-on-surface/[0.02] relative",
        isSelf ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Message Actions */}
      <div className={cn(
          "absolute top-5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1",
          isSelf ? "left-10" : "right-10"
      )}>
          <button onClick={handleReply} className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.reply')}>
              <ReplyIcon size={16} />
          </button>
          <button onClick={handleCopy} className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.copy')}>
              <Copy size={16} />
          </button>
          <button onClick={handleTodoToggle} className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.pin_todo')}>
              <Pin size={16} />
          </button>
          <button onClick={handleDelete} className="p-2 text-on-surface-variant/50 hover:text-red-500 hover:bg-on-surface/5 rounded-full transition-all" title={t('messages.delete')}>
              <Trash2 size={16} />
          </button>
      </div>

      {/* Content Area */}
      <div className={cn(
          "flex flex-col max-w-[85%] lg:max-w-[75%]",
          isSelf ? "items-end" : "items-start"
      )}>
        <div className="flex items-baseline gap-3 mb-1.5 px-1">
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-on-surface-variant/80 flex items-center gap-2" style={{ color: isSelf ? 'var(--color-primary-400)' : color }}>
            {message.sender}
            {agent?.role && <span className="ml-2 px-1.5 py-0.5 bg-on-surface/5 rounded text-[9px] text-on-surface-variant/50 border border-brand-border/50">{agent.role}</span>}
            {isThinking && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20 animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    <span className="text-[8px] font-black text-primary uppercase tracking-tighter">{t('messages.thinking')}</span>
                </span>
            )}
          </span>
          <span className="text-[10px] text-on-surface-variant/40 font-bold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{message.time || t('messages.now')}</span>
        </div>
        
        <div 
          className={cn(
            "relative p-3.5 px-5 text-[15px] leading-relaxed shadow-sm flex flex-col gap-2.5 transition-all duration-300",
            isSelf 
              ? "bg-primary-container text-on-primary-container rounded-[28px] rounded-tr-none border border-primary-500/20" 
              : "bg-surface-high text-on-surface rounded-[28px] rounded-tl-none border border-brand-border"
          )}
        >
          {/* Render Quoted Reply */}
          {parentMessage && (
              <div className="mb-1 p-3 rounded-2xl bg-surface-low/50 border-l-2 border-primary text-sm cursor-pointer hover:bg-surface-low/70 transition-all active:scale-[0.98]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-1">{parentMessage.sender}</span>
                  <span className="text-on-surface-variant/70 line-clamp-1">{parentMessage.text}</span>
              </div>
          )}

          {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                  {message.attachments.map((att, idx) => {
                      const isImage = att.url && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(att.url);
                      if (isImage) {
                          return (
                              <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="block w-48 h-32 rounded-2xl overflow-hidden border border-brand-border/50 hover:border-brand-border transition-all shadow-md active:scale-95">
                                  <img src={att.url} alt={att.name || 'Attachment'} className="w-full h-full object-cover" />
                              </a>
                          );
                      }
                      return (
                          <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-2xl bg-surface-low/50 border border-brand-border/50 hover:bg-surface-low/70 hover:border-brand-border transition-all max-w-[240px] active:scale-95">
                              <div className="w-10 h-10 shrink-0 bg-on-surface/5 rounded-lg flex items-center justify-center text-primary">
                                  <File size={18} />
                              </div>
                              <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate" title={att.name}>{att.name}</p>
                                  <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest mt-0.5">FILE</p>
                              </div>
                          </a>
                      );
                  })}
              </div>
          )}
          {message.text && <Markdown content={message.text} />}
          
          {/* Decision Actions */}
          {message.type === 'decision' && message.metadata?.choices && (
              <div className="mt-2 pt-2 border-t border-brand-border/50">
                  {message.metadata.resolved ? (
                      <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl inline-flex border border-primary/20">
                          {t('messages.selected', { choice: message.metadata.chosen })}
                      </div>
                  ) : (
                      <div className="flex flex-wrap gap-2">
                          {message.metadata.choices.map((choice: string, idx: number) => (
                              <button 
                                  key={idx} 
                                  onClick={() => handleResolveDecision(choice)}
                                  className="px-3 py-1.5 bg-on-surface/5 hover:bg-primary/10 text-on-surface hover:text-primary border border-brand-border/50 hover:border-primary/30 rounded-xl text-xs font-bold transition-all active:scale-95"
                              >
                                  {choice}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MessageList = () => {
  const { messages, currentChannel, status } = useStore();
  const { t } = useTranslation();
  const filteredMessages = messages.filter(m => m.channel === currentChannel);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const activeTyping = status?.typing?.filter(Boolean) || [];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-16 flex flex-col">
      {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-20 select-none m-auto animate-in fade-in zoom-in duration-700">
              <div className="w-20 h-20 rounded-[32px] bg-on-surface/[0.02] border border-brand-border flex items-center justify-center mb-6">
                  <Markdown content="✨" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-on-surface mb-2 uppercase tracking-[0.2em]">{t('messages.neural_void')}</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50">{t('messages.awaiting_init', { channel: currentChannel })}</p>
          </div>
      ) : (
          <div className="flex flex-col">
              {filteredMessages.map((msg) => (
                <Message key={msg.id} message={msg} />
              ))}
          </div>
      )}
      
      {/* Typing Indicator */}
      {activeTyping.length > 0 && (
          <div className="px-10 py-2 flex items-center gap-3 opacity-60 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  {t('messages.typing', { users: activeTyping.join(', ') })}
              </span>
          </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};
