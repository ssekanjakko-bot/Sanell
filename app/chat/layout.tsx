"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ChatLayout({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  
  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {children}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto h-16">
          <Link href="/" className={`flex flex-col items-center ${pathname === "/" ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="text-2xl">🏠</span>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/chat" className={`flex flex-col items-center ${pathname === "/chat" ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-bold">Pulse</span>
          </Link>
          <button 
            onClick={() => document.getElementById('postModal')?.classList.remove('hidden')}
            className="flex flex-col items-center text-gray-400"
          >
            <span className="text-2xl">🤣</span>
            <span className="text-xs">Post</span>
          </button>
          <Link href="/profile" className={`flex flex-col items-center ${pathname === "/profile" ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="text-2xl">👤</span>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}