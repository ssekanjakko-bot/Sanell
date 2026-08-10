'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth'
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

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
      setName(''); setEmail(''); setPhone(''); setPassword('')
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
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

  if (loading) return <div className="p-8 text-center bg-black min-h-screen text-white">Loading...</div>

  // IF LOGGED IN: Show header + your sell/page.tsx
  if(user){
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 shadow-sm">
          <p className="text-amber-900 font-semibold">Welcome, {user.displayName || 'Seller'}</p>
          <button onClick={handleLogout} className="text-amber-900 font-semibold hover:underline">Logout</button>
        </header>
        <main className="p-4">{children}</main>
      </div>
    )
  }

  // IF NOT LOGGED IN: EXACT LOGIN CARD WITH WORKING LINKS
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-amber-900 rounded-xl p-5 shadow-2xl">

        <div className="bg-green-900/30 border border-green-700 text-green-200 text-xs rounded-lg p-3 mb-4 text-center flex items-center justify-center gap-2">
          🔒 Secure Login. Your data is encrypted and protected by Sanel Uganda
        </div>

        <div className="flex mb-4 border-b border-amber-800">
          <button onClick={() => setIsLogin(false)} className={`flex-1 pb-2 text-white ${!isLogin? 'border-b-2 border-white font-bold' : ''}`}>SignUp</button>
          <button onClick={() => setIsLogin(true)} className={`flex-1 pb-2 text-white ${isLogin? 'border-b-2 border-white font-bold' : ''}`}>Login</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && 
            <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 rounded bg-amber-50 text-amber-900 placeholder-amber-700 outline-none" required />
          }
          
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 rounded bg-amber-800 text-white placeholder-amber-300 outline-none" required />
          
          {!isLogin && (
            <div className="flex rounded bg-amber-50">
              <span className="p-3 text-amber-900 font-bold">+256</span>
              <input placeholder="77XXXXXXX" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="flex-1 p-3 bg-transparent text-amber-900 placeholder-gray-500 outline-none" required />
            </div>
          )}
          
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 rounded bg-amber-50 text-amber-900 placeholder-amber-700 outline-none" required />
          
          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-3 rounded">Continue</button>
        </form>

        {isLogin && (
          <p onClick={handleForgot} className="text-center text-sm text-amber-200 underline mt-3 cursor-pointer">Forgot Password?</p>
        )}

        {/* WORKING FOOTER LINKS */}
        <div className="text-center text-xs text-amber-200 mt-4 space-y-1">
          <p>© 2026 Sanel Uganda. All rights reserved.</p>
          <div className="flex justify-center gap-3 underline">
            <Link href="/sell/privacy">Privacy Policy</Link>
            <Link href="/sell/terms">Terms</Link>
            <Link href="contact">Contact Us</Link>
          </div>
          <p>This is the official seller portal for sanel-ug.online</p>
        </div>
      </div>
    </div>
  )
}