import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Message as MessageType } from '../store/useStore';
import { Markdown } from './Markdown';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { File, ArrowRight, ArrowLeft, Briefcase, Shield, CheckCircle, Clock, Reply as ReplyIcon, Trash2, Copy, Pin, Play, Zap, AlertCircle } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const Message = ({ message }: { message: MessageType }) => {
  const { agents, settings, setReplyingTo, messages, status } = useStore();
  const { sendAction } = useWebSocket();
  const lowerSender = message.sender.toLowerCase();
  const agent = agents[lowerSender];
  const color = agent?.color || 'var(--color-primary-400)';
  const isSelf = lowerSender === settings.username?.toLowerCase();
  
  // High-fidelity thinking state detection
  const isThinking = status?.busy?.includes(lowerSender);

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
              <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5">
                  {message.type === 'join' ? <ArrowRight size={12} className="text-primary-500" /> : <ArrowLeft size={12} className="text-red-500" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                      <span style={{ color }}>{message.sender}</span> {message.type === 'join' ? 'connected' : 'disconnected'}
                  </span>
              </div>
          </div>
      );
  }

  if (message.type === 'summary') {
      return (
          <div className="px-10 py-6">
              <div className="max-w-2xl mx-auto bg-surface-high border border-brand-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary-500" />
                  <div className="flex items-center gap-3 mb-4">
                      <div className="px-2 py-1 bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary-500/20">Summary</div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest" style={{ color }}>{message.sender}</span>
                  </div>
                  <div className="text-sm leading-relaxed text-gray-300">
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
                  isStart ? "bg-primary-500/10 border-primary-500/30 text-primary-400" : 
                  isEnd ? "bg-white/5 border-white/10 text-gray-400" :
                  "bg-white/[0.02] border-white/5 text-gray-300"
              )}>
                  <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isStart ? "bg-primary-500 text-brand-bg" : "bg-white/10 text-white"
                  )}>
                      {isStart ? <Play size={16} fill="currentColor" /> : isEnd ? <Zap size={16} /> : <ArrowRight size={16} />}
                  </div>
                  <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">
                          {isStart ? 'Orchestration Initiated' : isEnd ? 'Sequence Terminated' : 'Phase Transition'}
                      </p>
                      <p className="text-sm font-bold text-white truncate">{message.text}</p>
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
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Session Proposal</span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-auto" style={{ color }}>Proposed by {message.sender}</span>
                      </div>
                      <div className="p-6 space-y-6">
                          <div>
                              <h4 className="text-lg font-bold text-white leading-tight mb-2">{tmpl.name}</h4>
                              <p className="text-xs text-gray-400 leading-relaxed">{tmpl.description}</p>
                          </div>
                          
                          {!meta.valid && (
                              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex gap-3">
                                  <AlertCircle size={16} className="shrink-0" />
                                  <div>
                                      <p className="font-black uppercase tracking-widest mb-2">Invalid Draft</p>
                                      <ul className="list-disc pl-4 space-y-1">
                                          {meta.errors?.map((e: string, i: number) => <li key={i}>{e}</li>)}
                                      </ul>
                                  </div>
                              </div>
                          )}

                          <div className="space-y-3">
                              {phases.map((p: any, i: number) => (
                                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0">{i+1}</div>
                                      <div className="min-w-0">
                                          <p className="text-xs font-bold text-white mb-1">{p.name}</p>
                                          <div className="flex flex-wrap gap-1.5 mb-2">
                                              {p.participants?.map((role: string) => (
                                                  <span key={role} className="px-1.5 py-0.5 rounded bg-black/40 text-[9px] font-bold text-gray-500 uppercase tracking-tighter border border-white/5">{role}</span>
                                              ))}
                                          </div>
                                          <p className="text-[11px] text-gray-500 italic line-clamp-2">{p.prompt}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <div className="flex flex-wrap gap-3">
                              {meta.valid && (
                                  <button onClick={handleRunDraft} className="px-5 py-2.5 bg-primary-500 text-brand-bg rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-400 transition-all flex items-center gap-2">
                                      <Play size={14} fill="currentColor" /> Run Session
                                  </button>
                              )}
                              <button onClick={handleRequestChanges} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                  Request Changes
                              </button>
                              <button onClick={handleDemote} className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                  Dismiss
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
                  "absolute top-5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
                  isSelf ? "left-10" : "right-10"
              )}>
                  <button onClick={handleReply} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-white/5 rounded-full transition-all" title="Reply">
                      <ReplyIcon size={16} />
                  </button>
                  <button onClick={handleCopy} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-white/5 rounded-full transition-all" title="Copy">
                      <Copy size={16} />
                  </button>
                  <button onClick={handleTodoToggle} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-white/5 rounded-full transition-all" title="Pin / Todo">
                      <Pin size={16} />
                  </button>
                  <button onClick={handleDelete} className="p-2 text-gray-500 hover:text-red-500 hover:bg-white/5 rounded-full transition-all" title="Delete">
                      <Trash2 size={16} />
                  </button>
              </div>
              <div className="flex flex-col max-w-[85%] lg:max-w-[75%] items-start w-full">
                  <div className="w-full bg-surface-high border border-brand-border rounded-[28px] overflow-hidden shadow-lg">
                      <div className="p-5 border-b border-white/5 bg-black/10 flex items-center gap-3">
                          <Briefcase size={16} className="text-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Job Proposal</span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-auto" style={{ color }}>From: {message.sender}</span>
                      </div>
                      <div className="p-6 space-y-4">
                          <h4 className="text-lg font-bold text-white leading-tight">{meta.title}</h4>
                          {meta.body && (
                              <div className="text-sm text-gray-400 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                  <Markdown content={meta.body} />
                              </div>
                          )}
                          {isPending ? (
                              <div className="flex flex-wrap gap-3 pt-2">
                                  <button onClick={handleDemote} className="px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 border border-primary-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                                      <CheckCircle size={14} /> Accept via System
                                  </button>
                                  <button onClick={handleRequestChanges} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                      Request Changes
                                  </button>
                                  <button onClick={handleDemote} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                      Dismiss
                                  </button>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest bg-black/20 px-3 py-2 rounded-xl inline-flex border border-white/5">
                                  <Clock size={14} /> {meta.status === 'accepted' ? 'Accepted' : 'Dismissed'}
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
                  "absolute top-5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
                  isSelf ? "left-10" : "right-10"
              )}>
                  <button onClick={handleReply} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-white/5 rounded-full transition-all" title="Reply">
                      <ReplyIcon size={16} />
                  </button>
                  <button onClick={handleCopy} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-white/5 rounded-full transition-all" title="Copy">
                      <Copy size={16} />
                  </button>
                  <button onClick={handleTodoToggle} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-white/5 rounded-full transition-all" title="Pin / Todo">
                      <Pin size={16} />
                  </button>
                  <button onClick={handleDelete} className="p-2 text-gray-500 hover:text-red-500 hover:bg-white/5 rounded-full transition-all" title="Delete">
                      <Trash2 size={16} />
                  </button>
              </div>
              <div className="flex flex-col max-w-[85%] lg:max-w-[75%] items-start w-full">
                  <div className="w-full bg-surface-high border border-brand-border rounded-[28px] overflow-hidden shadow-lg relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                      <div className="p-5 border-b border-white/5 bg-black/10 flex items-center gap-3">
                          <Shield size={16} className="text-purple-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Directive Proposal</span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-auto" style={{ color }}>From: {message.sender}</span>
                      </div>
                      <div className="p-6 space-y-4">
                          <div className="text-sm font-medium text-white italic pl-4 border-l-2 border-white/10">
                              "{ruleText}"
                          </div>
                          {isPending ? (
                              <div className="flex flex-wrap gap-3 pt-2">
                                  <button onClick={handleDemote} className="px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 border border-primary-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                      Accept via System
                                  </button>
                                  <button onClick={handleRequestChanges} className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                      Draft
                                  </button>
                                  <button onClick={handleDemote} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                      Dismiss
                                  </button>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest bg-black/20 px-3 py-2 rounded-xl inline-flex border border-white/5">
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
        "flex gap-4 group transition-colors px-10 py-4 hover:bg-white/[0.02] relative",
        isSelf ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Message Actions */}
      <div className={cn(
          "absolute top-5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
          isSelf ? "left-10" : "right-10"
      )}>
          <button onClick={handleReply} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-white/5 rounded-full transition-all" title="Reply">
              <ReplyIcon size={16} />
          </button>
          <button onClick={handleCopy} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-white/5 rounded-full transition-all" title="Copy">
              <Copy size={16} />
          </button>
          <button onClick={handleTodoToggle} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-white/5 rounded-full transition-all" title="Pin / Todo">
              <Pin size={16} />
          </button>
          <button onClick={handleDelete} className="p-2 text-gray-500 hover:text-red-500 hover:bg-white/5 rounded-full transition-all" title="Delete">
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
            {agent?.role && <span className="ml-2 px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-gray-500 border border-white/5">{agent.role}</span>}
            {isThinking && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-primary-500/10 rounded-full border border-primary-500/20 animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-primary-500" />
                    <span className="text-[8px] font-black text-primary-400 uppercase tracking-tighter">Thinking...</span>
                </span>
            )}
          </span>
          <span className="text-[10px] text-gray-600 font-bold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{message.time || 'NOW'}</span>
        </div>
        
        <div 
          className={cn(
            "relative p-3.5 px-5 text-[15px] leading-relaxed shadow-sm flex flex-col gap-2.5",
            isSelf 
              ? "bg-primary-container text-on-primary-container rounded-[28px] rounded-tr-none border border-primary-500/20" 
              : "bg-surface-high text-on-surface rounded-[28px] rounded-tl-none border border-brand-border"
          )}
        >
          {/* Render Quoted Reply */}
          {parentMessage && (
              <div className="mb-1 p-3 rounded-2xl bg-black/20 border-l-2 border-primary-500 text-sm cursor-pointer hover:bg-black/30 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 block mb-1">{parentMessage.sender}</span>
                  <span className="text-gray-400 line-clamp-1">{parentMessage.text}</span>
              </div>
          )}

          {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                  {message.attachments.map((att, idx) => {
                      const isImage = att.url && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(att.url);
                      if (isImage) {
                          return (
                              <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="block w-48 h-32 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all shadow-md">
                                  <img src={att.url} alt={att.name || 'Attachment'} className="w-full h-full object-cover" />
                              </a>
                          );
                      }
                      return (
                          <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-black/30 hover:border-white/10 transition-all max-w-[240px]">
                              <div className="w-10 h-10 shrink-0 bg-white/5 rounded-lg flex items-center justify-center text-primary-400">
                                  <File size={18} />
                              </div>
                              <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate" title={att.name}>{att.name}</p>
                                  <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">FILE</p>
                              </div>
                          </a>
                      );
                  })}
              </div>
          )}
          {message.text && <Markdown content={message.text} />}
          
          {/* Decision Actions */}
          {message.type === 'decision' && message.metadata?.choices && (
              <div className="mt-2 pt-2 border-t border-white/10">
                  {message.metadata.resolved ? (
                      <div className="text-xs font-bold text-primary-400 bg-primary-500/10 px-3 py-2 rounded-xl inline-flex border border-primary-500/20">
                          Selected: {message.metadata.chosen}
                      </div>
                  ) : (
                      <div className="flex flex-wrap gap-2">
                          {message.metadata.choices.map((choice: string, idx: number) => (
                              <button 
                                  key={idx} 
                                  onClick={() => handleResolveDecision(choice)}
                                  className="px-3 py-1.5 bg-white/5 hover:bg-primary-500/20 text-white hover:text-primary-400 border border-white/10 hover:border-primary-500/30 rounded-xl text-xs font-bold transition-all"
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
  const filteredMessages = messages.filter(m => m.channel === currentChannel);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const activeTyping = status?.typing?.filter(Boolean) || [];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-16 flex flex-col">
      {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-20 select-none m-auto">
              <div className="w-20 h-20 rounded-[32px] bg-white/[0.02] border border-brand-border flex items-center justify-center mb-6">
                  <Markdown content="✨" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white mb-2 uppercase tracking-[0.2em]">Neural Void</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Awaiting data initialization on #{currentChannel}</p>
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
          <div className="px-10 py-2 flex items-center gap-3 opacity-60 animate-in fade-in duration-300">
              <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">
                  {activeTyping.join(', ')} typing...
              </span>
          </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};
