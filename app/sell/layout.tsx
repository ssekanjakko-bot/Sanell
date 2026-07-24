'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import Link from 'next/link'

export default function SellLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLogin, setIsLogin] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      if(u && pathname === '/sell') router.push('/sell/dashboard')
    })
    return () => unsub()
  }, [router, pathname])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      if(isLogin){
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: name })
        await setDoc(doc(db, 'sellers', cred.user.uid), {
          name, email, phone: `+256${phone}`, createdAt: new Date()
        })
      }
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleForgot = async () => {
    if(!email) return alert('Enter your email first')
    try {
      await sendPasswordResetEmail(auth, email)
      alert('Password reset link sent to your email ✅')
    } catch(e: any) {
      alert(e.message)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/sell')
  }

  if (loading) return <div className="p-8 text-center bg-black min-h-screen text-white">Loading...</div>

  // 1. POLICY PAGES - ALL IN ONE
  if(pathname === '/sell/privacy') return <PolicyPage title="Privacy Policy - Sanel Uganda" content="Sanel Uganda respects your privacy. We collect name, email and phone only to manage your seller account on sanel-ug.online. Your data is stored securely in Firebase and never shared with third parties. Contact: support@sanel-ug.online" />
  if(pathname === '/sell/terms') return <PolicyPage title="Terms of Service" content="By using Sanel Uganda seller portal you agree to list genuine products only. We reserve the right to suspend accounts for fraud. All transactions are between buyer and seller." />
  if(pathname === '/sell/contact') return <PolicyPage title="Contact Sanel Uganda" content="Email: support@sanel-ug.online \n Phone: +256 7XXXXXXXX \n Location: Kampala, Uganda \n Website: https://sanel-ug.online" />

  // 2. DASHBOARD WITH WELCOME + LOGOUT - ALL IN ONE
  if(user && pathname.startsWith('/sell/dashboard')){
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="bg-amber-900 p-4 flex justify-between items-center shadow-lg">
          <h1 className="text-lg font-bold">Welcome, {user.displayName || 'Seller'} 👋</h1>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold">Logout</button>
        </header>
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-4">Your Seller Dashboard</h2>
          <p>Manage your products, orders, and profile here.</p>
          {children}
        </main>
      </div>
    )
  }

  // 3. LOGIN FORM - FULL SCREEN LIKE YOUR SCREENSHOT
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-amber-900 rounded-xl p-5 shadow-2xl">

        <div className="bg-green-900/30 border border-green-700 text-green-200 text-xs rounded p-2 mb-4 text-center flex items-center justify-center gap-1">
          🔒 Secure Login. Your data is encrypted and protected by Sanel Uganda
        </div>

        <div className="flex mb-4 border-b border-amber-800">
          <button onClick={() => setIsLogin(false)} className={`flex-1 pb-2 text-white ${!isLogin? 'border-b-2 border-white font-bold' : ''}`}>SignUp</button>
          <button onClick={() => setIsLogin(true)} className={`flex-1 pb-2 text-white ${isLogin? 'border-b-2 border-white font-bold' : ''}`}>Login</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 rounded bg-amber-50 text-amber-800 placeholder-amber-700 outline-none" required />}
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 rounded bg-amber-800 text-white placeholder-amber-400 border border-amber-700 outline-none" required />
          {!isLogin && (
            <div className="flex rounded bg-amber-50">
              <span className="p-3 text-amber-800 font-bold">+256</span>
              <input placeholder="77XXXXXXX" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="flex-1 p-3 bg-transparent text-amber-800 placeholder-gray-500 outline-none" required />
            </div>
          )}
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 rounded bg-amber-50 text-amber-800 placeholder-amber-700 outline-none" required />
          <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-3 rounded">Continue</button>
        </form>

        {isLogin && (
          <p onClick={handleForgot} className="text-center text-sm text-amber-200 underline mt-3 cursor-pointer">Forgot Password?</p>
        )}

        <div className="text-center text-xs text-amber-200 mt-4 space-y-1">
          <p>© 2026 Sanel Uganda. All rights reserved.</p>
          <div className="flex justify-center gap-3">
            <Link href="/sell/privacy" className="underline">Privacy Policy</Link>
            <Link href="/sell/terms" className="underline">Terms</Link>
            <Link href="/sell/contact" className="underline">Contact Us</Link>
          </div>
          <p className="mt-2">This is the official seller portal for sanel-ug.online</p>
        </div>
      </div>
    </div>
  )
}

// REUSABLE POLICY COMPONENT - INSIDE SAME FILE
function PolicyPage({ title, content }: { title: string, content: string }) {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/sell" className="text-orange-500 underline mb-4 block">← Back to Login</Link>
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="whitespace-pre-line">{content}</p>
      </div>
    </div>
  )
}