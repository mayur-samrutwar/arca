import Link from 'next/link';
import { useRouter } from 'next/router';
import { Geist } from 'next/font/google';
import Navbar from './Navbar';


const geist = Geist({ subsets: ['latin'] });

export default function Layout({ children }) {
  const router = useRouter();
  
  const isActivePath = (path) => {
    return router.pathname === path;
  };

  return (
    <div className={`${geist.className} min-h-screen bg-white`}>
     <Navbar />

      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  );
}