'use client'
import { useState, useEffect, type ReactNode } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(false)
      if(u) {
        await setDoc(doc(db, "users", u.uid), {
          name: u.displayName || name || u.email?.split('@')[0],
          email: u.email,
        }, { merge: true });
      }
    })
    return () => unsub()
  }, [name])

  const submit = async () => {
    if (!email ||!password ||!phone) return alert('Fill all fields')
    if (mode === 'signup' &&!name) return alert('Enter name')
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: name })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"/></div>

  if (user) return <>{children}</>

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex items-center justify-center p-4">
      {/* glow */}
      <div className="absolute top-[-15%] left-[-15%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-[400px] relative">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mx-auto font-black text-xl">S</div>
          <h2 className="text-white font-black text-[20px] mt-3">Welcome to Sanel</h2>
          <p className="text-white/50 text-[12px] font-medium">Join to buy & sell on campus</p>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-2xl">
          <div className="flex items-center gap-2 bg-black text-white text-[11px] font-black rounded-full px-3 py-2 mb-5 justify-center">
            <ShieldCheck size={14}/> Secure • Encrypted • Verified Sellers
          </div>

          <div className="flex bg-gray-100 p-1 rounded-full mb-6">
            <button onClick={() => setMode('signup')} className={`flex-1 py-2.5 rounded-full text-[13px] font-black transition ${mode==='signup'?'bg-black text-white shadow':'text-gray-500'}`}>Sign Up</button>
            <button onClick={() => setMode('login')} className={`flex-1 py-2.5 rounded-full text-[13px] font-black transition ${mode==='login'?'bg-black text-white shadow':'text-gray-500'}`}>Login</button>
          </div>

          <div className="space-y-3">
            {mode === 'signup' &&
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-white border border-gray-300 focus:border-black text-black font-bold outline-none pl-11 pr-4 py-3.5 rounded-full text-[14px] placeholder:text-gray-500" />
              </div>
            }

            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-white border border-gray-300 focus:border-black text-black font-bold outline-none pl-11 pr-4 py-3.5 rounded-full text-[14px] placeholder:text-gray-500" />
            </div>

            <div className="flex gap-2">
              <div className="bg-black text-white px-4 py-3.5 rounded-full font-black text-[13px] flex items-center">+256</div>
              <div className="relative flex-1">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input placeholder="77XXXXXXX" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-white border border-gray-300 focus:border-black text-black font-bold outline-none pl-11 pr-4 py-3.5 rounded-full text-[14px] placeholder:text-gray-500" />
              </div>
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input placeholder="Password" type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-white border border-gray-300 focus:border-black text-black font-bold outline-none pl-11 pr-12 py-3.5 rounded-full text-[14px] placeholder:text-gray-500" />
              <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-black">
                {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>

            <button onClick={submit} className="w-full bg-black hover:bg-zinc-800 text-white font-black py-4 rounded-full text-[14px] flex items-center justify-center gap-2 transition">
              Continue <ArrowRight size={16}/>
            </button>
          </div>

          <p className="text-center text-[11px] text-gray-500 font-bold mt-5">© 2026 Sanel Uganda • sanel-ug.online</p>
        </div>
      </div>
    </div>
  )
}