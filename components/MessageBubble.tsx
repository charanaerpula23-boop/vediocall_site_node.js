
import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-2 mb-1 px-1">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isUser ? 'text-indigo-400' : 'text-zinc-500'}`}>
          {isUser ? 'You' : 'Participant'}
        </span>
        <span className="text-[9px] text-zinc-700">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      <div className={`
        max-w-[85%] px-4 py-2 rounded-2xl text-xs leading-relaxed
        ${isUser 
          ? 'bg-indigo-600 text-white rounded-tr-none' 
          : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-white/5'}
      `}>
        {message.text}
      </div>
    </div>
  );
};

export default MessageBubble;
