import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';


// Dynamically import WalletWrapper with SSR disabled
const WalletWrapper = dynamic(() => import('./WalletWrapper'), {
  ssr: false
});

export default function Navbar() {
  return (
    <nav className="w-full border-b border-black/10 dark:border-white/10 bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left section: Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          EvoNet
        </Link>
        
        {/* Center section: Primary Navigation */}
        <div className="flex items-center gap-8">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Deploy
          </button>
          
          <Link 
            href="/my-agents" 
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            My Agents
          </Link>
          
          <Link 
            href="/news" 
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            News
          </Link>
        </div>
        
        {/* Right section: Wallet */}
        <WalletWrapper 
          text="Connect Wallet"
          className="px-4 py-2 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-sm font-medium transition-colors"
        />
      </div>
    </nav>
  );
}