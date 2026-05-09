import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const { 
    addMessage, 
    setMessages, 
    setStatus, 
    setAgents,
    setSettings, 
    clearChannel,
    setTyping,
    updateMessage,
    removeMessage
  } = useStore();

  const connect = () => {
    const token = (window as any).__SESSION_TOKEN__ || "";
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${proto}://${window.location.host}/ws?token=${encodeURIComponent(token)}`);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleEvent(data);
    };

    socket.onclose = (e) => {
      if (e.code === 4003) {
        window.location.reload();
        return;
      }
      console.log('Disconnected, reconnecting in 2s...');
      setTimeout(connect, 2000);
    };

    ws.current = socket;
  };

  const handleEvent = (event: any) => {
    const { 
      updateJob, removeJob, setJobs,
      updateRule, removeRule, setRules,
      setSchedules 
    } = useStore.getState();

    switch (event.type) {
      case 'message':
        addMessage(event.data);
        break;
      case 'edit':
        if (event.message) updateMessage(event.message.id, event.message);
        break;
      case 'delete':
        if (event.ids) event.ids.forEach((id: number) => removeMessage(id));
        break;
      case 'status':
        setStatus(event.data);
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
      case 'schedule':
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
    connect();
    return () => {
      ws.current?.close();
    };
  }, []);

  const sendMessage = (text: string, channel: string, attachments: any[] = [], replyTo: number | null = null) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'message',
        text,
        channel,
        attachments,
        reply_to: replyTo,
        sender: useStore.getState().settings.username || 'user'
      }));
    }
  };

  const sendAction = (payload: any) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify(payload));
      }
  };

  return { sendMessage, sendAction };
};
