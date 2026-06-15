'use client'
import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, X } from 'lucide-react'

type PlanChoice = 'seller_only' | 'seller_movies_combo' | null

export default function SignupPage() {
          const [step, setStep] = useState<'choice' | 'form'>('choice') // Step 1: Choice, Step 2: Form
          const [planChoice, setPlanChoice] = useState<PlanChoice>(null)

          const [email, setEmail] = useState('')
          const [password, setPassword] = useState('')
          const [name, setName] = useState('')
          const [loading, setLoading] = useState(false)
          const [error, setError] = useState('')
          const [showPassword, setShowPassword] = useState(false)
          const router = useRouter()

          const handlePlanSelect = (choice: PlanChoice) => {
                    setPlanChoice(choice)
                    setStep('form')
          }

          const handleSignup = async (e: React.FormEvent) => {
                    e.preventDefault()
                    if (!planChoice) return
                    setLoading(true)
                    setError('')

                    try {
                              const userCredential = await createUserWithEmailAndPassword(auth, email, password)
                              const user = userCredential.user

                              const trialEnd = new Date()
                              trialEnd.setDate(trialEnd.getDate() + 3)

                              const isCombo = planChoice === 'seller_movies_combo'
                              const sellerOnTrial = planChoice === 'seller_only' || isCombo
                              const moviesOnTrial = isCombo

                              // 1 account, 2 products, based on choice
                              await setDoc(doc(db, 'users', user.uid), {
                                        name: name,
                                        email: user.email,
                                        uid: user.uid,
                                        role: 'user',
                                        signupPlan: planChoice, // 'seller_only' or 'seller_movies_combo'

                                        seller: {
                                                  status: sellerOnTrial ? 'trial' : 'inactive',
                                                  currentPlan: sellerOnTrial ? 'trial_3day_seller' : null,
                                                  trialEnd: sellerOnTrial ? Timestamp.fromDate(trialEnd) : null,
                                                  subscriptionEnd: null // 3.8K/week or 5.5K/week combo after
                                        },
                                        movies: {
                                                  status: moviesOnTrial ? 'trial' : 'inactive',
                                                  currentPlan: moviesOnTrial ? 'trial_3day_movies' : null,
                                                  trialEnd: moviesOnTrial ? Timestamp.fromDate(trialEnd) : null,
                                                  subscriptionEnd: null // 2K/week or 5.5K/week combo after
                                        },

                                        createdAt: Timestamp.now()
                              })

                              router.push(isCombo ? '/dashboard' : '/sell') // Combo goes to dashboard

                    } catch (err: any) {
                              setError(err.message.replace('Firebase: ', ''))
                              setLoading(false)
                    }
          }

          // STEP 1: CHOICE SCREEN
          if (step === 'choice') {
                    return (
                              <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                                        <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md">
                                                  <h1 className="text-2xl font-bold text-center mb-6 text-[#6F4E37]">What do you want to do?</h1>

                                                  <div className="space-y-4">
                                                            {/* Option 1: Seller Only */}
                                                            <button
                                                                      onClick={() => handlePlanSelect('seller_only')}
                                                                      className="w-full text-left p-6 border-2 border-gray-200 rounded-lg hover:border-[#6F4E37] hover:bg-[#6F4E37]/5 transition"
                                                            >
                                                                      <h2 className="text-lg font-bold text-[#6F4E37]">Seller Account Only</h2>
                                                                      <p className="text-sm text-gray-600 mt-1">Post and sell products</p>
                                                                      <p className="text-sm font-semibold text-[#6F4E37] mt-2">
                                                                                3-Day Free Trial, then Weekly 3,800 UGX | Monthly 8,000 UGX
                                                                      </p>
                                                            </button>

                                                            {/* Option 2: Seller + Movies Combo */}
                                                            <button
                                                                      onClick={() => handlePlanSelect('seller_movies_combo')}
                                                                      className="w-full text-left p-6 border-2 border-[#6F4E37] rounded-lg bg-[#6F4E37]/5 relative"
                                                            >
                                                                      <span className="absolute top-2 right-2 bg-[#6F4E37] text-white text-xs px-2 py-1 rounded-full">Best Value</span>
                                                                      <h2 className="text-lg font-bold text-[#6F4E37]">Seller + Movies</h2>
                                                                      <p className="text-sm text-gray-600 mt-1">Sell products AND watch movies</p>
                                                                      <p className="text-sm font-semibold text-[#6F4E37] mt-2">
                                                                                3-Day Free Trial, then Weekly 5,500 UGX | Monthly 12,000 UGX
                                                                      </p>
                                                            </button>
                                                  </div>

                                                  <p className="text-center text-sm text-gray-600 mt-6">
                                                            Want movies only?{' '}
                                                            <Link href="/movies/signup" className="font-bold text-[#6F4E37] hover:underline">
                                                                      Click here
                                                            </Link>
                                                  </p>
                                        </div>
                              </div>
                    )
          }

          // STEP 2: FORM SCREEN
          return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                              <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md relative">
                                        <button onClick={() => setStep('choice')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                                  <X size={20} />
                                        </button>

                                        <h1 className="text-2xl font-bold text-center mb-2 text-[#6F4E37]">
                                                  {planChoice === 'seller_movies_combo' ? 'Seller + Movies Plan' : 'Seller Plan'}
                                        </h1>
                                        <p className="text-center text-gray-600 mb-6">Start with a 3-day free trial. No card needed.</p>

                                        {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}

                                        <form onSubmit={handleSignup} className="space-y-4">
                                                  <div>
                                                            <label className="block text-sm font-medium mb-1">Full Name</label>
                                                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F4E37]" placeholder="John Doe" />
                                                  </div>
                                                  <div>
                                                            <label className="block text-sm font-medium mb-1">Email</label>
                                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F4E37]" placeholder="you@example.com" />
                                                  </div>
                                                  <div>
                                                            <label className="block text-sm font-medium mb-1">Password</label>
                                                            <div className="relative">
                                                                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F4E37]" placeholder="Min 6 characters" />
                                                                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                                                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                      </button>
                                                            </div>
                                                  </div>

                                                  <button type="submit" disabled={loading} className="w-full bg-[#6F4E37] text-white py-2 rounded-lg font-semibold hover:bg-[#5a3e2d] disabled:opacity-50">
                                                            {loading ? 'Creating Account...' : 'Start 3-Day Free Trial'}
                                                  </button>
                                        </form>

                                        <p className="text-center text-sm text-gray-600 mt-6">
                                                  Already have an account?{' '}
                                                  <Link href="/login" className="font-bold text-[#6F4E37] hover:underline">
                                                            Log in
                                                  </Link>
                                        </p>
                              </div>
                    </div>
          )
}