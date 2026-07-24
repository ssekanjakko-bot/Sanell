'use client'
import { useEffect, useRef, useState } from 'react'
import { auth } from '@/lib/firebase'
import { 
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
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
 return (
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return unsub 
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
        <div className="p-3 border-b  flex justify-between bg-white text-amber-900 font-semibold">
          <b>Welcome, {user?.displayName || 'Guest'}</b>
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
        {children}
      </>
    )
  }

  return (
  <>

    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
    <>
      <div id="recaptcha"></div>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
        <div className="bg-amber-900 p-4 rounded-lg w-[90%] max-w-sm shadow-lg border- amber-700">
          <div className="flex mb-3">
            <button onClick={() => {setMode('signup'); setStep('form')}} className={`flex-1 ${mode==='signup'?'font-bold border-b-2':''}`}>SignUp</button>
            <button onClick={() => {setMode('login'); setStep('form')}} className={`flex-1 ${mode==='login'?'font-bold border-b-2':''}`}>Login</button>
          </div>

          {step === 'form' ? (
            <>
              {mode === 'signup' && <input placeholder="Name" className="border border -amber-700 w-full p-3 mb-3 rounded-md bg-amber-50 text-amber-950 placeholder:text-amber-700" value={name} onChange={e=>setName(e.target.value)}/>}
              <input placeholder="Email" className="border border-amber-700 w-full p-3 mb-3 rounded-md bh-amber-50 text-amber-950 placeholder:text-amber-700" value={email} onChange={e=>setEmail(e.target.value)}/>
              <div className="flex border border-amber-700 mb-3 rounded-md bg-amber-50"><span className="p-3 text-amber-950">+256</span><input placeholder="77XXXXXXX" className="flex-1 p-3 bg-transparent text-amber-950" value={phone} onChange={e=>setPhone(e.target.value)}/></div>
              <input placeholder="Password" type="password" className="border border-amber-700 w-full p-3 mb-3 rounded-md bg-amber-50 text-amber-950 placeholder:text-amber-700" value={password} onChange={e=>setPassword(e.target.value)}/>
              <button onClick={submit} className="bg-amber-700 hover:bg-amber-800 text-white font-semibold w-full p-3 rounded-md">Continue</button>
           {/* ADD THIS HERE */}
            { mode === 'login' && ( 
              <button 
                   onClick= {async () =>{
                             if(!email) return alert('Enter your email first');
                              try {
                                   await sendPasswordResetEmail(auth, email);
                                   alert('check your email for a rest link✅');
                                  } catch (e: any) {
                                                    alert('check your email if the account exists');//hide if user exists or not 
                                 }
                             }}
                              className="text-sm text-amber-200 underline mt-2"
                              >
                            Forgot Password?
                       </button>
                 )}
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
