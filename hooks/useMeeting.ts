
import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Message, ConnectionStatus } from '../types';

const MAX_PARTICIPANTS = 6;

interface ChatPayload {
  type: 'chat';
  text: string;
}

export const useMeeting = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState<Map<string, MediaStream>>(new Map());
  
  const peerRef = useRef<Peer | null>(null);
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  const addMessage = useCallback((sender: 'user' | 'model', text: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      sender,
      text,
      isComplete: true,
      timestamp: new Date()
    }]);
  }, []);

  const disconnect = useCallback(() => {
    connectionsRef.current.forEach(conn => conn.close());
    connectionsRef.current.clear();
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    streamsRef.current.clear();
    setParticipants(new Map());
    setStatus('disconnected');
    currentRoomIdRef.current = null;
  }, []);

  const setupDataConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      connectionsRef.current.set(conn.peer, conn);
    });

    conn.on('data', (data: unknown) => {
      const payload = data as ChatPayload;
      if (payload && payload.type === 'chat') {
        addMessage('model', payload.text);
      }
    });

    conn.on('close', () => {
      connectionsRef.current.delete(conn.peer);
      streamsRef.current.delete(conn.peer);
      setParticipants(new Map(streamsRef.current));
    });

    conn.on('error', (err) => {
      console.error('Data connection error:', err);
    });
  }, [addMessage]);

  const sendMessage = useCallback((text: string) => {
    const chatData: ChatPayload = { type: 'chat', text };
    connectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send(chatData);
      }
    });
    addMessage('user', text);
  }, [addMessage]);

  const joinRoom = useCallback(async (roomId: string) => {
    try {
      disconnect();
      setStatus('connecting');
      currentRoomIdRef.current = roomId;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;

      let assignedId = '';
      let peerInstance: Peer | null = null;

      // Simple loop to find an empty slot
      for (let i = 0; i < MAX_PARTICIPANTS; i++) {
        const potentialId = `${roomId.toLowerCase()}-${i}`;
        const p = new Peer(potentialId);
        
        const success = await new Promise<boolean>((resolve) => {
          p.on('open', () => resolve(true));
          p.on('error', (err: any) => {
            if (err.type === 'unavailable-id') {
              p.destroy();
              resolve(false);
            } else {
              resolve(false);
            }
          });
        });

        if (success) {
          assignedId = potentialId;
          peerInstance = p;
          break;
        }
      }

      if (!peerInstance) {
        alert("Room is full or unavailable.");
        setStatus('disconnected');
        return;
      }

      peerRef.current = peerInstance;
      setStatus('connected');

      peerInstance.on('connection', (conn) => {
        setupDataConnection(conn);
      });

      peerInstance.on('call', (call) => {
        call.answer(localStreamRef.current!);
        call.on('stream', (remoteStream) => {
          streamsRef.current.set(call.peer, remoteStream);
          setParticipants(new Map(streamsRef.current));
        });
      });

      const myIndex = parseInt(assignedId.split('-').pop() || '0');
      for (let i = 0; i < MAX_PARTICIPANTS; i++) {
        if (i === myIndex) continue;
        const targetId = `${roomId.toLowerCase()}-${i}`;
        
        const conn = peerInstance.connect(targetId);
        setupDataConnection(conn);

        const call = peerInstance.call(targetId, localStreamRef.current!);
        call.on('stream', (remoteStream) => {
          streamsRef.current.set(targetId, remoteStream);
          setParticipants(new Map(streamsRef.current));
        });
      }

    } catch (err) {
      console.error('Meeting join error:', err);
      setStatus('error');
    }
  }, [disconnect, setupDataConnection]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMuted);
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
    }
  }, [isMuted, isVideoOff]);

  return {
    status,
    messages,
    isMuted,
    isVideoOff,
    participants,
    localStream: localStreamRef.current,
    toggleMute: () => setIsMuted(!isMuted),
    toggleVideo: () => setIsVideoOff(!isVideoOff),
    joinRoom,
    sendMessage,
    disconnect
  };
};
