import { Sidebar } from './components/Sidebar';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { useWebSocket } from './hooks/useWebSocket';
import { useStore } from './store/useStore';
import { Hash, Zap, StopCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function App() {
  const { currentChannel, sessions } = useStore();
  const { sendMessage } = useWebSocket();
  const { t } = useTranslation();

  const handleSendMessage = (text: string, attachments?: any[], replyTo?: number) => {
    sendMessage(text, currentChannel, attachments, replyTo);
  };

  const activeSession = sessions[currentChannel];

  const handleEndSession = async () => {
      if (!activeSession) return;
      if (!confirm(t('app.terminate_session_confirm'))) return;
      try {
          await fetch(`/api/sessions/${activeSession.id}/end`, {
              method: 'POST',
              headers: { 'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' }
          });
      } catch (err) {
          console.error(err);
      }
  };

  return (
    <div className="flex h-screen w-full bg-brand-bg text-on-surface overflow-hidden font-sans selection:bg-primary-500/30">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 bg-brand-bg relative shadow-[inset_24px_0_40px_-20px_rgba(0,0,0,0.3)] transition-all duration-700">
        {/* M3 Style Top Bar */}
        <header className="h-16 border-b border-brand-border/30 flex items-center justify-between px-8 bg-brand-bg/60 backdrop-blur-2xl z-20 shrink-0">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="w-10 h-10 rounded-2xl bg-surface-high flex items-center justify-center border border-brand-border/50 shadow-sm group-hover:border-primary-500/50 transition-all duration-500">
                <Hash size={20} className="text-primary-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
                <h2 className="font-bold text-on-surface text-lg leading-none tracking-tight">{currentChannel}</h2>
                <p className="text-[10px] text-primary-400 font-black uppercase tracking-[0.2em] mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">{t('common.neural_node')}</p>
            </div>
          </div>
        </header>

        {/* Active Session Info Bar */}
        {activeSession && (
            <div className="bg-primary-500/10 border-b border-primary-500/20 px-8 py-3 flex items-center justify-between animate-in slide-in-from-top-full duration-500 z-10">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-500 shrink-0 animate-pulse">
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-white truncate">{activeSession.template_name}</span>
                            <span className="text-[10px] font-bold text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {t('app.phase')} {activeSession.current_phase + 1}/{activeSession.total_phases}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5 italic flex items-center gap-1.5">
                            <ArrowRight size={10} /> {activeSession.phase_name}
                            {activeSession.waiting_on && (
                                <span className="ml-2 not-italic font-black text-primary-500/80 uppercase tracking-tighter">
                                    • {t('app.awaiting')} {activeSession.waiting_on}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleEndSession}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 active:scale-95"
                >
                    <StopCircle size={14} /> {t('common.end_session')}
                </button>
            </div>
        )}

        {/* Neural Transmission Area (Messages) */}
        <div className="flex-1 flex flex-col min-h-0 relative">
            <MessageList />
            
            {/* Subtle Gradient Overlays for M3 Depth */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-brand-bg to-transparent pointer-events-none z-10 opacity-50" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-brand-bg via-brand-bg/80 to-transparent pointer-events-none z-10" />
        </div>
        
        {/* Comms Interface (Input) */}
        <div className="px-10 pb-10 pt-2 z-20">
            <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </main>
    </div>
  );
}

export default App;
