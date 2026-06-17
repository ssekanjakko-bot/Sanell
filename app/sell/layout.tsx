'use client'
import { useEffect, useRef, useState } from 'react'
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, linkWithPhoneNumber, RecaptchaVerifier, updateProfile, signOut, onAuthStateChanged, User } from '@/lib/firebase'

export default function SellLayout({ children }: { children: React.ReactNode }) {
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [busy, setBusy] = useState(false)
  const [confirmation, setConfirmation] = useState<any>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  // 1. Firebase remembers the account: name, email, phone, password
  useEffect(() => {
    const stop = onAuthStateChanged(auth, u => {
      setUser(u) 
      setReady(true)
    })
    return () => stop()
  }, [])

  // 2. reCAPTCHA once only
  useEffect(() => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
    }
    return () => { try { recaptchaRef.current?.clear() } catch {} }
  }, [])

  const phoneE164 = `+256${phone.replace(/\D/g, '')}`

  const submit = async () => {
    if (!email || !password || !phone) return alert('Fill Email, Password, Phone')
    if (mode === 'signup' && !fullName) return alert('Enter Full Name')
    setBusy(true)
    try {
      if (mode === 'signup') {
        // 1. Create account in Firebase: Email + Password
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        // 2. Save Name to Firebase account
        await updateProfile(cred.user, { displayName: fullName })
        // 3. Send OTP to Phone
        const conf = await linkWithPhoneNumber(cred.user, phoneE164, recaptchaRef.current!)
        setConfirmation(conf)
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        if (!cred.user.phoneNumber) {
          const conf = await linkWithPhoneNumber(cred.user, phoneE164, recaptchaRef.current!)
          setConfirmation(conf)
        } else {
          return // Already has phone, skip OTP
        }
      }
      setStep('otp')
    } catch (err: any) {
      alert(err.message)
    }
    setBusy(false)
  }

  const verify = async () => {
    if (otp.length !== 6) return alert('6 digit code')
    setBusy(true)
    try {
      await confirmation.confirm(otp)
      await auth.currentUser?.reload() 
      setUser(auth.currentUser) // This makes "Welcome, Name" appear
    } catch (err: any) {
      alert('Wrong OTP: ' + err.message)
    }
    setBusy(false)
  }

  const logout = () => signOut(auth)

  if (!ready) return <div className="h-screen grid place-items-center">Loading...</div>

  // CASE 1: Logged in -> Show "Welcome, Name" + Sale page. page.tsx untouched
  if (user) {
    return (
      <>
        <div id="recaptcha-container"></div>
        
        {/* This bar is in layout.tsx only. Your page.tsx is not touched */}
        <header className="p-4 border-b bg-white flex justify-between items-center shadow-sm">
          <h1 className="text-lg font-semibold">Welcome, {user.displayName || user.email?.split('@')[0]}</h1>
          <button onClick={logout} className="text-red-600 text-sm px-3 py-1 border rounded">Logout</button>
        </header>

        {children} {/* This is your sale page.tsx. 0 lines changed */}
      </>
    )
  }

  // CASE 2: Not logged in -> Show popup: Name, Email, Phone, OTP
  return (
    <>
      <div id="recaptcha-container"></div>
      <div className="fixed inset-0 bg-black/70 grid place-items-center p-4 z-50">
        <div className="bg-white w-full max-w-sm rounded-lg p-5 shadow-xl">
          <div className="flex mb-4 border-b">
            <button onClick={() => { setMode('signup'); setStep('form') }} className={`flex-1 pb-2 ${mode==='signup'?'border-b-2 border-black font-bold':''}`}>Sign Up</button>
            <button onClick={() => { setMode('login'); setStep('form') }} className={`flex-1 pb-2 ${mode==='login'?'border-b-2 border-black font-bold':''}`}>Login</button>
          </div>

          {step === 'form' ? (
            <div className="space-y-3">
              {mode === 'signup' && <input className="w-full border p-2 rounded" placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)}/>}
              <input className="w-full border p-2 rounded" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
              <div className="flex border rounded"><span className="p-2 bg-gray-100">+256</span><input className="flex-1 p-2 outline-none" placeholder="77XXXXXXX" value={phone} onChange={e=>setPhone(e.target.value)}/></div>
              <input className="w-full border p-2 rounded" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
              <button className="w-full bg-black text-white p-2 rounded" disabled={busy} onClick={submit}>{busy?'Sending OTP...':'Continue'}</button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm">We sent a 6-digit code to {phoneE164}</p>
              <input className="w-full border p-3 text-center text-2xl tracking-[0.5em] rounded" maxLength={6} placeholder="------" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}/>
              <button className="w-full bg-green-600 text-white p-2 rounded" disabled={busy} onClick={verify}>{busy?'Verifying...':'Verify & Enter Sale Page'}</button>
              <button className="w-full text-sm text-gray-600" onClick={()=>setStep('form')}>Back</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
