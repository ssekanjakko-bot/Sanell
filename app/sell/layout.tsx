'use client'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
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

  if (loading) return <div className="p-8 text-center bg-white min-h-screen">Loading...</div>

  // IF LOGGED IN: Show header like your screenshot + your existing sell page
  if(user){
    return (
      <div className="min-h-screen bg-gray-50">
        {/* HEADER EXACTLY LIKE SCREENSHOT */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0">
          <p className="text-amber-900 font-semibold">Welcome, {user.displayName || 'Seller'}</p>
          <button onClick={handleLogout} className="text-amber-900 font-semibold">Logout</button>
        </header>
        
        {/* YOUR EXISTING SELL PAGE CONTENT GOES HERE */}
        <main className="p-4">{children}</main>
      </div>
    )
  }

  // IF NOT LOGGED IN: Show the brown login card from previous message
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-amber-900 rounded-xl p-5 shadow-2xl">

        <div className="bg-green-900/30 border border-green-700 text-green-200 text-xs rounded p-3 mb-4 text-center">
          🔒 Secure Login. Your data is encrypted and protected by Sanel Uganda
        </div>

        <div className="text-white text-center">Please login from your sell page</div>
        {/* OR paste the full login form here if you want layout to handle it */}
      </div>
    </div>
  )
}