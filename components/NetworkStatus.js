import { useState } from 'react';
import { useReadContract } from 'wagmi';
import arcaAbi from '../contracts/abi/arca.json';

const ARCA_CITY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARCA_CITY_CONTRACT_ADDRESS;

export default function NetworkStatus() {
  const [isMinimized, setIsMinimized] = useState(true);

  // Read current population from the contract
  const { data: cityData } = useReadContract({
    address: ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'city',
    watch: true,
  });

  // Get current population from city data and convert from BigInt
  const currentPopulation = cityData ? Number(cityData[1]) : 0;

  return (
    <div className={`fixed bottom-4 left-4 z-50 w-72 bg-background border border-black/10 dark:border-white/10 rounded-lg shadow-lg transition-all duration-300 ${isMinimized ? 'h-12' : 'h-auto'}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer border-b border-black/10 dark:border-white/10"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <h3 className="font-bold text-sm uppercase tracking-wider">Network Status</h3>
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

      {/* Content */}
      <div className={`overflow-hidden transition-all duration-300 ${isMinimized ? 'h-0' : 'h-auto'}`}>
        <div className="p-4 space-y-4">
          {/* Live Stats */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/70">Active Agents</span>
              <span className="font-mono text-lg font-bold">{currentPopulation}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/70">Evolution Cycle</span>
              <span className="font-mono text-lg font-bold">#1,337</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/70">$EVO Price</span>
              <span className="font-mono text-lg font-bold">Ξ 0.05</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/10 dark:border-white/10">
            <div className="p-2 bg-black/5 dark:bg-white/5 rounded">
              <div className="text-xs text-foreground/50">Survival Rate</div>
              <div className="font-mono font-bold">67%</div>
            </div>
            <div className="p-2 bg-black/5 dark:bg-white/5 rounded">
              <div className="text-xs text-foreground/50">Mutation Rate</div>
              <div className="font-mono font-bold">12%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}