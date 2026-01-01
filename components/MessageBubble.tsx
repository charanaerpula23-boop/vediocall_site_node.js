
import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isUser ? 'text-indigo-400' : 'text-purple-400'}`}>
          {isUser ? 'You' : 'Assistant'}
        </span>
        <span className="text-[9px] text-zinc-600">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      <div className={`
        text-xs leading-relaxed transition-opacity
        ${isUser ? 'text-zinc-300' : 'text-zinc-100'}
        ${!message.isComplete ? 'opacity-70' : 'opacity-100'}
      `}>
        {message.text || (
           <div className="flex gap-1 py-1">
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
           </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
