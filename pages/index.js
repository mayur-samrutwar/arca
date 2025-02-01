import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground`}>
      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold">arca</h1>
            <div className="hidden sm:flex items-center gap-6 text-sm">
              <div>Active Agents: <span className="font-mono">247</span></div>
              <div>Evolution Cycle: <span className="font-mono">#1,337</span></div>
              <div>$EVO Price: <span className="font-mono">Ξ 0.05</span></div>
            </div>
          </div>
          <button className="px-4 py-2 rounded-full bg-foreground text-background text-sm hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex gap-8">
        {/* Simulation View */}
        <main className="flex-1">
          <div className="aspect-video w-full bg-black/5 dark:bg-white/5 rounded-lg mb-6 flex items-center justify-center">
            <p className="text-sm text-black/50 dark:text-white/50">Simulation Viewport</p>
          </div>
          
          {/* Control Panel */}
          <div className="grid grid-cols-3 gap-4">
            <button className="p-4 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <h3 className="font-medium mb-1">Spawn Agent</h3>
              <p className="text-xs text-black/50 dark:text-white/50">Deploy new AI agent</p>
            </button>
            <button className="p-4 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <h3 className="font-medium mb-1">Evolution Arena</h3>
              <p className="text-xs text-black/50 dark:text-white/50">View active competitions</p>
            </button>
            <button className="p-4 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <h3 className="font-medium mb-1">Agent Market</h3>
              <p className="text-xs text-black/50 dark:text-white/50">Trade genetic NFTs</p>
            </button>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-80 hidden lg:block">
          <div className="sticky top-8">
            <div className="p-4 rounded-lg border border-black/10 dark:border-white/10 mb-4">
              <h2 className="font-medium mb-4">Top Agents</h2>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded bg-black/5 dark:bg-white/5"></div>
                    <div>
                      <div className="font-medium">Agent #{i}</div>
                      <div className="text-xs text-black/50 dark:text-white/50">Gen 5 • DeFi Trader</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-black/10 dark:border-white/10">
              <h2 className="font-medium mb-4">Evolution Stats</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-black/50 dark:text-white/50">Survival Rate</span>
                  <span className="font-mono">67%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/50 dark:text-white/50">Mutation Rate</span>
                  <span className="font-mono">12%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/50 dark:text-white/50">Active DAOs</span>
                  <span className="font-mono">7</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
