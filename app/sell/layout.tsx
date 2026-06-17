'use client'
import { useEffect, useRef, useState } from 'react'
import { auth } from '@/lib/firebase'
import { 
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  updateProfile, linkWithPhoneNumber, RecaptchaVerifier, signOut, User 
} from 'firebase/auth'

export default function SellLayout({ children }: { children: React.ReactNode }) {
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [confirm, setConfirm] = useState<any>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return unsub
  }, [])

  useEffect(() => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha', { size: 'invisible' })
    }
  }, [])

  const phoneFull = `+256${phone.replace(/\D/g, '')}`

  const submit = async () => {
    if (!email || !password || !phone) return alert('Fill all fields')
    if (mode === 'signup' && !name) return alert('Enter name')

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

  return (
    <>
      <div id="recaptcha"></div>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
        <div className="bg-white p-4 rounded w-80">
          <div className="flex mb-3">
            <button onClick={() => {setMode('signup'); setStep('form')}} className={`flex-1 ${mode==='signup'?'font-bold border-b-2':''}`}>SignUp</button>
            <button onClick={() => {setMode('login'); setStep('form')}} className={`flex-1 ${mode==='login'?'font-bold border-b-2':''}`}>Login</button>
          </div>

          {step === 'form' ? (
            <>
              {mode === 'signup' && <input placeholder="Name" className="border w-full p-2 mb-2" value={name} onChange={e=>setName(e.target.value)}/>}
              <input placeholder="Email" className="border w-full p-2 mb-2" value={email} onChange={e=>setEmail(e.target.value)}/>
              <div className="flex border mb-2"><span className="p-2">+256</span><input placeholder="77XXXXXXX" className="flex-1 p-2" value={phone} onChange={e=>setPhone(e.target.value)}/></div>
              <input placeholder="Password" type="password" className="border w-full p-2 mb-2" value={password} onChange={e=>setPassword(e.target.value)}/>
              <button onClick={submit} className="bg-blue-600 text-white w-full p-2">Continue</button>
            </>
          ) : (
            <>
              <p className="text-center mb-2">Code to {phoneFull}</p>
              <input placeholder="OTP" className="border w-full p-2 mb-2 text-center" value={otp} onChange={e=>setOtp(e.target.value)}/>
              <button onClick={verify} className="bg-green-600 text-white w-full p-2">Verify</button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
