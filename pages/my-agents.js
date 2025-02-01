import { useState } from 'react';

export default function MyAgents() {
  const [agents] = useState([
    {
      id: 1,
      name: "Market Maker Bot",
      status: "active",
      lastActive: "2024-03-20T10:30:00",
      performance: "+2.5%",
    },
    {
      id: 2,
      name: "Trading Bot Alpha",
      status: "paused",
      lastActive: "2024-03-19T15:45:00",
      performance: "+1.8%",
    },
    {
      id: 3,
      name: "Arbitrage Scanner",
      status: "inactive",
      lastActive: "2024-03-18T09:15:00",
      performance: "-0.3%",
    },
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Agents</h1>
        <button className="px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          Create New Agent
        </button>
      </div>

      <div className="grid gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-4 rounded-lg border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{agent.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    agent.status === 'active' ? 'bg-green-500' :
                    agent.status === 'paused' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="text-sm text-foreground/70 capitalize">{agent.status}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${
                  agent.performance.startsWith('+') ? 'text-green-500' : 'text-red-500'
                }`}>
                  {agent.performance}
                </p>
                <p className="text-sm text-foreground/70">
                  Last active: {new Date(agent.lastActive).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/10 rounded-full hover:border-black/20 dark:hover:border-white/20 transition-colors">
                Edit
              </button>
              <button className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/10 rounded-full hover:border-black/20 dark:hover:border-white/20 transition-colors">
                View Details
              </button>
              {agent.status === 'active' ? (
                <button className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/10 rounded-full hover:border-black/20 dark:hover:border-white/20 transition-colors">
                  Pause
                </button>
              ) : (
                <button className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/10 rounded-full hover:border-black/20 dark:hover:border-white/20 transition-colors">
                  Start
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
