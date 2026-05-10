import { useEffect, useRef, useState, Fragment } from 'react';
import { useStore } from '../store/useStore';
import type { Message as MessageType } from '../store/useStore';
import { Markdown } from './Markdown';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { File, ArrowRight, ArrowLeft, Reply as ReplyIcon, Trash2, Copy, Pin, MoreHorizontal } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const Message = ({ message }: { message: MessageType }) => {
  const { agents, settings, setReplyingTo, messages, status } = useStore();
  const { sendAction } = useWebSocket();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const touchTimer = useRef<any>(null);

  const lowerSender = message.sender.toLowerCase();
  const agent = agents[message.sender];
  const color = agent?.color || 'var(--color-primary-400)';
  const isSelf = lowerSender === settings.username?.toLowerCase();
  const isThinking = status?.[message.sender]?.busy;

  const handleReply = () => { setReplyingTo(message); setIsMenuOpen(false); };
  const handleDelete = () => { sendAction({ type: 'delete', ids: [message.id] }); setIsMenuOpen(false); };
  const handleCopy = async () => {
      try {
          await navigator.clipboard.writeText(message.text || '');
          setIsMenuOpen(false);
      } catch (err) {
          console.error('Failed to copy', err);
      }
  };

  const handleTodoToggle = () => {
      sendAction({ type: 'todo_toggle', id: message.id });
      setIsMenuOpen(false);
  };

  const handleTouchStart = () => {
      touchTimer.current = setTimeout(() => {
          setIsMenuOpen(true);
      }, 500); 
  };

  const handleTouchEnd = () => {
      if (touchTimer.current) clearTimeout(touchTimer.current);
  };

  const parentMessage = message.reply_to ? messages.find(m => m.id === message.reply_to) : null;

  // Special UI for system messages
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

  if (message.type === 'job_proposal') {
    const meta = message.metadata || {};
    const isPending = meta.status === 'pending';
    return (
        <div className="px-4 sm:px-10 py-4">
            <div className={cn(
                "max-w-2xl bg-surface-high border rounded-[32px] overflow-hidden transition-all shadow-lg",
                isPending ? "border-primary/30" : "border-brand-border/30 opacity-80"
            )}>
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">{t('messages.job_proposal')}</span>
                            <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter" style={{ color }}>{message.sender}</span>
                        </div>
                    </div>
                    <h4 className="text-lg font-bold text-on-surface mb-2">{meta.title}</h4>
                    <div className="text-sm text-on-surface-variant/80 leading-relaxed">
                        <Markdown content={meta.body || message.text} />
                    </div>
                    
                    {isPending ? (
                        <div className="mt-8 flex flex-wrap gap-2">
                            <button 
                                onClick={() => sendAction({ type: 'proposal_resolve', id: message.id, action: 'accept' })}
                                className="px-4 py-2 bg-primary text-brand-bg rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                            >
                                {t('messages.accept_via_system')}
                            </button>
                            <button 
                                onClick={() => {
                                    const feedback = window.prompt(t('messages.request_changes'));
                                    if (feedback) sendAction({ type: 'message', text: `@${message.sender} ${t('messages.request_changes')}: ${feedback}`, reply_to: message.id, channel: message.channel });
                                }}
                                className="px-4 py-2 bg-on-surface/5 text-on-surface rounded-xl text-xs font-black uppercase tracking-widest hover:bg-on-surface/10 transition-all border border-brand-border"
                            >
                                {t('messages.request_changes')}
                            </button>
                            <button 
                                onClick={() => sendAction({ type: 'proposal_resolve', id: message.id, action: 'dismiss' })}
                                className="px-4 py-2 text-on-surface-variant/50 hover:text-on-surface rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                {t('messages.dismiss')}
                            </button>
                        </div>
                    ) : (
                        <div className="mt-6 pt-6 border-t border-brand-border/30">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                                {meta.status === 'accepted' ? t('messages.accepted') : t('messages.dismissed')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  }

  if (message.type === 'session_draft') {
    const meta = message.metadata || {};
    const tmpl = meta.template || {};
    const isPending = meta.valid && !meta.resolved;
    return (
        <div className="px-4 sm:px-10 py-4">
            <div className={cn(
                "max-w-2xl bg-surface-high border rounded-[32px] overflow-hidden transition-all shadow-lg",
                isPending ? "border-primary/30" : "border-brand-border/30 opacity-80"
            )}>
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">{t('messages.session_proposal')}</span>
                            <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter" style={{ color }}>{message.sender}</span>
                        </div>
                    </div>
                    <h4 className="text-lg font-bold text-on-surface mb-2">{tmpl.name}</h4>
                    <p className="text-xs text-on-surface-variant/50 mb-6">{tmpl.description}</p>
                    
                    <div className="space-y-4">
                        {tmpl.phases?.map((p: any, i: number) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-on-surface/5 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 border border-brand-border/50">{i + 1}</div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-on-surface">{p.name}</span>
                                        <div className="flex gap-1">
                                            {p.participants?.map((role: string) => (
                                                <span key={role} className="px-1.5 py-0.5 bg-primary/5 rounded text-[8px] font-black text-primary/60 border border-primary/10 uppercase tracking-tighter">{role}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-on-surface-variant/40 italic line-clamp-2">{p.prompt}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!meta.valid && (
                         <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                            <p className="text-xs font-bold text-red-500 mb-2 uppercase tracking-widest">{t('messages.invalid_draft')}</p>
                            <ul className="text-[11px] text-red-400 space-y-1">
                                {meta.errors?.map((e: string, i: number) => <li key={i}>• {e}</li>)}
                            </ul>
                        </div>
                    )}

                    {isPending ? (
                        <div className="mt-8 flex flex-wrap gap-2">
                            <button 
                                onClick={() => sendAction({ type: 'session_proposal_resolve', id: message.id, action: 'run' })}
                                className="px-4 py-2 bg-primary text-brand-bg rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                            >
                                {t('messages.run_session')}
                            </button>
                            <button 
                                onClick={() => {
                                    const feedback = window.prompt(t('messages.request_changes'));
                                    if (feedback) sendAction({ type: 'message', text: `@${message.sender} Please revise session draft: ${feedback}\n\nCurrent draft:\n\`\`\`session\n${JSON.stringify(tmpl)}\n\`\`\``, channel: message.channel });
                                }}
                                className="px-4 py-2 bg-on-surface/5 text-on-surface rounded-xl text-xs font-black uppercase tracking-widest hover:bg-on-surface/10 transition-all border border-brand-border"
                            >
                                {t('messages.request_changes')}
                            </button>
                            <button 
                                onClick={() => {
                                    fetch(`/api/messages/${message.id}/demote`, { 
                                        method: 'POST', 
                                        headers: { 'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' } 
                                    });
                                }}
                                className="px-4 py-2 text-on-surface-variant/50 hover:text-on-surface rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                {t('messages.dismiss')}
                            </button>
                        </div>
                    ) : meta.resolved && (
                        <div className="mt-6 pt-6 border-t border-brand-border/30">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                                {t('messages.accepted')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  }

  if (message.type === 'rule_proposal') {
    const meta = message.metadata || {};
    const isPending = meta.status === 'pending';
    return (
        <div className="px-4 sm:px-10 py-4">
            <div className={cn(
                "max-w-2xl bg-surface-high border rounded-[32px] overflow-hidden transition-all shadow-lg",
                isPending ? "border-primary/30" : "border-brand-border/30 opacity-80"
            )}>
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">{t('messages.directive_proposal')}</span>
                            <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter" style={{ color }}>{message.sender}</span>
                        </div>
                    </div>
                    <div className="text-[15px] text-on-surface leading-relaxed italic border-l-2 border-primary/30 pl-4 py-1">
                        {meta.text || message.text}
                    </div>
                    
                    {isPending ? (
                        <div className="mt-8 flex flex-wrap gap-2">
                            <button 
                                onClick={() => sendAction({ type: 'rule_proposal_resolve', id: message.id, action: 'activate' })}
                                className="px-4 py-2 bg-primary text-brand-bg rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                            >
                                {t('rules.activate')}
                            </button>
                            <button 
                                onClick={() => sendAction({ type: 'rule_proposal_resolve', id: message.id, action: 'draft' })}
                                className="px-4 py-2 bg-on-surface/5 text-on-surface rounded-xl text-xs font-black uppercase tracking-widest hover:bg-on-surface/10 transition-all border border-brand-border"
                            >
                                {t('messages.draft')}
                            </button>
                            <button 
                                onClick={() => sendAction({ type: 'rule_proposal_resolve', id: message.id, action: 'dismiss' })}
                                className="px-4 py-2 text-on-surface-variant/50 hover:text-on-surface rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                {t('messages.dismiss')}
                            </button>
                        </div>
                    ) : (
                        <div className="mt-6 pt-6 border-t border-brand-border/30">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                                {meta.status === 'activated' ? t('messages.accepted') : t('messages.dismissed')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div 
        className={cn(
            "flex gap-3 xs:gap-4 group transition-colors px-4 sm:px-10 py-3 sm:py-4 hover:bg-on-surface/[0.02] relative",
            isSelf ? "flex-row-reverse" : "flex-row"
        )}
        onContextMenu={(e) => { e.preventDefault(); setIsMenuOpen(true); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
    >
      {/* Desktop Message Actions (Hover) */}
      <div className={cn(
          "absolute top-5 hidden lg:flex opacity-0 group-hover:opacity-100 transition-all duration-300 items-center gap-1",
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
          "flex flex-col max-w-[88%] sm:max-w-[85%] lg:max-w-[75%]",
          isSelf ? "items-end" : "items-start"
      )}>
        <div className="flex items-baseline gap-3 mb-1.5 px-1">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-on-surface-variant/80 flex items-center gap-2" style={{ color: isSelf ? 'var(--color-primary-400)' : color }}>
            {message.sender}
            {agent?.role && <span className="hidden xs:inline ml-2 px-1.5 py-0.5 bg-on-surface/5 rounded text-[9px] text-on-surface-variant/50 border border-brand-border/50">{agent.role}</span>}
            {isThinking && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20 animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    <span className="text-[8px] font-black text-primary uppercase tracking-tighter">{t('messages.thinking')}</span>
                </span>
            )}
          </span>
          <span className="text-[9px] sm:text-[10px] text-on-surface-variant/40 font-bold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{message.time || t('messages.now')}</span>
        </div>
        
        <div 
          className={cn(
            "relative p-3 sm:p-3.5 px-4 sm:px-5 text-[14px] sm:text-[15px] leading-relaxed shadow-sm flex flex-col gap-2 transition-all duration-300",
            isSelf 
              ? "bg-primary-container text-on-primary-container rounded-[24px] sm:rounded-[28px] rounded-tr-none border border-primary-500/20" 
              : "bg-surface-high text-on-surface rounded-[24px] sm:rounded-[28px] rounded-tl-none border border-brand-border"
          )}
        >
          {parentMessage && (
              <div className="mb-1 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-surface-low/50 border-l-2 border-primary text-xs sm:text-sm cursor-pointer hover:bg-surface-low/70 transition-all active:scale-[0.98]">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary block mb-1">{parentMessage.sender}</span>
                  <span className="text-on-surface-variant/70 line-clamp-1">{parentMessage.text}</span>
              </div>
          )}

          {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                  {message.attachments.map((att, idx) => {
                      const isImage = att.url && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(att.url);
                      if (isImage) {
                          return (
                              <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="block w-40 sm:w-48 h-24 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden border border-brand-border/50 hover:border-brand-border transition-all shadow-md active:scale-95">
                                  <img src={att.url} alt={att.name || 'Attachment'} className="w-full h-full object-cover" />
                              </a>
                          );
                      }
                      return (
                          <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-surface-low/50 border border-brand-border/50 hover:bg-surface-low/70 hover:border-brand-border transition-all max-w-[200px] sm:max-w-[240px] active:scale-95">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-on-surface/5 rounded-lg flex items-center justify-center text-primary">
                                  <File size={16} />
                              </div>
                              <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold truncate" title={att.name}>{att.name}</p>
                                  <p className="text-[8px] sm:text-[10px] text-on-surface-variant/50 uppercase tracking-widest mt-0.5">FILE</p>
                              </div>
                          </a>
                      );
                  })}
              </div>
          )}
          {message.text && <Markdown content={message.text} />}
        </div>
      </div>

      {/* Mobile Context Menu (Modal) */}
      <Transition.Root show={isMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[200]" onClose={setIsMenuOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-brand-panel text-left shadow-2xl transition-all w-full sm:max-w-xs border border-brand-border">
                  <div className="px-6 py-8 space-y-2">
                    <div className="mb-6 flex items-center gap-3 border-b border-brand-border/30 pb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <MoreHorizontal size={18} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">{t('messages.actions') || 'Neural Link Actions'}</p>
                    </div>

                    <button onClick={handleReply} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-primary/10 text-on-surface transition-all active:bg-primary/20">
                        <ReplyIcon size={20} className="text-primary" />
                        <span className="font-bold text-sm">{t('messages.reply')}</span>
                    </button>
                    <button onClick={handleCopy} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-primary/10 text-on-surface transition-all active:bg-primary/20">
                        <Copy size={20} className="text-primary" />
                        <span className="font-bold text-sm">{t('messages.copy')}</span>
                    </button>
                    <button onClick={handleTodoToggle} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-primary/10 text-on-surface transition-all active:bg-primary/20">
                        <Pin size={20} className="text-primary" />
                        <span className="font-bold text-sm">{t('messages.pin_todo')}</span>
                    </button>
                    <button onClick={handleDelete} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-red-500/10 text-red-500 transition-all active:bg-red-500/20">
                        <Trash2 size={20} />
                        <span className="font-bold text-sm">{t('messages.delete')}</span>
                    </button>
                  </div>
                  <div className="p-4 bg-brand-bg/50 border-t border-brand-border/30">
                    <button onClick={() => setIsMenuOpen(false)} className="w-full py-3 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
                        {t('common.cancel')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export const MessageList = () => {
  const { messages, currentChannel, status } = useStore();
  const { t } = useTranslation();
  const filteredMessages = messages.filter(m => m.channel === currentChannel);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(filteredMessages.length);
  const isNearBottomRef = useRef(true);

  // Track whether the user is near the bottom of the scroll area
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 150;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  // Only auto-scroll when a NEW message is added and user is near bottom
  useEffect(() => {
    if (filteredMessages.length > prevCountRef.current && isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCountRef.current = filteredMessages.length;
  }, [filteredMessages.length]);

  const activeTyping = status?.typing?.filter(Boolean) || [];

  return (
    <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar pt-4 sm:pt-6 pb-20 flex flex-col">
      {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-20 select-none m-auto animate-in fade-in zoom-in duration-700">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] sm:rounded-[32px] bg-on-surface/[0.02] border border-brand-border flex items-center justify-center mb-6">
                  <Markdown content="✨" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface mb-2 uppercase tracking-[0.2em]">{t('messages.neural_void')}</h3>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant/50">{t('messages.awaiting_init', { channel: currentChannel })}</p>
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
          <div className="px-6 sm:px-10 py-2 flex items-center gap-3 opacity-60 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex gap-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-bounce" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  {t('messages.typing', { users: activeTyping.join(', ') })}
              </span>
          </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};
