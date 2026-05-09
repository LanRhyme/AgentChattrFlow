import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, Folder, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWorkspaceDialog = ({ isOpen, onClose }: AddWorkspaceDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [isPicking, setIsPicking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickDirectory = async () => {
    setIsPicking(true);
    try {
      const resp = await fetch('/api/pick-directory', {
        headers: { 'x-session-token': (window as any).__SESSION_TOKEN__ || '' }
      });
      const data = await resp.json();
      if (data.path) {
        setPath(data.path);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      alert('Error picking directory');
    } finally {
      setIsPicking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !path) return;

    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': (window as any).__SESSION_TOKEN__ || '',
        },
        body: JSON.stringify({ name, path }),
      });
      if (resp.ok) {
        setName('');
        setPath('');
        onClose();
      } else {
        const data = await resp.json();
        alert(data.error || 'Failed to add workspace');
      }
    } catch (e) {
      alert('Error adding workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[32px] bg-brand-panel border border-brand-border p-8 shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-8">
                  <Dialog.Title className="text-xl font-black text-on-surface uppercase tracking-tight">
                    {t('common.add_workspace')}
                  </Dialog.Title>
                  <button onClick={onClose} className="p-2 hover:bg-surface-high rounded-full transition-colors">
                    <X size={20} className="text-on-surface-variant" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary-400 uppercase tracking-widest px-1">
                      {t('common.workspace_name')}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. My Project"
                      className="w-full bg-surface-low border border-brand-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary-400 uppercase tracking-widest px-1">
                      {t('common.workspace_path')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        placeholder={t('common.workspace_path_placeholder')}
                        className="flex-1 bg-surface-low border border-brand-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={handlePickDirectory}
                        disabled={isPicking}
                        className="px-4 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 rounded-2xl border border-primary-500/20 transition-all flex items-center justify-center min-w-[100px]"
                        title={t('common.trust_directory')}
                      >
                        {isPicking ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Folder size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3.5 rounded-2xl bg-surface-high text-on-surface-variant font-bold text-sm hover:bg-surface-highest transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !name || !path}
                      className="flex-1 px-6 py-3.5 rounded-2xl bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:shadow-none"
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
