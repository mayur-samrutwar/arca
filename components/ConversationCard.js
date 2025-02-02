import { useEffect, useState } from 'react';

export default function ConversationCard({ conversation, position, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % conversation.messages.length;
        if (next === 0 && Date.now() - startTime >= 30000) {
          onClose();
        }
        return next;
      });
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, [conversation, onClose, startTime]);

  const currentMessage = conversation.messages[currentIndex];

  return (
    <div 
      className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-72 transform -translate-y-24"
      style={{
        left: `${position.x * 32}px`,
        top: `${position.y * 32}px`,
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-sm">{currentMessage.speaker}</span>
        <span className="text-xs text-gray-500">
          {Math.max(0, Math.floor((30000 - (Date.now() - startTime)) / 1000))}s
        </span>
      </div>
      
      <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mb-2">
        <p className="text-sm mb-1">{currentMessage.message}</p>
        <p className="text-xs text-gray-500 italic">*{currentMessage.action}*</p>
      </div>
      
      <div className="flex justify-center gap-2">
        {conversation.messages.map((_, idx) => (
          <div 
            key={idx}
            className={`w-1.5 h-1.5 rounded-full ${
              idx === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}