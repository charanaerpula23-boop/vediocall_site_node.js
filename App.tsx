
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
  const participantCount = participants.size + 1; // Peers + Yourself

  const handleJoin = () => {
    if (roomId.trim()) {
      joinRoom(roomId.trim());
    } else {
      alert("Please enter a Room ID.");
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
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
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
            <span className="text-[10px] uppercase tracking-wider font-bold">
              {status === 'connected' ? 'Meeting Live' : status.toUpperCase()}
            </span>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 bg-indigo-600/20 px-3 py-1.5 rounded-md border border-indigo-500/30">
              <i className="fa-solid fa-users text-[10px] text-indigo-400" />
              <span className="text-[10px] uppercase font-bold text-indigo-400">
                {participantCount} {participantCount === 1 ? 'Member' : 'Members'}
              </span>
            </div>
          )}
        </div>

        {/* Meeting Stage */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {!isConnected && status !== 'connecting' ? (
            <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-8">
                <i className="fa-solid fa-video text-3xl text-indigo-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Real-time Video Chat</h1>
              <p className="text-zinc-500 text-sm mb-8">Enter a room ID to connect with others instantly.</p>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="ROOM-ID (e.g. ALPHA-9)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all uppercase tracking-widest placeholder:text-zinc-700"
                />
                <button 
                  onClick={handleJoin}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  Start Meeting
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center justify-center p-4">
              {/* Local Video */}
              <div className="relative aspect-video bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <video 
                  ref={userVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`} 
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <i className="fa-solid fa-user text-4xl text-zinc-700" />
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-xs font-bold">
                  You (Host)
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
        <div className="h-20 bg-zinc-900/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-8 z-40">
           <div className="flex gap-2">
              <button onClick={toggleMute} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isMuted ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`} />
              </button>
              <button onClick={toggleVideo} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`} />
              </button>
           </div>

           <div className="flex gap-4">
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSidebarOpen ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                <i className="fa-solid fa-message" />
              </button>
              {isConnected && (
                <button 
                  onClick={() => { disconnect(); setRoomId(''); }}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-6 rounded-xl font-bold text-sm transition-all"
                >
                  End Meeting
                </button>
              )}
           </div>

           <div className="hidden md:block">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                {roomId ? `Room: ${roomId}` : 'Ready'}
              </span>
           </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <aside className={`w-96 bg-zinc-900 border-l border-white/10 transition-all duration-300 flex flex-col z-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full fixed right-0'}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Meeting Chat</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-zinc-500 hover:text-white">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 bg-zinc-900">
           <input 
             type="text" 
             value={chatInput}
             onChange={(e) => setChatInput(e.target.value)}
             placeholder="Type a message..."
             className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
           />
        </form>
      </aside>
    </div>
  );
};

// Helper component for remote videos
const RemoteVideo: React.FC<{ stream: MediaStream; peerId: string }> = ({ stream, peerId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover" 
      />
      <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-xs font-bold">
        User-{peerId.split('-').pop()}
      </div>
    </div>
  );
};

export default App;
