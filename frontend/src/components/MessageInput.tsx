import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Command, User, Terminal, X, File, Image as ImageIcon, Reply } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface Attachment {
    path: string;
    name: string;
    url: string;
    type?: string;
}

export const MessageInput = ({ onSendMessage }: { onSendMessage: (text: string, attachments?: Attachment[], replyTo?: number) => void }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeMentions, setActiveMentions] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentChannel, agents, replyingTo, setReplyingTo } = useStore();
  const { t } = useTranslation();
  
  // Autocomplete State
  const [suggestionType, setSuggestionType] = useState<'agent' | 'command' | null>(null);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);

  const availableCommands = [
    { name: '/help', desc: t('input.commands.help') },
    { name: '/clear', desc: t('input.commands.clear') },
    { name: '/restart', desc: t('input.commands.restart') },
    { name: '/stop', desc: t('input.commands.stop') },
    { name: '/kick', desc: t('input.commands.kick') },
  ];

  const agentSuggestions = Object.keys(agents)
    .filter(a => a.toLowerCase().includes(suggestionQuery.toLowerCase()))
    .map(a => ({ name: `@${a}`, desc: agents[a].label || 'Agent', color: agents[a].color }));

  const commandSuggestions = availableCommands
    .filter(c => c.name.toLowerCase().includes(suggestionQuery.toLowerCase()));

  const currentSuggestions = suggestionType === 'agent' ? agentSuggestions : commandSuggestions;

  useEffect(() => {
    setSuggestionIndex(0);
  }, [suggestionQuery, suggestionType]);

  const insertSuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    
    // Find where the trigger started
    const beforeCursor = text.slice(0, cursorPos);
    const triggerIndex = beforeCursor.lastIndexOf(suggestionType === 'agent' ? '@' : '/');
    
    if (triggerIndex !== -1) {
      const newText = text.slice(0, triggerIndex) + suggestion + ' ' + text.slice(cursorPos);
      setText(newText);
      
      // Reset state and refocus after React cycle
      setSuggestionType(null);
      setTimeout(() => {
        textareaRef.current?.focus();
        const newCursorPos = triggerIndex + suggestion.length + 1;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const toggleMention = (agentName: string) => {
      setActiveMentions(prev => {
          const next = new Set(prev);
          if (next.has(agentName)) next.delete(agentName);
          else next.add(agentName);
          return next;
      });
  };

  const uploadFile = async (file: File) => {
      setIsUploading(true);
      try {
          const formData = new FormData();
          formData.append('file', file);
          const token = (window as any).__SESSION_TOKEN__ || '';
          
          const response = await fetch('/api/upload', {
              method: 'POST',
              headers: {
                  'X-Session-Token': token
              },
              body: formData
          });

          if (!response.ok) throw new Error('Upload failed');
          const data = await response.json();
          
          setAttachments(prev => [...prev, {
              path: data.path,
              name: data.name,
              url: data.url,
              type: file.type
          }]);
      } catch (error) {
          console.error('Error uploading file:', error);
      } finally {
          setIsUploading(false);
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          Array.from(e.target.files).forEach(uploadFile);
      }
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.types.includes('Files')) {
          setIsDragging(true);
      }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          Array.from(e.dataTransfer.files).forEach(uploadFile);
      }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
          Array.from(e.clipboardData.files).forEach(uploadFile);
      }
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestionType && currentSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex((prev) => (prev + 1) % currentSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex((prev) => (prev - 1 + currentSuggestions.length) % currentSuggestions.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertSuggestion(currentSuggestions[suggestionIndex].name);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestionType(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !suggestionType) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;

    // Check for autocomplete triggers
    const pos = e.target.selectionStart;
    setCursorPos(pos);
    const textBeforeCursor = newText.slice(0, pos);
    
    // Match the last word being typed
    const match = textBeforeCursor.match(/(?:^|\s)([@/])([^\s]*)$/);
    if (match) {
      setSuggestionType(match[1] === '@' ? 'agent' : 'command');
      setSuggestionQuery(match[1] + match[2]);
      setSuggestionQuery(match[2]);
    } else {
      setSuggestionType(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
      setCursorPos(e.currentTarget.selectionStart);
      setSuggestionType(null); // Simple dismiss on click for now
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    let finalText = text;
    if (activeMentions.size > 0) {
        const lowerText = text.toLowerCase();
        const missing = Array.from(activeMentions).filter(name => !lowerText.includes(`@${name.toLowerCase()}`));
        if (missing.length > 0) {
            finalText = missing.map(n => `@${n}`).join(' ') + ' ' + text;
        }
    }

    if (finalText.trim() || attachments.length > 0) {
      onSendMessage(finalText, attachments, replyingTo?.id);
      setText('');
      setAttachments([]);
      setSuggestionType(null);
      setReplyingTo(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="relative group max-w-5xl mx-auto w-full">
      {/* Agent Mention Pills */}
      {Object.keys(agents).length > 0 && (
          <div className="flex overflow-x-auto lg:flex-wrap gap-2 mb-3 px-1 no-scrollbar pb-1">
              {Object.entries(agents).map(([name, info]) => {
                  const isActive = activeMentions.has(name);
                  return (
                      <button
                          key={name}
                          type="button"
                          onClick={() => toggleMention(name)}
                          className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border flex items-center gap-1.5 whitespace-nowrap",
                              isActive 
                                  ? "bg-primary/20 text-primary border-primary/30" 
                                  : "bg-surface-high text-on-surface-variant/50 hover:text-on-surface border-brand-border hover:bg-on-surface/5"
                          )}
                      >
                          <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ backgroundColor: info.color, boxShadow: isActive ? `0 0 8px ${info.color}` : 'none' }} />
                          @{info.label || name}
                      </button>
                  );
              })}
          </div>
      )}

      {/* Autocomplete Popover */}
      {suggestionType && currentSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-4 w-[calc(100vw-2rem)] lg:w-80 bg-brand-panel border border-brand-border rounded-[24px] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 ring-1 ring-white/5">
              <div className="px-4 py-3 border-b border-brand-border/30 bg-surface-low/30">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                      {suggestionType === 'agent' ? t('input.select_agent') : t('input.system_commands')}
                  </p>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                  {currentSuggestions.map((item, idx) => (
                      <button
                          key={item.name}
                          type="button"
                          onClick={() => insertSuggestion(item.name)}
                          onMouseEnter={() => setSuggestionIndex(idx)}
                          className={cn(
                              "w-full text-left px-4 py-3 flex items-center gap-3 rounded-[16px] transition-all",
                              suggestionIndex === idx ? "bg-primary/10 border border-primary/20" : "hover:bg-on-surface/[0.03] border border-transparent"
                          )}
                      >
                          {suggestionType === 'agent' ? (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-low/50 shrink-0" style={{ color: (item as any).color }}>
                                  <User size={16} />
                              </div>
                          ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0">
                                  <Terminal size={16} />
                              </div>
                          )}
                          <div className="min-w-0">
                              <p className={cn(
                                  "text-[13px] font-bold tracking-tight truncate transition-colors",
                                  suggestionIndex === idx ? "text-primary" : "text-on-surface"
                              )}>
                                  {item.name}
                              </p>
                              <p className="text-[11px] text-on-surface-variant/50 truncate mt-0.5">{item.desc}</p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* Replying To Banner */}
      {replyingTo && (
          <div className="absolute bottom-full left-0 right-0 mb-4 bg-surface-high border border-brand-border rounded-[20px] shadow-lg p-3 px-5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
              <Reply size={16} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{t('common.replying_to', { sender: replyingTo.sender })}</p>
                  <p className="text-sm text-on-surface truncate">{replyingTo.text}</p>
              </div>
              <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-on-surface/10 rounded-full transition-all"
              >
                  <X size={16} />
              </button>
          </div>
      )}

      {/* M3 Elevation Shadow & Glow */}
      <div className="absolute -inset-1 bg-primary/10 rounded-[32px] blur-2xl opacity-0 group-focus-within:opacity-100 transition duration-700 pointer-events-none" />
      
      <div 
        className={cn(
            "relative flex flex-col bg-surface-high border rounded-[24px] lg:rounded-[28px] overflow-hidden shadow-2xl transition-all",
            isDragging ? "border-primary bg-primary/5 ring-4 ring-primary/20" : "border-brand-border group-focus-within:border-primary/50 group-focus-within:bg-brand-panel"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            onChange={handleFileSelect} 
        />

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 lg:px-5 py-2 border-b border-brand-border/30 bg-surface-low/30">
            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-on-surface/5 rounded-xl transition-all" 
                title={t('common.attach_file')}
            >
                <Paperclip size={16} />
            </button>
            
            <div className="ml-auto flex items-center gap-3">
                <span className="text-[9px] text-on-surface-variant/40 font-black uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-60">
                    <Command size={10} /> <span className="hidden sm:inline">{t('common.newline_hint')}</span>
                </span>
            </div>
        </div>

        {/* Attachments Preview Area */}
        {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 lg:gap-3 p-3 lg:p-4 pb-0 border-b border-brand-border/30">
                {attachments.map((att, idx) => (
                    <div key={idx} className="relative group/att bg-brand-bg rounded-xl border border-brand-border p-2 pr-10 min-w-[100px] lg:min-w-[120px] max-w-[160px] lg:max-w-[200px] flex items-center gap-2 lg:gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 bg-on-surface/5 rounded-lg flex items-center justify-center overflow-hidden">
                            {att.type?.startsWith('image/') ? (
                                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                            ) : (
                                <File size={16} className="text-primary" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] lg:text-xs font-semibold text-on-surface truncate" title={att.name}>{att.name}</p>
                            <p className="text-[8px] lg:text-[10px] text-on-surface-variant uppercase font-bold tracking-widest truncate">{att.type?.split('/')[1] || 'FILE'}</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => removeAttachment(idx)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-on-surface/10 hover:bg-red-500 text-on-surface-variant hover:text-white rounded-full lg:opacity-0 lg:group-hover/att:opacity-100 transition-all"
                        >
                            <X size={10} />
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Input Row */}
        <form onSubmit={handleSubmit} className="flex gap-3 lg:gap-4 items-end p-3 lg:p-5 relative">
          {isDragging && (
              <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="bg-primary text-brand-bg px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
                      <ImageIcon size={16} /> {t('input.drop_to_upload')}
                  </div>
              </div>
          )}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onClick={handleClick}
              onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart)}
              onPaste={handlePaste}
              placeholder={t('input.placeholder', { channel: currentChannel })}
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[16px] text-on-surface placeholder-on-surface-variant/40 resize-none max-h-60 custom-scrollbar leading-relaxed"
            />
          </div>
          <button
            type="submit"
            disabled={(!text.trim() && attachments.length === 0) || isUploading}
            className="shrink-0 w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-primary hover:opacity-90 disabled:opacity-20 disabled:grayscale disabled:hover:bg-primary text-brand-bg rounded-2xl transition-all shadow-lg shadow-primary/30 active:scale-90"
          >
            <Send size={18} className="lg:w-5 lg:h-5" strokeWidth={3} />
          </button>
        </form>
      </div>
    </div>
  );
};
