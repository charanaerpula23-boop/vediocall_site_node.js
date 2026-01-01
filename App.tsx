
import React, { useEffect, useRef, useState } from 'react';
import { useLiveChat } from './hooks/useLiveChat';
import MessageBubble from './components/MessageBubble';

const App: React.FC = () => {
  const { status, messages, isMuted, isVideoOff, toggleMute, toggleVideo, connect, disconnect } = useLiveChat();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isConnected = status === 'connected';

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
            <div className="flex items-center gap-2 bg-rose-600/20 px-3 py-1.5 rounded-md border border-rose-500/30">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
              <span className="text-[10px] uppercase font-bold text-rose-500 tracking-tighter">REC</span>
            </div>
          )}
        </div>

        {/* Meeting Stage */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {!isConnected && status !== 'connecting' ? (
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <i className="fa-solid fa-video text-4xl text-zinc-700" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Gemini Meeting Room</h1>
              <button 
                onClick={() => connect(userVideoRef.current!)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-3 rounded-lg font-bold transition-all shadow-xl shadow-indigo-600/20"
              >
                Join with Video
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {/* AI Participant Avatar */}
              <div className="relative w-full max-w-4xl aspect-video bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center group shadow-2xl">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/20 ring-4 ring-white/5">
                    <i className="fa-solid fa-sparkles text-5xl text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-medium text-zinc-100">Gemini (AI Colleague)</h2>
                    <p className="text-zinc-500 text-sm mt-1">Speaking...</p>
                  </div>
                </div>
                {/* Visualizer bars at bottom of AI feed */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
                   {[...Array(12)].map((_, i) => (
                      <div key={i} className={`w-1 bg-indigo-500/40 rounded-full ${isConnected ? 'wave-bar' : ''}`} style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }} />
                   ))}
                </div>
              </div>
            </div>
          )}

          {/* User Video (PIP) */}
          <div className={`absolute bottom-28 right-8 w-64 aspect-video bg-zinc-800 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-20 transition-all ${!isConnected ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <video 
              ref={userVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className={`w-full h-full object-cover transform ${isVideoOff ? 'hidden' : 'scale-x-[-1]'}`} 
            />
            {isVideoOff && (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                  <i className="fa-solid fa-user text-zinc-600" />
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold">
              You {isMuted && <i className="fa-solid fa-microphone-slash ml-1 text-rose-500" />}
            </div>
          </div>
        </div>

        {/* Control Bar (Zoom Style) */}
        <div className="h-20 bg-zinc-900/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-8 z-40">
           <div className="flex gap-2">
              <div className="flex flex-col items-center px-4 group cursor-pointer" onClick={() => isConnected && toggleMute()}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isMuted ? 'text-rose-500' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                   <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-lg`} />
                </div>
                <span className="text-[10px] text-zinc-500 font-bold mt-1 group-hover:text-zinc-300 transition-colors uppercase">Mute</span>
              </div>
              <div className="flex flex-col items-center px-4 group cursor-pointer" onClick={() => isConnected && toggleVideo()}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isVideoOff ? 'text-rose-500' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                   <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'} text-lg`} />
                </div>
                <span className="text-[10px] text-zinc-500 font-bold mt-1 group-hover:text-zinc-300 transition-colors uppercase">Video</span>
              </div>
           </div>

           <div className="flex gap-4">
              <div className="flex flex-col items-center px-4 group cursor-pointer" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isSidebarOpen ? 'bg-indigo-600/20 text-indigo-400' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                   <i className="fa-solid fa-message text-lg" />
                </div>
                <span className="text-[10px] text-zinc-500 font-bold mt-1 uppercase">Chat</span>
              </div>
              {isConnected && (
                <button 
                  onClick={disconnect}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-6 rounded-lg font-bold text-sm transition-all shadow-lg shadow-rose-600/20"
                >
                  End Meeting
                </button>
              )}
           </div>

           <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase mr-4">Meeting ID: GEM-LIVE-AI</span>
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
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <i className="fa-solid fa-comments text-4xl mb-4" />
              <p className="text-xs font-medium">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/5 bg-zinc-900">
           <div className="bg-black/50 border border-white/10 rounded-lg p-3 text-[11px] text-zinc-500 italic">
             This is a live transcription of your meeting with Gemini.
           </div>
        </div>
      </aside>
    </div>
  );
};

export default App;
