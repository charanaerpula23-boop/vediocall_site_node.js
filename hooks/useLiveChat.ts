
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Message, ConnectionStatus } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audioUtils';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';
const FRAME_RATE = 1; // 1 frame per second is sufficient for interaction
const JPEG_QUALITY = 0.8;

export const useLiveChat = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const transcriptionsRef = useRef({ user: '', model: '' });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const addOrUpdateMessage = useCallback((sender: 'user' | 'model', text: string, isComplete: boolean) => {
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.sender === sender && !lastMessage.isComplete) {
        const updated = [...prev];
        updated[updated.length - 1] = { ...lastMessage, text, isComplete };
        return updated;
      }
      return [...prev, { id: Math.random().toString(36).substr(2, 9), sender, text, isComplete, timestamp: new Date() }];
    });
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    processorRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    
    setStatus('disconnected');
  }, []);

  const connect = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      if (!audioContextsRef.current) {
        audioContextsRef.current = {
          input: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 }),
          output: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 })
        };
      }

      const { input: inputCtx, output: outputCtx } = audioContextsRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaStreamRef.current = stream;
      videoElement.srcObject = stream;

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are a professional AI colleague in a Zoom-style meeting. You can see the user. Respond naturally and keep it conversational.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus('connected');
            
            // Audio Streaming
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: createPcmBlob(inputData) });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            // Video Streaming (Frames)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            frameIntervalRef.current = window.setInterval(() => {
              if (isVideoOff || !videoElement.videoWidth) return;
              canvas.width = videoElement.videoWidth / 2; // Downscale for bandwidth
              canvas.height = videoElement.videoHeight / 2;
              ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
              
              canvas.toBlob(async (blob) => {
                if (blob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    sessionPromise.then(session => {
                      session.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
                    });
                  };
                  reader.readAsDataURL(blob);
                }
              }, 'image/jpeg', JPEG_QUALITY);
            }, 1000 / FRAME_RATE);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              transcriptionsRef.current.user += message.serverContent.inputTranscription.text;
              addOrUpdateMessage('user', transcriptionsRef.current.user, false);
            }
            if (message.serverContent?.outputTranscription) {
              transcriptionsRef.current.model += message.serverContent.outputTranscription.text;
              addOrUpdateMessage('model', transcriptionsRef.current.model, false);
            }
            if (message.serverContent?.turnComplete) {
              addOrUpdateMessage('user', transcriptionsRef.current.user, true);
              addOrUpdateMessage('model', transcriptionsRef.current.model, true);
              transcriptionsRef.current.user = '';
              transcriptionsRef.current.model = '';
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => s.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: () => setStatus('error'),
          onclose: () => disconnect()
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }, [addOrUpdateMessage, disconnect, isMuted, isVideoOff]);

  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMuted);
      mediaStreamRef.current.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
    }
  }, [isMuted, isVideoOff]);

  return {
    status,
    messages,
    isMuted,
    isVideoOff,
    toggleMute: () => setIsMuted(!isMuted),
    toggleVideo: () => setIsVideoOff(!isVideoOff),
    connect,
    disconnect,
    mediaStream: mediaStreamRef.current
  };
};
