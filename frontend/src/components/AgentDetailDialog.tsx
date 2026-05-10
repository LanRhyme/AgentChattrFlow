import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import { X, Pin, PinOff, Edit3, Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface AgentDetailDialogProps {
  agentId: string;
  mode: 'modal' | 'floating';
  onClose: () => void;
}

export const AgentDetailDialog: React.FC<AgentDetailDialogProps> = ({ agentId, mode, onClose }) => {
  const { agents, status, togglePinAgent, updateAgentPosition, agentPositions } = useStore();
  const { sendAction } = useWebSocket();
  const { t } = useTranslation();
  
  const info = agents[agentId];
  const agentStatus = status[agentId] || {};
  const thoughts = agentStatus.thoughts || '';
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(info?.label || agentId);
  const thoughtsEndRef = useRef<HTMLDivElement>(null);

  const position = agentPositions[agentId] || { x: 100, y: 100 };
  const draggingRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  useEffect(() => {
    if (thoughtsEndRef.current) {
      thoughtsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thoughts]);

  if (!info) return null;

  const handleRename = () => {
    if (newName.trim() && newName !== info.label) {
      sendAction({ type: 'rename_agent', name: agentId, label: newName.trim() });
    }
    setIsRenaming(false);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'floating') return;
    draggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - draggingRef.current.startX;
    const dy = e.clientY - draggingRef.current.startY;
    updateAgentPosition(agentId, draggingRef.current.startPosX + dx, draggingRef.current.startPosY + dy);
  };

  const onMouseUp = () => {
    draggingRef.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  const content = (
    <div 
      className={cn(
        "bg-brand-panel border border-brand-border shadow-2xl flex flex-col overflow-hidden transition-all",
        mode === 'modal' ? "w-full max-w-2xl h-[600px] rounded-[32px]" : "fixed w-[400px] h-[500px] rounded-2xl z-50"
      )}
      style={mode === 'floating' ? { left: position.x, top: position.y } : {}}
    >
      {/* Header */}
      <div 
        className={cn(
          "px-6 py-4 border-b border-brand-border flex items-center justify-between shrink-0",
          mode === 'floating' ? "cursor-move" : ""
        )}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }} />
          {isRenaming ? (
            <input
              autoFocus
              className="bg-surface-low border border-primary/30 rounded px-2 py-0.5 text-sm text-on-surface outline-none"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          ) : (
            <h3 className="font-black text-on-surface uppercase tracking-tight flex items-center gap-2">
              {info.label || agentId}
              <button onClick={() => setIsRenaming(true)} className="p-1 hover:bg-on-surface/5 rounded text-on-surface-variant/40 hover:text-primary transition-all">
                <Edit3 size={12} />
              </button>
            </h3>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              togglePinAgent(agentId);
              if (mode === 'modal') onClose();
            }}
            className={cn(
              "p-2 rounded-xl transition-all",
              mode === 'floating' ? "bg-primary text-on-primary" : "hover:bg-on-surface/5 text-on-surface-variant hover:text-primary"
            )}
            title={mode === 'floating' ? t('common.unpin') : t('common.pin')}
          >
            {mode === 'floating' ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-error/10 text-on-surface-variant hover:text-error rounded-xl transition-all">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col bg-black/20">
        <div className="px-4 py-2 bg-surface-high/50 border-b border-brand-border flex items-center gap-2 shrink-0">
          <Terminal size={12} className="text-primary" />
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('messages.thinking')}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar font-mono text-[13px] leading-relaxed text-on-surface-variant">
          {thoughts ? (
            <pre className="whitespace-pre-wrap break-words">{thoughts}</pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-t-primary border-brand-border animate-spin" />
              <p className="text-xs uppercase tracking-widest font-black italic">Waiting for signal...</p>
            </div>
          )}
          <div ref={thoughtsEndRef} />
        </div>
      </div>

      {/* Footer / Status */}
      <div className="px-6 py-3 bg-surface-high border-t border-brand-border shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full", agentStatus.available ? "bg-primary" : "bg-brand-border")} />
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">
            {agentStatus.available ? "Ready" : "Offline"}
          </span>
        </div>
        {agentStatus.role && (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
            {agentStatus.role}
          </span>
        )}
      </div>
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="animate-in zoom-in-95 duration-200 w-full flex justify-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
