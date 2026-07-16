'use client'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  updateProfile, linkWithPhoneNumber, RecaptchaVerifier, signOut, User, onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'signup' | 'login'>('login')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [confirm, setConfirm] = useState<any>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  // 1. Check if already logged in from Sell
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(false)
      if(u) {
        // Save to firestore if new
        await setDoc(doc(db, "users", u.uid), {
          name: u.displayName || u.email?.split('@')[0],
          email: u.email,
          photo: u.photoURL || "",
          phone: u.phoneNumber || "",
        }, { merge: true });
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-profile', { 'size': 'invisible' })
    }
  }, [])

  const phoneFull = `+256${phone.replace(/\D/g, '')}`

  const submit = async () => {
    if (!email ||!password ||!phone) return alert('Fill all fields')
    if (mode === 'signup' &&!name) return alert('Enter name')
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: name })
        const c = await linkWithPhoneNumber(cred.user, phoneFull, recaptchaRef.current!)
        setConfirm(c)
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        if (!cred.user.phoneNumber) {
          const c = await linkWithPhoneNumber(cred.user, phoneFull, recaptchaRef.current!)
          setConfirm(c)
        } else return
      }
      setStep('otp')
    } catch (e: any) {
      alert(e.message)
    }
  }

  const verify = async () => {
    try {
      await confirm.confirm(otp)
      await auth.currentUser?.reload()
      setUser(auth.currentUser)
    } catch (e: any) {
      alert('Wrong OTP')
    }
  }

  if (loading) return <p className="p-10 text-center">Loading...</p>

  // 2. If already logged in from Sell, just show profile
  if (user) {
    return <>{children}</>
  }

  // 3. If not logged in, show the login form here
  return (
    <>
      <div id="recaptcha-profile"></div>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg w-[90%] max-w-sm shadow-lg">
          <h2 className="text-xl font-bold mb-3 text-center">Login to see Profile</h2>
          <div className="flex mb-3">
            <button onClick={() => {setMode('signup'); setStep('form')}} className={`flex-1 p-2 ${mode==='signup'?'font-bold border-b-2':''}`}>Sign Up</button>
            <button onClick={() => {setMode('login'); setStep('form')}} className={`flex-1 p-2 ${mode==='login'?'font-bold border-b-2':''}`}>Login</button>
          </div>

          {step === 'form'? (
            <>
              {mode === 'signup' && <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="border w-full p-3 mb-3 rounded-md"/>}
              <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="border w-full p-3 mb-3 rounded-md"/>
              <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border w-full p-3 mb-3 rounded-md"/>
              <input placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} className="border w-full p-3 mb-3 rounded-md"/>
              <button onClick={submit} className="bg-blue-600 text-white font-semibold w-full p-3 rounded">Continue</button>
            </>
          ) : (
            <>
              <input placeholder="Enter OTP" value={otp} onChange={e=>setOtp(e.target.value)} className="border w-full p-3 mb-3 rounded-md"/>
              <button onClick={verify} className="bg-blue-600 text-white font-semibold w-full p-3 rounded">Verify</button>
            </>
          )}
        </div>
      </div>
    </>
  )
}