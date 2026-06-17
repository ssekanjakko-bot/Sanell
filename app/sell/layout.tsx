'use client'
import { useEffect, useRef, useState } from 'react'
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, linkWithPhoneNumber, RecaptchaVerifier, signOut, User } from 'firebase/auth'
import { app } from '@/lib/firebase'

const auth = getAuth(app)

export default function SellLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<'form' | 'otp'>('form')
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [confirmResult, setConfirmResult] = useState<any>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, s
  const [otp, setOtp] = useState('')

  // 1. Check if user is already logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return () => unsub()
  }, [])

  // 2. Create reCAPTCHA once
  useEffect(() => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha', { size: 'invisible' })
    }
  }, [])

  const sendCode = async () => {
    if (!email || !password || !phone) return alert('Fill email, password, phone')
    if (mode === 'signup' && !name) return alert('Enter name')

    const fullPhone = `+256${phone.replace(/\D/g, '')}`
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: name })
        const conf = await linkWithPhoneNumber(cred.user, fullPhone, recaptchaRef.current!)
        setConfirmResult(conf)
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        if (!cred.user.phoneNumber) {
          const conf = await linkWithPhoneNumber(cred.user, fullPhone, recaptchaRef.current!)
          setConfirmResult(conf)
        } else {
          return // already has phone, go to sale page
        }
      }
      setPage('otp')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const checkOtp = async () => {
    try {
      await confirmResult.confirm(otp)
      await auth.currentUser?.reload()
      setUser(auth.currentUser) // This shows the sale page
    } catch (err: any) {
      alert('Wrong OTP')
    }
  }

  // Logged in: Show Welcome + your sale page. page.tsx untouched
  if (user) {
    return (
      <>
        <div id="recaptcha"></div>
        <div className="p-3 border-b flex justify-between bg-white">
          <b>Welcome, {user.displayName}</b>
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
        {children}
      </>
    )
  }

  // Not logged in: Show popup
  return (
    <>
      <div id="recaptcha"></div>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-4 rounded w-80">
          <div className="flex gap-4 mb-3">
            <button onClick={() => {setMode('signup'); setPage('form')}} className={mode==='signup'?'font-bold':''}>SignUp</button>
            <button onClick={() => {setMode('login'); setPage('form')}} className={mode==='login'?'font-bold':''}>Login</button>
          </div>

          {page === 'form' ? (
            <>
              {mode === 'signup' && <input placeholder="Name" className="border w-full mb-2 p-2" value={name} onChange={e=>setName(e.target.value)}/>}
              <input placeholder="Email" className="border w-full mb-2 p-2" value={email} onChange={e=>setEmail(e.target.value)}/>
              <input placeholder="77XXXXXXX" className="border w-full mb-2 p-2" value={phone} onChange={e=>setPhone(e.target.value)}/>
              <input placeholder="Password" type="password" className="border w-full mb-2 p-2" value={password} onChange={e=>setPassword(e.target.value)}/>
              <button onClick={sendCode} className="bg-blue-600 text-white w-full p-2">Continue</button>
            </>
          ) : (
            <>
              <input placeholder="OTP" className="border w-full mb-2 p-2" value={otp} onChange={e=>setOtp(e.target.value)}/>
              <button onClick={checkOtp} className="bg-green-600 text-white w-full p-2">Verify</button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
