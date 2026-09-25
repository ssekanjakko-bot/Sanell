'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import Link from 'next/link'
import { ShieldCheck, LogOut, ArrowRight, User, Mail, Phone, Lock } from 'lucide-react'

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

  if (loading) return (
    <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  // IF LOGGED IN
  if(user){
    return (
      <div className="min-h-screen bg-[#FDF8F3]">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b">
          <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-black text-[13px]">{user.displayName?.[0] || 'S'}</div>
              <div>
                <p className="font-black text-[13px] leading-none">Hi, {user.displayName || 'Seller'}</p>
                <p className="text-[11px] text-gray-500">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-[12px] font-bold hover:bg-zinc-800 transition"><LogOut size={14}/> Logout</button>
          </div>
        </header>
        <main>{children}</main>
      </div>
    )
  }

  // MODERN LOGIN
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* glow bg */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-amber-400/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-[420px] relative">
        {/* logo */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto font-black">S</div>
          <h1 className="text-white font-black text-[20px] mt-3 tracking-tight">Sanel Uganda</h1>
          <p className="text-white/50 text-[12px]">Official Seller Portal • sanel-ug.online</p>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-2xl">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold rounded-full px-3 py-2 mb-5">
            <ShieldCheck size={14}/> Secure login • Encrypted • Protected
          </div>

          <div className="flex bg-[#FDF8F3] p-1 rounded-full mb-6">
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 rounded-full text-[13px] font-black transition ${!isLogin? 'bg-black text-white shadow' : 'text-gray-500'}`}>Sign Up</button>
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 rounded-full text-[13px] font-black transition ${isLogin? 'bg-black text-white shadow' : 'text-gray-500'}`}>Login</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin &&
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#FDF8F3] focus:bg-white border border-transparent focus:border-black outline-none pl-11 pr-4 py-3.5 rounded-full text-[14px] font-medium placeholder:text-gray-400 transition" required />
              </div>
            }

            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-[#FDF8F3] focus:bg-white border border-transparent focus:border-black outline-none pl-11 pr-4 py-3.5 rounded-full text-[14px] font-medium placeholder:text-gray-400 transition" required />
            </div>

            {!isLogin && (
              <div className="flex gap-2">
                <div className="bg-black text-white px-4 py-3.5 rounded-full font-black text-[13px] flex items-center">+256</div>
                <div className="relative flex-1">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input placeholder="77XXXXXXX" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-[#FDF8F3] focus:bg-white border border-transparent focus:border-black outline-none pl-11 pr-4 py-3.5 rounded-full text-[14px] font-medium placeholder:text-gray-400 transition" required />
                </div>
              </div>
            )}

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-[#FDF8F3] focus:bg-white border border-transparent focus:border-black outline-none pl-11 pr-4 py-3.5 rounded-full text-[14px] font-medium placeholder:text-gray-400 transition" required />
            </div>

            <button type="submit" className="w-full bg-black hover:bg-zinc-800 text-white font-black py-4 rounded-full text-[14px] flex items-center justify-center gap-2 transition">
              Continue <ArrowRight size={16}/>
            </button>
          </form>

          {isLogin && (
            <p onClick={handleForgot} className="text-center text-[12px] font-bold mt-4 cursor-pointer underline">Forgot Password?</p>
          )}

          <div className="mt-6 pt-5 border-t text-center">
            <p className="text-[11px] text-gray-400">© 2026 Sanel Uganda • Campus Marketplace</p>
            <div className="flex justify-center gap-4 mt-2 text-[11px] font-bold">
              <Link href="/privacy" className="underline">Privacy</Link>
              <Link href="/terms" className="underline">Terms</Link>
              <Link href="/support" className="underline">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}