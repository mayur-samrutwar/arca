import { useState, useRef, useEffect } from 'react';

export default function AgentChat({ isExpanded }) {
  const [messages, setMessages] = useState([
    {
      type: 'agent',
      content: "Hello! I'm your AI agent. I'll keep you updated on your deployments and answer any questions you have.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: input,
      timestamp: new Date(),
    }]);

    // Simulate agent response (replace with actual agent logic)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'agent',
        content: 'I received your message. This is a placeholder response. Integration with actual agent responses pending.',
        timestamp: new Date(),
      }]);
    }, 1000);

    setInput('');
  };

  if (!isExpanded) {
    return (
      <div className="h-full bg-background border-l border-black/10 dark:border-white/10">
        {/* Minimized view - optional: can show unread message count or status */}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background border-l border-black/10 dark:border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-black/10 dark:border-white/10">
        <h2 className="font-medium">Agent Chat</h2>
        <div className="flex items-center gap-2 text-sm text-foreground/70">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Online
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.type === 'user'
                ? 'bg-foreground text-background'
                : 'bg-black/5 dark:bg-white/5'
            }`}>
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-black/10 dark:border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-black/5 dark:bg-white/5 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}