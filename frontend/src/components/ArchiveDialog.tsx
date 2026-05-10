import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Archive, RotateCcw, Trash2, Hash } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTranslation } from 'react-i18next';

export const ArchiveDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { archivedChannels } = useStore();
  const { sendAction } = useWebSocket();
  const { t } = useTranslation();

  const handleRestore = (name: string) => {
      sendAction({ type: 'channel_restore', name });
  };

  const handleDelete = (name: string) => {
      if (confirm(t('sidebar.archive_channel_confirm', { name }))) {
          sendAction({ type: 'channel_delete', name });
      }
  };

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
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[40px] bg-brand-panel p-10 text-left align-middle shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] transition-all border border-brand-border ring-1 ring-white/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
                    <Archive size={24} />
                  </div>
                  <div>
                      <Dialog.Title as="h3" className="text-xl font-black text-on-surface tracking-tight leading-none">
                        {t('sidebar.view_archived')}
                      </Dialog.Title>
                      <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.3em] mt-2">Dormant neural nodes</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface transition-all border border-brand-border"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {archivedChannels.length === 0 ? (
                    <div className="py-12 text-center opacity-20 border-2 border-dashed border-brand-border/30 rounded-3xl">
                        <Hash size={32} className="mx-auto mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">No archived nodes</p>
                    </div>
                ) : (
                    archivedChannels.map(name => (
                        <div key={name} className="flex items-center justify-between p-4 bg-on-surface/[0.03] border border-brand-border rounded-2xl group hover:bg-on-surface/[0.05] transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                                <Hash size={16} className="text-on-surface-variant/30 shrink-0" />
                                <span className="text-sm font-bold text-on-surface truncate">{name}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleRestore(name)}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                    title="Restore channel"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(name)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    title={t('common.delete')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-[24px] border border-transparent bg-on-surface/[0.05] px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant/50 hover:bg-on-surface/10 hover:text-on-surface transition-all"
                  onClick={onClose}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
