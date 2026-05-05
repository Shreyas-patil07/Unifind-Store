import React from 'react';
import { X } from 'lucide-react';

const ReplyPreview = ({ replyingTo, currentUserId, onCancel, darkMode = false }) => {
  if (!replyingTo) return null;

  return (
    <div className={`px-3 py-2 rounded-t-lg flex justify-between items-start border-l-4 border-indigo-500 ${
      darkMode ? 'bg-neutral-800' : 'bg-gray-100'
    }`}>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium mb-1 ${
          darkMode ? 'text-indigo-400' : 'text-indigo-600'
        }`}>
          Replying to {replyingTo.sender_id === currentUserId ? 'yourself' : 'message'}
        </div>
        <div className={`text-sm truncate ${
          darkMode ? 'text-neutral-300' : 'text-gray-600'
        }`}>
          {replyingTo.text}
        </div>
      </div>
      
      <button
        onClick={onCancel}
        className={`ml-2 p-1 rounded-full transition-colors ${
          darkMode 
            ? 'hover:bg-neutral-700 text-neutral-400' 
            : 'hover:bg-gray-200 text-gray-500'
        }`}
        aria-label="Cancel reply"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ReplyPreview;
