import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, FolderPlus, Loader2, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AddWorkspaceDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': (window as any).__SESSION_TOKEN__ || '',
        },
        body: JSON.stringify({ name, path }),
      });
      if (res.ok) {
        setName('');
        setPath('');
        onClose();
      }
    } catch (e) {
      console.error('Error adding workspace', e);
    } finally {
      setIsSubmitting(false);
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
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow">
                      <FolderPlus size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                        {t('common.add_workspace')}
                      </Dialog.Title>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mt-1">{t('common.workspace_init') || 'Neural Link Initialization'}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2 px-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60">{t('common.display_name')}</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Project Alpha"
                        className="w-full bg-on-surface/[0.03] border border-brand-border rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary/50 outline-none transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-2 px-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60">{t('common.file_path')}</label>
                      <input
                        type="text"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        placeholder="D:\Projects\..."
                        className="w-full bg-on-surface/[0.03] border border-brand-border rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary/50 outline-none transition-all shadow-inner font-mono"
                      />
                      <p className="text-[9px] text-on-surface-variant/40 mt-2 italic px-1 flex items-center gap-1.5"><Shield size={10} /> {t('common.absolute_path_hint') || 'Use absolute system path for neural access'}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-4 rounded-2xl bg-on-surface/[0.03] border border-brand-border text-on-surface-variant font-black text-[10px] uppercase tracking-widest hover:bg-on-surface/5 transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !name || !path}
                      className="flex-1 px-6 py-4 rounded-2xl bg-primary text-brand-bg font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : t('common.confirm')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
