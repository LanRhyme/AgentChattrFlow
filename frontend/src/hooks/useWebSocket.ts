import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const useWebSocket = () => {
  const soundEnabled = useRef(false);
  const soundCache = useRef<Record<string, HTMLAudioElement>>({});

  const { 
    addMessage, 
    setMessages, 
    setStatus, 
    setAgents, 
    setSettings, 
    clearChannel,
    setTyping,
    updateMessage,
    removeMessage,
    soundPrefs,
    setSocket,
    setCurrentChannel
  } = useStore();

  const playSound = (soundName: string) => {
      if (!soundName || soundName === 'none') return;
      if (!soundCache.current[soundName]) {
          soundCache.current[soundName] = new Audio(`/static/sounds/${soundName}.mp3`);
      }
      const audio = soundCache.current[soundName];
      audio.currentTime = 0;
      audio.play().catch(() => {});
  };

  const playNotificationSound = (sender: string) => {
      const key = sender.toLowerCase();
      const soundName = soundPrefs[key] || soundPrefs['default'] || 'soft-chime';
      playSound(soundName);
  };

  const playCrossChannelSound = () => {
      const soundName = soundPrefs['cross-channel'] || 'pluck';
      playSound(soundName);
  };

  const connect = () => {
    soundEnabled.current = false;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${proto}://${window.location.host}/ws`);

    socket.onopen = () => {
      console.log('WebSocket connected');
      const token = (window as any).__SESSION_TOKEN__ || "";
      socket.send(JSON.stringify({ type: 'auth', token }));
      setSocket(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleEvent(data);
    };

    socket.onclose = (e) => {
      setSocket(null);
      if (e.code === 4003) {
        window.location.reload();
        return;
      }
      console.log('Disconnected, reconnecting in 2s...');
      setTimeout(connect, 2000);
    };
  };

  const handleEvent = (event: any) => {
    const { 
      updateJob, removeJob, setJobs,
      updateRule, removeRule, setRules,
      setSchedules, settings, currentChannel
    } = useStore.getState();

    switch (event.type) {
      case 'message':
        addMessage(event.data);
        if (soundEnabled.current) {
            const msg = event.data;
            const isSelf = msg.sender.toLowerCase() === settings.username?.toLowerCase();
            const isSystem = msg.type === 'system' || msg.type === 'join' || msg.type === 'leave' || msg.type === 'summary';
            
            if (!isSelf && !isSystem) {
                if (msg.channel !== currentChannel) {
                    playCrossChannelSound();
                } else if (!document.hasFocus()) {
                    playNotificationSound(msg.sender);
                }
            }
        }
        break;
      case 'edit':
        if (event.message) updateMessage(event.message.id, event.message);
        break;
      case 'delete':
        if (event.ids) event.ids.forEach((id: number) => removeMessage(id));
        break;
      case 'status':
        setStatus(event.data);
        if (!soundEnabled.current) {
            setTimeout(() => { soundEnabled.current = true; }, 1000);
        }
        break;
      case 'agents':
        if (event.data) setAgents(event.data);
        break;
      case 'agent_renamed':
        if (event.old_name && event.new_name) {
            useStore.getState().renameSender(event.old_name, event.new_name);
        }
        break;
      case 'settings':
        // If current channel was archived, switch to general
        const newChannels = event.data.channels || ['general'];
        if (!newChannels.includes(useStore.getState().currentChannel)) {
            setCurrentChannel('general');
        }
        setSettings(event.data);
        break;
      case 'typing':
        setTyping(event.agent, event.active);
        break;
      case 'clear':
        if (event.channel) {
            clearChannel(event.channel);
        } else {
            setMessages([]);
        }
        break;
      case 'job':
        if (event.action === 'delete') removeJob(event.data.id);
        else updateJob(event.data);
        break;
      case 'jobs':
        setJobs(event.data);
        break;
      case 'rule':
      case 'decision':
        if (event.action === 'delete') removeRule(event.data.id);
        else updateRule(event.data);
        break;
      case 'rules':
      case 'decisions':
        setRules(event.data);
        break;
      case 'schedules':
        setSchedules(event.data);
        break;
      case 'session':
        if (event.action === 'complete' || event.action === 'interrupt') {
            useStore.getState().removeSession(event.data.channel);
        } else {
            useStore.getState().updateSession(event.data);
        }
        break;
      case 'reload':
        window.location.reload();
        break;
    }
  };

  useEffect(() => {
    // Only connect if not already connecting
    if (!useStore.getState().socket) {
        connect();
    }
  }, []);

  const sendMessage = (text: string, channel: string, attachments: any[] = [], replyTo: number | null = null) => {
    useStore.getState().sendAction({
        type: 'message',
        text,
        channel,
        attachments,
        reply_to: replyTo,
        sender: useStore.getState().settings.username || 'user'
    });
  };

  return { sendMessage, sendAction: useStore.getState().sendAction };
};
