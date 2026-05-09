import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, User, RefreshCw, Smartphone, Monitor, Volume2, Globe, Terminal } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import { ApiAgentManager } from './ApiAgentManager';
import { Dropdown } from './Dropdown';

export const SettingsDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { settings, soundPrefs, setSoundPrefs, agents } = useStore();
  const { sendAction } = useWebSocket();
  const { t, i18n } = useTranslation();

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
      title: t('settings.identity'),
      icon: User,
      fields: (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">{t('settings.user_identifier')}</label>
                <input
                    type="text"
                    value={settings.username || ''}
                    onChange={(e) => handleSave('username', e.target.value)}
                    className="w-full bg-white/[0.03] border border-brand-border rounded-[20px] px-5 py-4 text-sm text-gray-100 focus:border-primary-500/50 focus:bg-white/[0.05] outline-none transition-all shadow-inner"
                    placeholder="BEN-ADMIN..."
                />
            </div>
        </div>
      )
    },
    {
        title: 'API Intelligence',
        icon: Terminal,
        fields: <ApiAgentManager />
    },
    {
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
      title: t('settings.acoustics'),
      icon: Volume2,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      title: t('settings.interface'),
      icon: Monitor,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      )
    },
    {
        title: t('settings.network'),
        icon: RefreshCw,
        fields: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="fixed inset-0 bg-brand-bg/90 backdrop-blur-xl transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-500"
            enterFrom="opacity-0 scale-95 translate-y-8"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-300"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-8"
          >
            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-[40px] bg-brand-panel p-10 text-left align-middle shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] transition-all border border-brand-border ring-1 ring-white/5">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 shadow-sm">
                    <Smartphone size={24} />
                  </div>
                  <div>
                      <Dialog.Title as="h3" className="text-2xl font-black text-white tracking-tight leading-none">
                        {t('common.system_preferences')}
                      </Dialog.Title>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">{t('common.global_configuration')}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-3 text-gray-500 hover:bg-white/5 hover:text-white transition-all border border-brand-border"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-12 max-h-[65vh] overflow-y-auto pr-6 custom-scrollbar pb-10">
                {sections.map((section, idx) => (
                    <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                         <div className="flex items-center gap-3 mb-6">
                            <section.icon size={16} className="text-primary-500/70" />
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">{section.title}</h4>
                            <div className="flex-1 h-px bg-white/5" />
                         </div>
                         {section.fields}
                    </div>
                ))}
              </div>

              <div className="mt-8 flex gap-4 pt-8 border-t border-white/5">
                <button className="flex-1 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 border border-brand-border rounded-[24px] text-xs font-black uppercase tracking-widest transition-all">
                    {t('settings.data_archive')}
                </button>
                <button
                  type="button"
                  className="flex-[2] inline-flex justify-center rounded-[24px] border border-transparent bg-primary-500 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-brand-bg hover:bg-primary-400 transition-all shadow-[0_12px_32px_-4px_rgba(76,175,80,0.4)]"
                  onClick={onClose}
                >
                  {t('settings.confirm_sequence')}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
