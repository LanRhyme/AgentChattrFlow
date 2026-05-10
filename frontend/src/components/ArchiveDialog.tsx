import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Archive, RefreshCw, Trash2, Hash } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTranslation } from 'react-i18next';

export const ArchiveDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { archivedChannels, setArchivedChannels } = useStore();
  const { sendAction } = useWebSocket();
  const { t } = useTranslation();

  const fetchArchived = async () => {
    try {
      const res = await fetch('/api/channels/archived', {
          headers: { 'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' }
      });
      if (res.ok) setArchivedChannels(await res.json());
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (isOpen) fetchArchived();
  }, [isOpen]);

  const handleRestore = (name: string) => {
    sendAction({ type: 'channel_restore', name });
    onClose();
  };

  const handleDelete = async (name: string) => {
      if (!confirm(`Permanently delete channel #${name}? This cannot be undone.`)) return;
      try {
          const res = await fetch(`/api/channels/${name}`, {
              method: 'DELETE',
              headers: { 'X-Session-Token': (window as any).__SESSION_TOKEN__ || '' }
          });
          if (res.ok) fetchArchived();
      } catch (err) {
          console.error(err);
      }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full h-full sm:h-auto sm:max-w-xl transform overflow-hidden sm:rounded-[32px] bg-brand-panel p-6 sm:p-10 text-left align-middle shadow-2xl transition-all border border-brand-border ring-1 ring-white/5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-glow">
                      <Archive size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                        {t('sidebar.archived_channels') || 'Cold Storage'}
                      </Dialog.Title>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mt-1">{t('sidebar.archived_desc') || 'Restricted access to historical data'}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {archivedChannels.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-brand-border/20 rounded-[32px] opacity-20">
                      <Archive size={40} className="mx-auto mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">{t('sidebar.no_archived') || 'No records found'}</p>
                    </div>
                  ) : (
                    archivedChannels.map((name) => (
                      <div 
                        key={name} 
                        className="flex items-center justify-between p-5 bg-on-surface/[0.03] border border-brand-border rounded-2xl group hover:bg-on-surface/[0.05] transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Hash size={18} className="text-on-surface-variant/30 shrink-0" />
                          <span className="text-sm font-bold text-on-surface truncate tracking-tight">{name}</span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleRestore(name)}
                            className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                            title={t('common.restore')}
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(name)}
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                            title={t('common.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-10">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-on-surface/[0.03] border border-brand-border text-on-surface-variant font-black text-[10px] uppercase tracking-widest hover:bg-on-surface/5 transition-all"
                    >
                        {t('common.close')}
                    </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
