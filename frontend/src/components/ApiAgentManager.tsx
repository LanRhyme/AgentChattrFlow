import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Terminal, Globe, Key, User, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ApiAgentManager = () => {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const resp = await fetch('/api/config/api-agents', {
        headers: { 'x-session-token': (window as any).__SESSION_TOKEN__ || '' }
      });
      const data = await resp.json();
      setAgents(data);
    } catch (e) {
      console.error('Error fetching API agents', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/config/api-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': (window as any).__SESSION_TOKEN__ || '',
        },
        body: JSON.stringify({ agents }),
      });
      if (resp.ok) {
        alert('API Agents saved successfully! (Some changes may require server restart if agents are currently running)');
      } else {
        alert('Failed to save API agents');
      }
    } catch (e) {
      alert('Error saving API agents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAgent = () => {
    const id = prompt('Enter a unique ID for the new API Agent (e.g. my-qwen):');
    if (!id || agents[id]) {
        if (id) alert('ID already exists or invalid');
        return;
    }
    setAgents({
      ...agents,
      [id]: {
        type: 'api',
        label: id.charAt(0).toUpperCase() + id.slice(1),
        color: '#8b5cf6',
        api_url: 'http://localhost:11434/v1',
        api_key_env: '',
        system_prompt: 'You are a helpful AI assistant.'
      }
    });
  };

  const removeAgent = (id: string) => {
    if (!confirm(`Delete API Agent "${id}"?`)) return;
    const next = { ...agents };
    delete next[id];
    setAgents(next);
  };

  const updateAgent = (id: string, field: string, value: any) => {
    setAgents({
      ...agents,
      [id]: { ...agents[id], [field]: value }
    });
  };

  if (isLoading) return <div className="p-8 text-center text-on-surface-variant/50">Loading configurations...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
          Manual API Agents (Local LLMs / OpenAI Endpoints)
        </p>
        <button 
          onClick={addAgent}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border border-primary/20"
        >
          <Plus size={14} />
          {t('common.add_workspace')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {Object.entries(agents).map(([id, cfg]) => (
          <div key={id} className="p-6 rounded-3xl bg-on-surface/[0.02] border border-brand-border space-y-6 relative group">
            <button 
              onClick={() => removeAgent(id)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/10"
            >
              <Trash2 size={16} />
            </button>

            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Terminal size={20} />
                </div>
                <div>
                    <h5 className="font-black text-on-surface text-sm tracking-tight uppercase">{id}</h5>
                    <p className="text-[10px] text-on-surface-variant/50 font-bold tracking-widest uppercase">ID ENTITY</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Label */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1">
                        <User size={12} /> Display Label
                    </label>
                    <input
                        type="text"
                        value={cfg.label || ''}
                        onChange={(e) => updateAgent(id, 'label', e.target.value)}
                        className="w-full bg-on-surface/10 border border-brand-border rounded-[16px] px-4 py-3 text-sm text-on-surface focus:border-primary/50 outline-none transition-all"
                    />
                </div>

                {/* Color */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1">
                        <Palette size={12} /> Theme Color
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={cfg.color || '#8b5cf6'}
                            onChange={(e) => updateAgent(id, 'color', e.target.value)}
                            className="w-12 h-[42px] bg-transparent border-none cursor-pointer rounded-lg"
                        />
                        <input
                            type="text"
                            value={cfg.color || ''}
                            onChange={(e) => updateAgent(id, 'color', e.target.value)}
                            className="flex-1 bg-on-surface/10 border border-brand-border rounded-[16px] px-4 py-3 text-sm text-on-surface focus:border-primary/50 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* API URL */}
                <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1">
                        <Globe size={12} /> Base URL (OpenAI Compatible)
                    </label>
                    <input
                        type="text"
                        value={cfg.api_url || ''}
                        onChange={(e) => updateAgent(id, 'api_url', e.target.value)}
                        placeholder="e.g. http://localhost:11434/v1"
                        className="w-full bg-on-surface/10 border border-brand-border rounded-[16px] px-4 py-3 text-sm text-on-surface focus:border-primary/50 outline-none transition-all"
                    />
                </div>

                {/* API Key Env */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1">
                        <Key size={12} /> API Key Env Var
                    </label>
                    <input
                        type="text"
                        value={cfg.api_key_env || ''}
                        onChange={(e) => updateAgent(id, 'api_key_env', e.target.value)}
                        placeholder="e.g. QWEN_API_KEY (leave empty if none)"
                        className="w-full bg-on-surface/10 border border-brand-border rounded-[16px] px-4 py-3 text-sm text-on-surface focus:border-primary/50 outline-none transition-all"
                    />
                </div>

                {/* Model Name */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1">
                        <Terminal size={12} /> Model Identifier
                    </label>
                    <input
                        type="text"
                        value={cfg.model || ''}
                        onChange={(e) => updateAgent(id, 'model', e.target.value)}
                        placeholder="e.g. qwen-2.5-7b"
                        className="w-full bg-on-surface/10 border border-brand-border rounded-[16px] px-4 py-3 text-sm text-on-surface focus:border-primary/50 outline-none transition-all"
                    />
                </div>

                {/* System Prompt */}
                <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 px-1">
                        System Prompt Override
                    </label>
                    <textarea
                        value={cfg.system_prompt || ''}
                        onChange={(e) => updateAgent(id, 'system_prompt', e.target.value)}
                        rows={3}
                        className="w-full bg-on-surface/10 border border-brand-border rounded-[20px] px-4 py-3 text-sm text-on-surface focus:border-primary/50 outline-none transition-all resize-none custom-scrollbar"
                    />
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary text-brand-bg rounded-[24px] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_12px_32px_-4px_var(--primary)] disabled:opacity-50"
        >
          {isSaving ? 'Synchronizing...' : (
            <>
                <Save size={16} />
                Save API Agents
            </>
          )}
        </button>
      </div>
    </div>
  );
};
