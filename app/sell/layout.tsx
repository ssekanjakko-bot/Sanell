'use client'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth'
import Link from 'next/link'

export default function SellLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
  }

  if (loading) return <div className="p-8 text-center bg-black min-h-screen text-white">Loading...</div>

  // 1. IF LOGGED IN: Show header + your existing sell/page.tsx
  if(user){
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="bg-amber-900 p-4 flex justify-between items-center shadow-lg sticky top-0">
          <h1 className="text-lg font-bold">Welcome, {user.displayName || 'Seller'} 👋</h1>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold">Logout</button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    )
  }

  // 2. IF NOT LOGGED IN: Just show your existing sell/page.tsx centered on black
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      {children}
    </div>
  )
}