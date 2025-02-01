import { useState } from "react";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import NetworkStatus from "@/components/NetworkStatus";
import CitySimulation from '@/components/CitySimulation';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [isStatsMinimized, setIsStatsMinimized] = useState(false);

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground`}>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex gap-8">
        <main className="flex-1">
          <CitySimulation />
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

      <NetworkStatus />
    </div>
  );
}
