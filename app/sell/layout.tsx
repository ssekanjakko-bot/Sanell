'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import {
          createUserWithEmailAndPassword,
          signInWithEmailAndPassword,
          RecaptchaVerifier,
          signInWithPhoneNumber,
          updateProfile,
          onAuthStateChanged,
          User,
          ConfirmationResult
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { X, Eye, EyeOff } from 'lucide-react'

type Step = 'form' | 'verify'
type Tab = 'login' | 'signup'

declare global { interface Window { recaptchaVerifier: any } }

export default function SellLayout({ children }: { children: React.ReactNode }) {
          const [showAuth, setShowAuth] = useState(false)
          const [user, setUser] = useState<User | null>(null)
          const [authChecked, setAuthChecked] = useState(false)
          const [tab, setTab] = useState<Tab>('signup')
          const [step, setStep] = useState<Step>('form')
          const [showPass, setShowPass] = useState(false)

          const [fullName, setFullName] = useState('')
          const [email, setEmail] = useState('')
          const [phone, setPhone] = useState('')
          const [password, setPassword] = useState('')
          const [referral, setReferral] = useState('')
          const [otp, setOtp] = useState('')
          const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
          const [loading, setLoading] = useState(false)

          const router = useRouter()
          const fullPhone = `+256${phone}`

          useEffect(() => {
                    const unsub = onAuthStateChanged(auth, (currentUser) => {
                              setUser(currentUser)
                              setAuthChecked(true)
                              if (!currentUser) setShowAuth(true)
                    })
                    return () => unsub()
          }, [])

          const sendOTP = async () => {
                    if (!email || !password || !phone) return alert('Fill all required fields')
                    if (tab === 'signup' && !fullName) return alert('Enter Full Name')
                    setLoading(true)
                    try {
                              if (!window.recaptchaVerifier) {
                                        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
                              }
                              const confirm = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier)
                              setConfirmation(confirm)
                              setStep('verify')
                    } catch (e: any) { alert(e.message) }
                    setLoading(false)
          }

          const verifyAndCreate = async () => {
                    setLoading(true)
                    try {
                              await confirmation!.confirm(otp)
                              if (tab === 'signup') {
                                        const userCred = await createUserWithEmailAndPassword(auth, email, password)
                                        await updateProfile(userCred.user, { displayName: fullName })
                                        await setDoc(doc(db, 'users', userCred.user.uid), {
                                                  uid: userCred.user.uid, fullName, email, phone: fullPhone, referral: referral || null,
                                                  phoneVerified: true, createdAt: new Date()
                                        })
                              } else {
                                        await signInWithEmailAndPassword(auth, email, password)
                              }
                              setShowAuth(false)
                    } catch (e: any) { alert('Invalid OTP: ' + e.message) }
                    setLoading(false)
          }

          if (!authChecked) return <div className="min-h-screen bg-black"></div>

          return (
                    <>
                              <div id="recaptcha-container"></div>

                              {user && children}

                              {showAuth && (
                                        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
                                                  <div className="bg-white rounded-xl w-full max-w-md shadow-2xl relative">
                                                            <div className="p-6">
                                                                      <h2 className="text-center text-xl font-semibold text-gray-800 mb-4">Login</h2>

                                                                      <div className="flex border-b border-gray-200 mb-6">
                                                                                <button onClick={() => setTab('login')} className={`flex-1 pb-2 font-medium ${tab === 'login' ? 'text-amber-800 border-b-2 border-amber-800' : 'text-gray-500'}`}>Login</button>
                                                                                <button onClick={() => setTab('signup')} className={`flex-1 pb-2 font-medium ${tab === 'signup' ? 'text-amber-800 border-b-2 border-amber-800' : 'text-gray-500'}`}>Sign Up</button>
                                                                      </div>

                                                                      {step === 'form' && (
                                                                                <>
                                                                                          {tab === 'signup' && (
                                                                                                    <div className="mb-4">
                                                                                                              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                                                                                              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-700 outline-none" />
                                                                                                    </div>
                                                                                          )}
                                                                                          <div className="mb-4">
                                                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                                                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-700 outline-none" />
                                                                                          </div>
                                                                                          <div className="mb-4">
                                                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                                                                                    <div className="flex gap-2">
                                                                                                              <span className="px-3 py-2 bg-gray-100 border-gray-300 rounded-md text-gray-600">+256</span>
                                                                                                              <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="700000" maxLength={9} className="flex-1 px-3 py-2 border-gray-300 rounded-md focus:ring-2 focus:ring-amber-700 outline-none" />
                                                                                                    </div>
                                                                                          </div>
                                                                                          <div className="mb-4">
                                                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                                                                                    <div className="relative">
                                                                                                              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="w-full px-3 py-2 border-gray-300 rounded-md focus:ring-2 focus:ring-amber-700 outline-none pr-10" />
                                                                                                              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-500">
                                                                                                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                                                              </button>
                                                                                                    </div>
                                                                                          </div>
                                                                                          {tab === 'signup' && (
                                                                                                    <div className="mb-6">
                                                                                                              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (Optional)</label>
                                                                                                              <input value={referral} onChange={e => setReferral(e.target.value)} placeholder="Enter referral code" className="w-full px-3 py-2 border-gray-300 rounded-md focus:ring-2 focus:ring-amber-700 outline-none" />
                                                                                                    </div>
                                                                                          )}
                                                                                          <button onClick={sendOTP} disabled={loading} className="w-full py-3 rounded-md text-white font-medium bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 disabled:opacity-50">
                                                                                                    {loading ? 'Sending OTP...' : tab === 'signup' ? 'Sign Up' : 'Login'}
                                                                                          </button>
                                                                                </>
                                                                      )}

                                                                      {step === 'verify' && (
                                                                                <>
                                                                                          <p className="text-sm text-gray-600 mb-4 text-center">We sent a 6-digit code to +256{phone}</p>
                                                                                          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" maxLength={6} className="w-full px-3 py-2 border-gray-300 rounded-md focus:ring-2 focus:ring-amber-700 outline-none mb-4 text-center tracking-widest" />
                                                                                          <button onClick={verifyAndCreate} disabled={loading} className="w-full py-3 rounded-md text-white font-medium bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 disabled:opacity-50">
                                                                                                    {loading ? 'Verifying...' : 'Verify & Continue'}
                                                                                          </button>
                                                                                          <button onClick={() => setStep('form')} className="w-full mt-2 text-sm text-amber-800">Back</button>
                                                                                </>
                                                                      )}
                                                            </div>
                                                  </div>
                                        </div>
                              )}
                    </>
          )
}