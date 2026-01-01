
import React from 'react';
import { ConnectionStatus } from '../types';

interface LiveStatusProps {
  status: ConnectionStatus;
}

const LiveStatus: React.FC<LiveStatusProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-emerald-500';
      case 'connecting': return 'bg-amber-500';
      case 'error': return 'bg-rose-500';
      default: return 'bg-zinc-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/5 shadow-xl backdrop-blur-md">
      <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusColor()}`} />
      <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">{getStatusText()}</span>
      
      {status === 'connected' && (
        <div className="flex items-center gap-0.5 h-3 ml-1">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="w-0.5 bg-emerald-500/80 wave-bar" 
              style={{ height: '60%' }} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveStatus;
