import React from 'react';
import { Reply } from 'lucide-react';

const MessageBubble = ({ 
  msg, 
  isCurrentUser, 
  currentUserId,
  onReply,
  messageRef,
  darkMode = false 
}) => {
  const handleReplyClick = () => {
    if (onReply) {
      onReply({
        message_id: msg.id,
        text: msg.text,
        sender_id: msg.sender_id
      });
    }
  };

  return (
    <div
      ref={messageRef}
      className={`flex items-center gap-2 mt-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Reply button (left side for received messages) */}
      {!isCurrentUser && onReply && (
        <button
          onClick={handleReplyClick}
          className={`p-1 rounded transition-colors ${
            darkMode 
              ? 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200' 
              : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
          }`}
          aria-label="Reply to message"
        >
          <Reply size={16} />
        </button>
      )}

      {/* Message bubble */}
      <div 
        className={`inline-flex flex-col px-3.5 py-2 shadow-sm max-w-[85%] md:max-w-[75%] rounded-2xl ${
          isCurrentUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : darkMode 
              ? 'bg-[#212121] text-neutral-200 border border-neutral-700 rounded-bl-sm' 
              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
        }`}
      >
        {/* Reply Preview */}
        {msg.reply_to && (
          <div className={`text-xs p-2 rounded mb-2 border-l-2 ${
            isCurrentUser 
              ? 'bg-indigo-700 border-indigo-400' 
              : darkMode
                ? 'bg-neutral-800 border-blue-500'
                : 'bg-gray-100 border-blue-500'
          }`}>
            <div className="font-medium mb-1">
              {msg.reply_to.sender_id === currentUserId ? 'You' : 'Reply'}
            </div>
            <div className="truncate opacity-80">
              {msg.reply_to.text}
            </div>
          </div>
        )}

        {/* Message Text */}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {msg.text}
        </p>

        {/* Timestamp */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={`text-[10px] ${
            isCurrentUser ? 'text-indigo-200' : 'text-slate-500'
          }`}>
            {msg.timestamp?.seconds 
              ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : 'Sending...'
            }
          </span>
        </div>
      </div>

      {/* Reply button (right side for sent messages) */}
      {isCurrentUser && onReply && (
        <button
          onClick={handleReplyClick}
          className={`p-1 rounded transition-colors ${
            darkMode 
              ? 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200' 
              : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
          }`}
          aria-label="Reply to message"
        >
          <Reply size={16} />
        </button>
      )}
    </div>
  );
};

export default MessageBubble;
