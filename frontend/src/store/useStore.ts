import { create } from 'zustand';

export interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: number;
  type: string;
  channel: string;
  time?: string;
  attachments?: any[];
  metadata?: any;
  reply_to?: number;
}

export interface Job {
  id: number;
  title: string;
  status: 'open' | 'done' | 'archived';
  type: string;
  channel: string;
  created_by: string;
  created_at: number;
  assignee?: string;
  body?: string;
  messages?: any[];
}

export interface Rule {
  id: number;
  text: string;
  status: 'active' | 'draft';
  owner: string;
  created_at: number;
  reason?: string;
}

export interface AgentInfo {
  color: string;
  label: string;
  state?: string;
  base?: string;
  role?: string;
}

export interface AgentStatus {
  online: string[];
  busy: string[];
  typing?: string[];
  paused?: boolean;
}

export interface Session {
  id: string;
  template_id: string;
  template_name?: string;
  phase_name?: string;
  current_phase: number;
  total_phases: number;
  state: 'running' | 'waiting' | 'paused' | 'completed';
  channel: string;
  current_agent?: string;
  waiting_on?: string;
  goal?: string;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  roles: string[];
  is_custom?: boolean;
}

interface ChatStore {
  messages: Message[];
  agents: Record<string, AgentInfo>;
  status: Record<string, any>;
  settings: any;
  channels: string[];
  archivedChannels: string[];
  currentChannel: string;
  typingAgents: Set<string>;
  jobs: Job[];
  rules: Rule[];
  schedules: any[];
  replyingTo: Message | null;
  sessions: Record<string, Session>; // channel -> session
  templates: SessionTemplate[];
  soundPrefs: Record<string, string>;
  
  // Shared Socket Ref
  socket: WebSocket | null;
  
  // Actions
  setSocket: (socket: WebSocket | null) => void;
  sendAction: (payload: any) => void;
  
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: number, updates: Partial<Message>) => void;
  removeMessage: (id: number) => void;
  clearChannel: (channel: string) => void;
  setStatus: (status: Record<string, any>) => void;
  setAgents: (agents: Record<string, AgentInfo>) => void;
  setSettings: (settings: any) => void;
  setCurrentChannel: (channel: string) => void;
  setTyping: (agent: string, isTyping: boolean) => void;
  setReplyingTo: (message: Message | null) => void;
  renameSender: (oldName: string, newName: string) => void;
  setSoundPrefs: (prefs: Record<string, string>) => void;
  
  setJobs: (jobs: Job[]) => void;
  updateJob: (job: Job) => void;
  removeJob: (id: number) => void;
  
  setRules: (rules: Rule[]) => void;
  updateRule: (rule: Rule) => void;
  removeRule: (id: number) => void;

  setSchedules: (schedules: any[]) => void;
  
  setSessions: (sessions: Session[]) => void;
  updateSession: (session: Session) => void;
  removeSession: (channel: string) => void;
  setTemplates: (templates: SessionTemplate[]) => void;
}

export const useStore = create<ChatStore>((set, get) => ({
  messages: [],
  agents: {},
  status: {},
  settings: { username: 'user' },
  channels: ['general'],
  archivedChannels: [],
  currentChannel: 'general',
  typingAgents: new Set(),
  jobs: [],
  rules: [],
  schedules: [],
  replyingTo: null,
  sessions: {},
  templates: [],
  soundPrefs: JSON.parse(localStorage.getItem('agentchattr-sounds') || '{}'),
  socket: null,

  setSocket: (socket) => set({ socket }),
  sendAction: (payload) => {
      const socket = get().socket;
      if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(payload));
      } else {
          console.warn('Socket not open, action ignored:', payload);
      }
  },

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => {
    if (state.messages.some(m => m.id === message.id)) {
      return state;
    }
    return { messages: [...state.messages, message].sort((a, b) => a.timestamp - b.timestamp) };
  }),
  updateMessage: (id, updates) => set((state) => ({
      messages: state.messages.map(m => m.id === id ? { ...m, ...updates } : m)
  })),
  removeMessage: (id) => set((state) => ({
      messages: state.messages.filter(m => m.id !== id)
  })),
  clearChannel: (channel) => set((state) => ({
    messages: state.messages.filter(m => m.channel !== channel)
  })),
  setStatus: (status) => set({ status }),
  setAgents: (agents) => set({ agents }),
  setSettings: (settings) => {
      const channels = settings.channels || ['general'];
      const archivedChannels = settings.archived_channels || [];
      set((state) => ({ 
        settings: { ...state.settings, ...settings }, 
        channels,
        archivedChannels
      }));
  },
  setCurrentChannel: (currentChannel) => set({ currentChannel }),
  setTyping: (agent, isTyping) => set((state) => {
    const newTyping = new Set(state.typingAgents);
    if (isTyping) newTyping.add(agent);
    else newTyping.delete(agent);
    return { typingAgents: newTyping };
  }),
  setReplyingTo: (message) => set({ replyingTo: message }),
  renameSender: (oldName, newName) => set((state) => ({
      messages: state.messages.map(m => m.sender.toLowerCase() === oldName.toLowerCase() ? { ...m, sender: newName } : m)
  })),
  setSoundPrefs: (soundPrefs) => {
      localStorage.setItem('agentchattr-sounds', JSON.stringify(soundPrefs));
      set({ soundPrefs });
  },

  setJobs: (jobs) => set({ jobs }),
  updateJob: (job) => set((state) => {
    const exists = state.jobs.some(j => j.id === job.id);
    if (exists) {
      return { jobs: state.jobs.map(j => j.id === job.id ? job : j) };
    }
    return { jobs: [...state.jobs, job] };
  }),
  removeJob: (id) => set((state) => ({
    jobs: state.jobs.filter(j => j.id !== id)
  })),

  setRules: (rules) => set({ rules }),
  updateRule: (rule) => set((state) => {
    const exists = state.rules.some(r => r.id === rule.id);
    if (exists) {
      return { rules: state.rules.map(r => r.id === rule.id ? rule : r) };
    }
    return { rules: [...state.rules, rule] };
  }),
  removeRule: (id) => set((state) => ({
    rules: state.rules.filter(r => r.id !== id)
  })),

  setSchedules: (schedules) => set({ schedules }),

  setSessions: (sessions) => set(() => {
      const map: Record<string, Session> = {};
      sessions.forEach(s => { map[s.channel || 'general'] = s; });
      return { sessions: map };
  }),
  updateSession: (session) => set((state) => ({
      sessions: { ...state.sessions, [session.channel || 'general']: session }
  })),
  removeSession: (channel) => set((state) => {
      const next = { ...state.sessions };
      delete next[channel || 'general'];
      return { sessions: next };
  }),
  setTemplates: (templates) => set({ templates }),
}));
