import { useState, useRef, useEffect } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import arcaAbi from '../contracts/abi/arca.json';

const ARCA_CITY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARCA_CITY_CONTRACT_ADDRESS;

export default function AgentChat() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { address } = useAccount();

  // Get agent IDs
  const { data: myAgentIds } = useReadContract({
    address: ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'getMyAgents',
    account: address,
    watch: true,
  });

  // Get first agent's info
  const { data: agentInfo } = useReadContract({
    address: ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'getAgentInfo',
    args: myAgentIds?.[0] ? [myAgentIds[0]] : undefined,
    enabled: Boolean(myAgentIds?.length),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (agentInfo) {
      // Add initial message when agent info is loaded
      setMessages([{
        type: 'agent',
        content: `Hello! I'm your AI agent ${agentInfo[0]}. I'll help you manage your ARCA tokens.`,
        timestamp: new Date(),
      }]);
    }
  }, [agentInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !agentInfo) return;

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: input,
      timestamp: new Date(),
    }]);

    try {
      const privateKey = agentInfo[11];
      const agentAddress = agentInfo[1];

      // Debug logs
      console.log('Agent Details:', {
        address: agentAddress,
        privateKey: privateKey,
        message: input
      });

      // Call our API endpoint
      const response = await fetch('/api/chat-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          privateKey: privateKey,
          agentAddress: agentAddress,
        })
      });

      const data = await response.json();

      // Log API response
      console.log('API Response:', data);

      // Add agent response
      setMessages(prev => [...prev, {
        type: 'agent',
        content: data.success 
          ? `Successfully executed ${data.action}. Transaction hash: ${data.result}`
          : `Sorry, there was an error: ${data.error}`,
        timestamp: new Date(),
      }]);

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setMessages(prev => [...prev, {
        type: 'agent',
        content: `Sorry, there was an error: ${error.message}`,
        timestamp: new Date(),
      }]);
    }

    setInput('');
  };

  // Show loading or no agent state
  if (!agentInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border border-black/10 dark:border-white/10 rounded-lg shadow-lg p-4">
        {!address ? "Please connect your wallet" : "Loading your agent..."}
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-80 bg-background border border-black/10 dark:border-white/10 rounded-lg shadow-lg transition-all duration-300 ${isMinimized ? 'h-12' : 'h-[500px]'}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer border-b border-black/10 dark:border-white/10"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <h3 className="font-bold text-sm uppercase tracking-wider">My Agent</h3>
        </div>
        <button className="text-foreground/50 hover:text-foreground transition-colors">
          {isMinimized ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 15.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Messages and Input */}
      <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'h-0' : 'h-[calc(500px-48px)]'}`}>
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
    </div>
  );
}