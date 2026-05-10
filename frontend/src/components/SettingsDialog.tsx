import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, User, RefreshCw, Smartphone, Monitor, Volume2, Globe, Terminal, Moon, Laptop, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import { ApiAgentManager } from './ApiAgentManager';
import { Dropdown } from './Dropdown';
import { applyThemeToDOM, VALID_THEME_COLORS, VALID_PALETTE_STYLES } from '../utils/theme';

export const SettingsDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { settings, soundPrefs, setSoundPrefs, agents } = useStore();
  const { sendAction } = useWebSocket();
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState(0);

  // Local state for snappy UI feedback
  const [localTheme, setLocalTheme] = useState(settings.theme || 'dark');
  const [localColor, setLocalColor] = useState(settings.theme_color || 'green');
  const [localStyle, setLocalStyle] = useState(settings.palette_style || 'tonal_spot');

  // Sync local state with store when dialog opens or settings change
  useEffect(() => {
      if (isOpen) {
          setLocalTheme(settings.theme || 'dark');
          setLocalColor(settings.theme_color || 'green');
          setLocalStyle(settings.palette_style || 'tonal_spot');
      }
  }, [isOpen, settings.theme, settings.theme_color, settings.palette_style]);

  const handleSave = (key: string, value: any) => {
    sendAction({ type: 'update_settings', data: { [key]: value } });
  };

  const handleSoundChange = (key: string, value: string) => {
      const next = { ...soundPrefs, [key]: value };
      setSoundPrefs(next);
      
      // Preview sound
      if (value !== 'none') {
          const audio = new Audio(`/static/sounds/${value}.mp3`);
          audio.play().catch(() => {});
      }
  };

  const applyTheme = (theme: string) => {
      setLocalTheme(theme);
      handleSave('theme', theme);
  };

  const applyColor = (color: string) => {
      setLocalColor(color);
      handleSave('theme_color', color);
  };

  const applyPaletteStyle = (style: string) => {
      setLocalStyle(style);
      handleSave('palette_style', style);
  };

  const THEME_COLORS = [
      { id: 'green', label: 'Green', color: '#4caf50' },
      { id: 'blue', label: 'Blue', color: '#2196f3' },
      { id: 'purple', label: 'Purple', color: '#9c27b0' },
      { id: 'rose', label: 'Rose', color: '#f43f5e' },
  ];

  const PALETTE_STYLES = [
      { id: 'tonal_spot', label: t('settings.palette_styles.tonal_spot') },
      { id: 'vibrant', label: t('settings.palette_styles.vibrant') },
      { id: 'expressive', label: t('settings.palette_styles.expressive') },
      { id: 'neutral', label: t('settings.palette_styles.neutral') },
  ];

  const SOUND_OPTIONS = [
      { id: 'none', name: 'Silent' },
      { id: 'soft-chime', name: 'Soft Chime' },
      { id: 'bright-ping', name: 'Bright Ping' },
      { id: 'warm-bell', name: 'Warm Bell' },
      { id: 'gentle-pop', name: 'Gentle Pop' },
      { id: 'pluck', name: 'Pluck' },
      { id: 'alert-tone', name: 'Alert Tone' },
      { id: 'click', name: 'Mechanical Click' },
  ];

  const sections = [
    {
      id: 'appearance',
      title: t('settings.appearance'),
      icon: Monitor,
      fields: (
        <div className="space-y-8">
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">{t('settings.brightness_mode')}</label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { id: 'dark', label: t('settings.theme_modes.dark'), icon: Moon },
                        { id: 'system', label: t('settings.theme_modes.system'), icon: Laptop },
                    ].map((mode) => {
                        const isSelected = localTheme === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => applyTheme(mode.id)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all relative ${
                                    isSelected 
                                    ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-lg shadow-primary/10' 
                                    : 'bg-on-surface/[0.03] border-brand-border text-on-surface-variant hover:bg-on-surface/[0.05]'
                                }`}
                            >
                                {isSelected && <div className="absolute top-2 right-2 animate-in zoom-in-50 duration-300"><Check size={12} className="text-primary" /></div>}
                                <mode.icon size={20} className={isSelected ? 'text-primary' : ''} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-primary' : ''}`}>{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">{t('settings.primary_color')}</label>
                <div className="grid grid-cols-4 gap-3">
                    {THEME_COLORS.map((color) => {
                        const isSelected = localColor === color.id;
                        return (
                            <button
                                key={color.id}
                                onClick={() => applyColor(color.id)}
                                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all relative ${
                                    isSelected 
                                    ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-lg shadow-primary/10' 
                                    : 'bg-on-surface/[0.03] border-brand-border text-on-surface-variant hover:bg-on-surface/[0.05]'
                                }`}
                            >
                                {isSelected && <div className="absolute top-1 right-1 animate-in zoom-in-50 duration-300"><Check size={10} className="text-primary" /></div>}
                                <div className="w-5 h-5 rounded-full shadow-lg shrink-0" style={{ backgroundColor: color.color }} />
                                <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : ''}`}>{color.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">{t('settings.palette_style')}</label>
                <div className="grid grid-cols-2 gap-3">
                    {PALETTE_STYLES.map((style) => {
                        const isSelected = localStyle === style.id;
                        return (
                            <button
                                key={style.id}
                                onClick={() => applyPaletteStyle(style.id)}
                                className={`flex items-center justify-center p-3 rounded-2xl border transition-all relative ${
                                    isSelected 
                                    ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-lg shadow-primary/10' 
                                    : 'bg-on-surface/[0.03] border-brand-border text-on-surface-variant hover:bg-on-surface/[0.05]'
                                }`}
                            >
                                {isSelected && <div className="absolute top-2 right-2 animate-in zoom-in-50 duration-300"><Check size={12} className="text-primary" /></div>}
                                <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : ''}`}>{style.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Dropdown 
                    label={t('settings.typography')}
                    value={settings.font || 'sans'}
                    onChange={(val) => handleSave('font', val)}
                    options={[
                        { id: 'sans', name: t('settings.fonts.sans') },
                        { id: 'mono', name: t('settings.fonts.mono') },
                        { id: 'serif', name: t('settings.fonts.serif') }
                    ]}
                />
                <Dropdown 
                    label={t('settings.visual_depth')}
                    value={settings.contrast || 'normal'}
                    onChange={(val) => handleSave('contrast', val)}
                    options={[
                        { id: 'normal', name: t('settings.contrast.normal') },
                        { id: 'high', name: t('settings.contrast.high') }
                    ]}
                />
            </div>
        </div>
      )
    },
    {
      id: 'identity',
      title: t('settings.identity'),
      icon: User,
      fields: (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">{t('settings.user_identifier')}</label>
                <input
                    type="text"
                    value={settings.username || ''}
                    onChange={(e) => handleSave('username', e.target.value)}
                    className="w-full bg-on-surface/[0.03] border border-brand-border rounded-[20px] px-5 py-3 text-sm text-on-surface focus:border-primary/50 focus:bg-on-surface/[0.05] outline-none transition-all shadow-inner"
                    placeholder="BEN-ADMIN..."
                />
            </div>
        </div>
      )
    },
    {
        id: 'api',
        title: 'API Intelligence',
        icon: Terminal,
        fields: <ApiAgentManager />
    },
    {
        id: 'localization',
        title: t('settings.localization'),
        icon: Globe,
        fields: (
            <Dropdown 
                label={t('settings.interface_language')}
                value={i18n.language.startsWith('zh') ? 'zh' : 'en'}
                onChange={(val) => i18n.changeLanguage(val)}
                options={[
                    { id: 'en', name: 'English (US)' },
                    { id: 'zh', name: '简体中文 (SC)' }
                ]}
            />
        )
    },
    {
      id: 'acoustics',
      title: t('settings.acoustics'),
      icon: Volume2,
      fields: (
        <div className="grid grid-cols-1 gap-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            <Dropdown 
                label={t('settings.default_notification')}
                value={soundPrefs['default'] || 'soft-chime'}
                onChange={(val) => handleSoundChange('default', val)}
                options={SOUND_OPTIONS}
            />
            <Dropdown 
                label={t('settings.cross_channel_alert')}
                value={soundPrefs['cross-channel'] || 'pluck'}
                onChange={(val) => handleSoundChange('cross-channel', val)}
                options={SOUND_OPTIONS}
            />
            
            {Object.entries(agents).map(([id, info]) => (
                <Dropdown 
                    key={id}
                    label={`Agent: ${info.label || id}`}
                    value={soundPrefs[id] || ''}
                    onChange={(val) => handleSoundChange(id, val)}
                    options={[
                        { id: '', name: 'Inherit Default' },
                        ...SOUND_OPTIONS
                    ]}
                />
            ))}
        </div>
      )
    },
    {
        id: 'network',
        title: t('settings.network'),
        icon: RefreshCw,
        fields: (
          <div className="grid grid-cols-2 gap-4">
              <Dropdown 
                  label={t('settings.history_depth')}
                  value={String(settings.history_limit || 'all')}
                  onChange={(val) => handleSave('history_limit', val)}
                  options={[
                      { id: 'all', name: t('settings.history.all') },
                      { id: '100', name: t('settings.history.100') },
                      { id: '500', name: t('settings.history.500') }
                  ]}
              />
              <Dropdown 
                  label={t('settings.neural_sync')}
                  value={String(settings.rules_refresh_interval || '10')}
                  onChange={(val) => handleSave('rules_refresh_interval', val)}
                  options={[
                      { id: '0', name: t('settings.sync.event') },
                      { id: '10', name: t('settings.sync.batch10') },
                      { id: '20', name: t('settings.sync.batch20') }
                  ]}
              />
          </div>
        )
      }
  ];

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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-500"
            enterFrom="opacity-0 scale-95 translate-y-4"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-300"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-4"
          >
            <Dialog.Panel className="w-full max-w-4xl h-[600px] flex transform overflow-hidden rounded-[32px] bg-brand-panel text-left align-middle shadow-2xl transition-all border border-brand-border ring-1 ring-white/5">
              {/* Sidebar */}
              <div className="w-64 border-r border-brand-border bg-brand-bg/50 flex flex-col shrink-0">
                <div className="p-8 pb-4">
                    <h3 className="text-xl font-black text-on-surface tracking-tight leading-none flex items-center gap-2">
                      <Smartphone size={20} className="text-primary" />
                      {t('common.system_preferences')}
                    </h3>
                </div>
                <nav className="flex-1 px-4 space-y-1 mt-4">
                    {sections.map((section, idx) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(idx)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                                activeSection === idx 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface'
                            }`}
                        >
                            <section.icon size={18} className={activeSection === idx ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'} />
                            <span className="text-[13px] font-bold">{section.title}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-6">
                    <button
                      onClick={onClose}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-on-surface/[0.03] hover:bg-on-surface/[0.08] text-on-surface-variant hover:text-on-surface border border-brand-border rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                        <X size={14} /> {t('common.close')}
                    </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col min-w-0 bg-brand-panel">
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500" key={activeSection}>
                         <div className="flex items-center gap-3 mb-8">
                            <h4 className="text-sm font-black uppercase tracking-[0.3em] text-on-surface-variant">{sections[activeSection].title}</h4>
                            <div className="flex-1 h-px bg-brand-border" />
                         </div>
                         {sections[activeSection].fields}
                    </div>
                </div>

                <div className="p-8 border-t border-brand-border flex gap-4 bg-brand-bg/20">
                    <button className="px-6 py-3 bg-on-surface/[0.03] hover:bg-on-surface/[0.08] text-on-surface-variant border border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                        {t('settings.data_archive')}
                    </button>
                    <button
                      type="button"
                      className="flex-1 inline-flex justify-center rounded-2xl border border-transparent bg-primary px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-brand-bg hover:opacity-90 transition-all shadow-lg"
                      onClick={onClose}
                    >
                      {t('settings.confirm_sequence')}
                    </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
