'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { app } from '@/lib/firebase' // Only needs auth

export default function SellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [loading, setLoading] = useState(false)
  const [confirmation, setConfirmation] = useState<any>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  // 1. Firebase remembers user forever. This runs on every page load
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // 2. Create reCAPTCHA 1 time only. Fixes `invalid code` forever
  useEffect(() => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      })
    }
    return () => {
      try { recaptchaRef.current?.clear() } catch {}
      recaptchaRef.current = null
    }
  }, [])

  const getFullPhone = () => `+256${phone.replace(/\D/g, '')}`

  // 3. SIGNUP / LOGIN - Step 1
  const handleSubmit = async () => {
    if (!email ||!password ||!phone) return alert('Fill Email, Password, Phone')
    if (mode === 'signup' &&!fullName) return alert('Enter Full Name')
    setLoading(true)

    try {
      const phoneE164 = getFullPhone()

      if (mode === 'signup') {
        // A. Create account in Firebase Auth with Email + Password
        const userCred = await createUserWithEmailAndPassword(auth, email, password)
        // B. Save Full Name to Firebase Auth profile
        await updateProfile(userCred.user, { displayName: fullName })
        // C. Send OTP to link phone
        const conf = await linkWithPhoneNumber(userCred.user, phoneE164, recaptchaRef.current!)
        setConfirmation(conf)
      } else {
        // LOGIN: Sign in with Email + Password
        const userCred = await signInWithEmailAndPassword(auth, email, password)
        // If phone not linked yet, send OTP
        if (!userCred.user.phoneNumber) {
          const conf = await linkWithPhoneNumber(userCred.user, phoneE164, recaptchaRef.current!)
          setConfirmation(conf)
        } else {
          // Phone already verified, go to sale page
          return
        }
      }
      setStep('otp')
    } catch (e: any) {
      alert(e.code === 'auth/email-already-in-use'
       ? 'Email exists. Click Login tab.'
        : e.message)
      // Reset reCAPTCHA so they can try again
      recaptchaRef.current?.clear()
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
    } finally {
      setLoading(false)
    }
  }

  // 4. VERIFY OTP - Step 2. This completes signup/login
  const verifyOTP = async () => {
    if (otp.length!== 6) return alert('Enter 6 digit code')
    setLoading(true)
    try {
      await confirmation.confirm(otp)
      // Success! Firebase Auth now has: email, password, phone, displayName
      // User is logged in. Modal will auto close due to onAuthStateChanged
    } catch (e: any) {
      alert('Wrong OTP: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await signOut(auth)
    setStep('form')
  }

  // Loading state while Firebase checks if user is logged in
  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  // CASE 1: User is logged in -> Show sale page. No modal.
  if (user) {
    return (
      <>
        <div id="recaptcha-container"></div> {/* Still needed for Firebase */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>Welcome, {user.displayName || user.email}</div>
          <button onClick={logout} className="text-red-600">Logout</button>
        </div>
        {children} {/* This is your sale page.tsx. Untouched */}
      </>
    )
  }

  // CASE 2: User is NOT logged in -> Show Auth Modal
  return (
    <>
      <div id="recaptcha-container"></div> {/* No folder needed */}

      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-full max-w-sm">
          <div className="flex mb-4 border-b">
            <button onClick={() => {setMode('signup'); setStep('form')}}
              className={`flex-1 pb-2 ${mode==='signup'? 'border-b-2 border-blue-600 font-bold' : ''}`}>
              Sign Up
            </button>
            <button onClick={() => {setMode('login'); setStep('form')}}
              className={`flex-1 pb-2 ${mode==='login'? 'border-b-2 border-blue-600 font-bold' : ''}`}>
              Login
            </button>
          </div>

          {step === 'form'? (
            <div className="space-y-3">
              {mode === 'signup' && <input placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full border p-2 rounded"/>}
              <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-2 rounded"/>
              <div className="flex border rounded"><span className="p-2 bg-gray-100">+256</span>
                <input placeholder="77XXXXXXX" value={phone} onChange={e=>setPhone(e.target.value)} className="flex-1 p-2 outline-none"/>
              </div>
              <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border p-2 rounded"/>
              <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50">
                {loading? 'Please wait...' : mode === 'signup'? 'Sign Up' : 'Login'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-center">Code sent to {getFullPhone()}</p>
              <input placeholder="6-digit code" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} className="w-full border p-3 text-center text-2xl tracking-widest rounded"/>
              <button onClick={verifyOTP} disabled={loading} className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-50">
                {loading? 'Verifying...' : 'Verify'}
              </button>
              <button onClick={() => setStep('form')} className="w-full text-sm">Back</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
