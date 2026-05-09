import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, User, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { useStore } from '../store/useStore';

export const SettingsDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { settings, setSettings } = useStore();

  const handleSave = (key: string, value: any) => {
    setSettings({ [key]: value });
  };

  const sections = [
    {
      title: 'Identity',
      icon: User,
      fields: (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">User Identifier</label>
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
      title: 'Interface',
      icon: Monitor,
      fields: (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Typography</label>
                <select 
                    value={settings.font || 'sans'}
                    onChange={(e) => handleSave('font', e.target.value)}
                    className="w-full bg-white/[0.03] border border-brand-border rounded-[20px] px-5 py-4 text-sm text-gray-100 focus:border-primary-500/50 outline-none appearance-none cursor-pointer"
                >
                    <option value="sans">Modern Sans</option>
                    <option value="mono">Technical Mono</option>
                    <option value="serif">Classic Serif</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Visual Depth</label>
                <select 
                    value={settings.contrast || 'normal'}
                    onChange={(e) => handleSave('contrast', e.target.value)}
                    className="w-full bg-white/[0.03] border border-brand-border rounded-[20px] px-5 py-4 text-sm text-gray-100 focus:border-primary-500/50 outline-none appearance-none cursor-pointer"
                >
                    <option value="normal">Standard</option>
                    <option value="high">High Definition</option>
                </select>
            </div>
        </div>
      )
    },
    {
        title: 'Network',
        icon: RefreshCw,
        fields: (
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">History Depth</label>
                  <select 
                      value={String(settings.history_limit || 'all')}
                      onChange={(e) => handleSave('history_limit', e.target.value)}
                      className="w-full bg-white/[0.03] border border-brand-border rounded-[20px] px-5 py-4 text-sm text-gray-100 focus:border-primary-500/50 outline-none appearance-none cursor-pointer"
                  >
                      <option value="all">Unlimited</option>
                      <option value="100">100 Cycles</option>
                      <option value="500">500 Cycles</option>
                  </select>
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Neural Sync</label>
                  <select 
                      value={String(settings.rules_refresh_interval || '10')}
                      onChange={(e) => handleSave('rules_refresh_interval', e.target.value)}
                      className="w-full bg-white/[0.03] border border-brand-border rounded-[20px] px-5 py-4 text-sm text-gray-100 focus:border-primary-500/50 outline-none appearance-none cursor-pointer"
                  >
                      <option value="0">Event Driven</option>
                      <option value="10">Batch 10</option>
                      <option value="20">Batch 20</option>
                  </select>
              </div>
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
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[40px] bg-brand-panel p-10 text-left align-middle shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] transition-all border border-brand-border ring-1 ring-white/5">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 shadow-sm">
                    <Smartphone size={24} />
                  </div>
                  <div>
                      <Dialog.Title as="h3" className="text-2xl font-black text-white tracking-tight leading-none">
                        System Preferences
                      </Dialog.Title>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">Global Configuration</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-3 text-gray-500 hover:bg-white/5 hover:text-white transition-all border border-brand-border"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-10 max-h-[60vh] overflow-y-auto pr-6 custom-scrollbar pb-6">
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

              <div className="mt-12 flex gap-4">
                <button className="flex-1 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 border border-brand-border rounded-[24px] text-xs font-black uppercase tracking-widest transition-all">
                    Data Archive (Export)
                </button>
                <button
                  type="button"
                  className="flex-[2] inline-flex justify-center rounded-[24px] border border-transparent bg-primary-500 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-brand-bg hover:bg-primary-400 transition-all shadow-[0_12px_32px_-4px_rgba(76,175,80,0.4)]"
                  onClick={onClose}
                >
                  Confirm Sequence
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
