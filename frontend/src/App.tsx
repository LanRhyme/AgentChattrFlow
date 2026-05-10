import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { useWebSocket } from './hooks/useWebSocket';
import { useStore } from './store/useStore';
import { Hash, Zap, StopCircle, ArrowRight, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { applyThemeToDOM, setupSystemThemeListener, cn } from './utils/theme';
import { AgentDetailDialog } from './components/AgentDetailDialog';

function App() {
  const { currentChannel, sessions, settings, pinnedAgents, togglePinAgent } = useStore();
  const { sendMessage } = useWebSocket();
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Apply Theme
  useEffect(() => {
      const theme = settings.theme || 'dark';
      const themeColor = settings.theme_color || 'green';
      const paletteStyle = settings.palette_style || 'tonal_spot';
      
      applyThemeToDOM(theme as any, themeColor as any, paletteStyle as any);

      if (theme === 'system') {
          return setupSystemThemeListener(() => {
              applyThemeToDOM('system', themeColor as any, paletteStyle as any);
          });
      }
  }, [settings.theme, settings.theme_color, settings.palette_style]);

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

  // Update CSS variables for background settings
  useEffect(() => {
      const root = document.documentElement;
      root.style.setProperty('--bg-blur', `${settings.bg_blur ?? 10}px`);
      root.style.setProperty('--bg-opacity', `${settings.bg_opacity ?? 0.4}`);
  }, [settings.bg_blur, settings.bg_opacity]);

  return (
    <div 
      className={cn(
        "flex h-screen w-full text-on-surface overflow-hidden font-sans selection:bg-primary/30 relative transition-colors duration-700",
        settings.bg_image ? "bg-transparent" : "bg-brand-bg"
      )}
    >
      {/* Dynamic Background Layer */}
      {settings.bg_image && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105 will-change-[filter]"
                style={{ 
                    backgroundImage: `url(${settings.bg_image})`,
                    filter: `blur(var(--bg-blur))`,
                }}
            />
            <div 
                className="absolute inset-0 transition-opacity duration-1000 will-change-opacity"
                style={{ 
                  backgroundColor: 'var(--brand-bg)',
                  opacity: 'var(--bg-opacity)'
                }}
            />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-[101] w-[280px] lg:w-auto lg:static transform lg:translate-x-0 transition-transform duration-300 ease-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onMobileClose={() => setIsSidebarOpen(false)} />
      </div>
      
      <main 
        className={cn(
          "flex-1 flex flex-col min-w-0 relative shadow-[inset_24px_0_40px_-20px_rgba(0,0,0,0.3)] transition-all duration-700 z-10",
          settings.bg_image ? "backdrop-blur-[4px]" : ""
        )}
        style={{
          backgroundColor: settings.bg_image 
            ? 'color-mix(in srgb, var(--brand-bg), transparent 60%)' 
            : 'var(--brand-bg)'
        }}
      >
        {/* M3 Style Top Bar - Fixed height, flex-shrink-0 */}
        <header className="h-16 shrink-0 border-b border-brand-border/30 flex items-center justify-between px-4 lg:px-8 bg-brand-bg/60 backdrop-blur-2xl z-30">
          <div className="flex items-center gap-3 lg:gap-4 group cursor-default min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-surface-high rounded-xl text-on-surface-variant transition-colors lg:hidden shrink-0"
            >
              <Menu size={24} />
            </button>
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-2xl bg-surface-high items-center justify-center border border-brand-border/50 shadow-sm group-hover:border-primary/50 transition-all duration-500 hidden xs:flex shrink-0">
                <Hash size={20} className="text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="min-w-0">
                <h2 className="font-bold text-on-surface text-base lg:text-lg leading-none tracking-tight truncate">{currentChannel}</h2>
                <p className="text-[9px] lg:text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1 lg:mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity truncate">{t('common.neural_node')}</p>
            </div>
          </div>
        </header>

        {/* Active Session Info Bar */}
        {activeSession && (
            <div className="bg-primary/10 border-b border-primary/20 px-4 lg:px-8 py-3 flex items-center justify-between animate-in slide-in-from-top-full duration-500 z-10 shrink-0">
                <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0 animate-pulse">
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-on-surface truncate">{activeSession.template_name}</span>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {t('app.phase')} {activeSession.current_phase + 1}/{activeSession.total_phases}
                            </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant/50 truncate mt-0.5 italic flex items-center gap-1.5">
                            <ArrowRight size={10} /> {activeSession.phase_name}
                            {activeSession.waiting_on && (
                                <span className="ml-2 not-italic font-black text-primary/80 uppercase tracking-tighter">
                                    • {t('app.awaiting')} {activeSession.waiting_on}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleEndSession}
                    className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 active:scale-95 shrink-0"
                >
                    <StopCircle size={14} /> <span className="hidden sm:inline">{t('common.end_session')}</span>
                </button>
            </div>
        )}

        {/* Neural Transmission Area (Messages) - flex-1 with hidden overflow to allow inner scroll */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
            <MessageList />
            
            {/* Subtle Gradient Overlays for M3 Depth */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-brand-bg/80 to-transparent pointer-events-none z-10 opacity-30" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-brand-bg via-brand-bg/40 to-transparent pointer-events-none z-10" />
        </div>
        
        {/* Comms Interface (Input) */}
        <div className="px-4 lg:px-10 pb-4 lg:pb-10 pt-2 z-20 shrink-0">
            <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </main>

      {/* Floating Agent Windows */}
      {pinnedAgents.map(id => (
        <AgentDetailDialog 
          key={id}
          agentId={id}
          mode="floating"
          onClose={() => togglePinAgent(id)}
        />
      ))}
    </div>
  );
}

export default App;
