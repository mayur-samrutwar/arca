import { useState } from "react";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import NetworkStatus from "@/components/NetworkStatus";
import CitySimulation from '@/components/CitySimulation';
import AgentChat from '@/components/AgentChat';
import { useAccount } from 'wagmi';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground`}>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <main className="flex-1">
          <CitySimulation />
        </main>
      </div>

      {/* Network Status */}
      <NetworkStatus />
      
      {/* Agent Chat */}
      {isConnected && <AgentChat />}
    </div>
  );
}
