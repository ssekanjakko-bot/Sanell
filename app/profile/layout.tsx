'use client'
import { useState, useEffect, type ReactNode } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  updateProfile, onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'signup' | 'login'>('signup')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

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

  if (loading) return <div className="p-10 text-center text-white">Loading profile...</div>

  if (user) return <>{children}</>

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="bg-[#7C2D12] p-5 rounded-lg w-[90%] max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-center text-white">Welcome to Sanel</h2>
        
        <div className="flex mb-4 text-white border-b border-[#C2410C]">
          <button 
            onClick={() => setMode('signup')} 
            className={`flex-1 p-2 text-center ${mode==='signup'?'font-bold border-b-2 border-white':''}`}
          >
            SignUp
          </button>
          <button 
            onClick={() => setMode('login')} 
            className={`flex-1 p-2 text-center ${mode==='login'?'font-bold border-b-2 border-white':''}`}
          >
            Login
          </button>
        </div>

        <div className="space-y-3">
          {mode === 'signup' && 
            <input 
              placeholder="Name" 
              value={name} 
              onChange={e=>setName(e.target.value)} 
              className="bg-[#FFFBEB] text-[#7C2D12] placeholder-[#C2410C] w-full p-3 rounded-md outline-none"
            />
          }
          
          <input 
            placeholder="Email" 
            type="email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            className="bg-[#7C2D12] border-[#C2410C] text-[#FFFBEB] placeholder-[#C2410C] w-full p-3 rounded-md outline-none"
          />

          <div className="flex bg-[#FFFBEB] rounded-md overflow-hidden">
            <span className="px-3 py-3 text-[#7C2D12] font-bold">+256</span>
            <input 
              placeholder="77XXXXXXX" 
              value={phone} 
              onChange={e=>setPhone(e.target.value)} 
              className="bg-transparent text-[#7C2D12] placeholder-gray-500 w-full p-3 outline-none"
            />
          </div>
          
          <input 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            className="bg-[#FFFBEB] text-[#7C2D12] placeholder-[#C2410C] w-full p-3 rounded-md outline-none"
          />
          
          <button 
            onClick={submit} 
            className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold w-full p-3 rounded-md transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}