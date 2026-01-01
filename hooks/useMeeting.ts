
import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { Message, ConnectionStatus } from '../types';

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
    peerRef.current?.destroy();
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    setParticipants(new Map());
    setStatus('disconnected');
  }, []);

  const connectToPeer = useCallback((peerId: string, stream: MediaStream) => {
    if (!peerRef.current || connectionsRef.current.has(peerId)) return;

    // Call the peer
    const call = peerRef.current.call(peerId, stream);
    call.on('stream', (remoteStream) => {
      streamsRef.current.set(peerId, remoteStream);
      setParticipants(new Map(streamsRef.current));
    });

    // Connect for data (chat)
    const conn = peerRef.current.connect(peerId);
    setupDataConnection(conn);
  }, []);

  const setupDataConnection = (conn: DataConnection) => {
    conn.on('open', () => {
      connectionsRef.current.set(conn.peer, conn);
    });
    conn.on('data', (data: any) => {
      if (data.type === 'chat') {
        addMessage('model', data.text); // 'model' is used here to represent other users for UI consistency
      }
    });
    conn.on('close', () => {
      connectionsRef.current.delete(conn.peer);
      streamsRef.current.delete(conn.peer);
      setParticipants(new Map(streamsRef.current));
    });
  };

  const sendMessage = useCallback((text: string) => {
    connectionsRef.current.forEach(conn => {
      conn.send({ type: 'chat', text });
    });
    addMessage('user', text);
  }, [addMessage]);

  const joinRoom = useCallback(async (roomId: string) => {
    try {
      setStatus('connecting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;

      // Initialize Peer with a room-prefixed ID
      const peer = new Peer(`${roomId}-${Math.random().toString(36).substr(2, 5)}`);
      peerRef.current = peer;

      peer.on('open', (id) => {
        setStatus('connected');
        console.log('Joined with ID:', id);
        
        // In a real app, you'd fetch peer list from a server. 
        // For this P2P version, we rely on incoming connections or manual signaling.
        // NOTE: This demo assumes direct connection if IDs were known.
      });

      peer.on('connection', (conn) => {
        setupDataConnection(conn);
      });

      peer.on('call', (call) => {
        call.answer(stream);
        call.on('stream', (remoteStream) => {
          streamsRef.current.set(call.peer, remoteStream);
          setParticipants(new Map(streamsRef.current));
        });
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        setStatus('error');
      });

    } catch (err) {
      console.error('Media error:', err);
      setStatus('error');
    }
  }, []);

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
