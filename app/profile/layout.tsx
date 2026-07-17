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
  const [mode, setMode] = useState<'signup' | 'login'>('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
    if (!email ||!password) return alert('Fill all fields')
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

  if (loading) return <div className="p-10 text-center">Loading profile...</div>

  if (user) return <>{children}</>

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-[90%] max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-3 text-center">Login to Profile</h2>
        <div className="flex mb-3 border-b">
          <button onClick={() => setMode('signup')} className={`flex-1 p-2 ${mode==='signup'?'font-bold border-b-2 border-blue-600':''}`}>Sign Up</button>
          <button onClick={() => setMode('login')} className={`flex-1 p-2 ${mode==='login'?'font-bold border-b-2 border-blue-600':''}`}>Login</button>
        </div>
        <>
          {mode === 'signup' && <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="border w-full p-3 mb-3 rounded-md"/>}
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="border w-full p-3 mb-3 rounded-md"/>
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border w-full p-3 mb-3 rounded-md"/>
          <button onClick={submit} className="bg-blue-600 text-white font-semibold w-full p-3 rounded">Continue</button>
        </>
      </div>
    </div>
  )
}