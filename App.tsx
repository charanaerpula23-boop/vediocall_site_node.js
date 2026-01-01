
import React, { useEffect, useRef, useState } from 'react';
import { useMeeting } from './hooks/useMeeting';
import MessageBubble from './components/MessageBubble';

const App: React.FC = () => {
  const { 
    status, 
    messages, 
    isMuted, 
    isVideoOff, 
    participants, 
    localStream,
    toggleMute, 
    toggleVideo, 
    joinRoom, 
    sendMessage,
    disconnect 
  } = useMeeting();

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [roomId, setRoomId] = useState('');
  const [chatInput, setChatInput] = useState('');
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStream && userVideoRef.current) {
      userVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isConnected = status === 'connected';
  const participantCount = participants.size + 1;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      joinRoom(roomId.trim());
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && isConnected) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      {/* Main Meeting Area */}
      <div className="relative flex-1 flex flex-col bg-zinc-950">
        
        {/* Top Overlay Info */}
        <div className="absolute top-4 left-6 z-30 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-zinc-600'}`} />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-300">
              {status === 'connected' ? 'Secure Line' : status.toUpperCase()}
            </span>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 bg-indigo-600/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-indigo-500/30">
              <i className="fa-solid fa-users text-[10px] text-indigo-400" />
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-tight">
                {participantCount} {participantCount === 1 ? 'Participant' : 'Participants'}
              </span>
            </div>
          )}
        </div>

        {/* Meeting Stage */}
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
          {!isConnected && status !== 'connecting' ? (
            <div className="max-w-md w-full bg-zinc-900/40 backdrop-blur-2xl p-10 rounded-[2rem] border border-white/5 shadow-2xl text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/20">
                <i className="fa-solid fa-video text-4xl text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-3 tracking-tight">Enter the Room</h1>
              <p className="text-zinc-500 text-sm mb-10 leading-relaxed">Join a workspace to start a high-quality peer-to-peer conference.</p>
              
              <form onSubmit={handleJoin} className="space-y-4">
                <input 
                  type="text" 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="ROOM NAME (e.g. MARKETING)"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all uppercase tracking-[0.2em] placeholder:text-zinc-700 text-center font-bold"
                />
                <button 
                  type="submit"
                  className="w-full bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  Join Meeting
                </button>
              </form>
            </div>
          ) : (
            <div className={`w-full h-full grid gap-4 ${
              participantCount <= 1 ? 'grid-cols-1 max-w-4xl' : 
              participantCount <= 2 ? 'grid-cols-1 md:grid-cols-2' : 
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            } items-center justify-center auto-rows-fr`}>
              
              {/* Local Video */}
              <div className="relative h-full w-full bg-zinc-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl group">
                <video 
                  ref={userVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className={`w-full h-full object-cover transition-transform duration-700 ${isVideoOff ? 'hidden' : 'scale-x-[-1]'}`} 
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                      <i className="fa-solid fa-user text-3xl text-zinc-600" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/90">You</span>
                  {isMuted && <i className="fa-solid fa-microphone-slash text-[10px] text-rose-500" />}
                </div>
              </div>

              {/* Remote Participants */}
              {Array.from(participants.entries()).map(([peerId, stream]) => (
                <RemoteVideo key={peerId} stream={stream} peerId={peerId} />
              ))}
            </div>
          )}
        </div>

        {/* Control Bar */}
        <div className="h-24 bg-zinc-950/80 backdrop-blur-3xl border-t border-white/5 flex items-center justify-between px-10 z-40">
           <div className="flex gap-4">
              <button 
                onClick={toggleMute} 
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-lg`} />
              </button>
              <button 
                onClick={toggleVideo} 
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
              >
                <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'} text-lg`} />
              </button>
           </div>

           <div className="flex gap-4 items-center">
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)} 
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isSidebarOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              >
                <i className="fa-solid fa-message text-lg" />
              </button>
              {isConnected && (
                <button 
                  onClick={() => { disconnect(); setRoomId(''); }}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-8 h-14 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-600/40"
                >
                  Leave
                </button>
              )}
           </div>

           <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                {roomId ? `Encrypted: ${roomId}` : 'Ready'}
              </span>
              <span className="text-[9px] text-zinc-700 font-bold uppercase mt-1">
                Powered by WebRTC P2P
              </span>
           </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <aside className={`w-[400px] bg-zinc-900/50 backdrop-blur-2xl border-l border-white/5 transition-all duration-500 ease-in-out flex flex-col z-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full fixed right-0'}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/30">
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-200">Room Chat</h2>
            <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">Direct peer-to-peer data</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/10">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 px-10">
              <i className="fa-solid fa-comment-dots text-5xl mb-6" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No messages in this workspace yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-white/5 bg-zinc-900/30">
          <form onSubmit={handleSendChat} className="relative">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={!isConnected}
              placeholder={isConnected ? "Message everyone..." : "Join room to chat"}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-700 transition-all disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!chatInput.trim() || !isConnected}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white disabled:opacity-0 transition-all scale-90"
            >
              <i className="fa-solid fa-paper-plane text-xs" />
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
};

// Remote Video Component
const RemoteVideo: React.FC<{ stream: MediaStream; peerId: string }> = ({ stream, peerId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative h-full w-full bg-zinc-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover" 
      />
      <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
          Participant
        </span>
      </div>
    </div>
  );
};

export default App;
