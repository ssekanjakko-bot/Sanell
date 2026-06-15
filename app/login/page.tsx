'use client'
import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COFFEE_BROWN = '#6F4E37'

export default function LoginPage() {
          const [email, setEmail] = useState('')
          const [password, setPassword] = useState('')
          const [loading, setLoading] = useState(false)
          const router = useRouter()

          const handleLogin = async (e: any) => {
                    e.preventDefault()
                    setLoading(true)
                    try {
                              await signInWithEmailAndPassword(auth, email, password)
                              router.push('/') // Send to home. Step 2 middleware will redirect if needed
                    } catch (err: any) {
                              alert(err.message)
                              setLoading(false)
                    }
          }

          return (
                    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FDF8F3' }}>
                              <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                                        <h1 className="text-2xl font-bold mb-4" style={{ color: COFFEE_BROWN }}>Login</h1>

                                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded mb-3" />
                                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded mb-4" />

                                        <button disabled={loading} className="w-full text-white py-2 rounded font-bold" style={{ backgroundColor: COFFEE_BROWN }}>
                                                  {loading ? 'Logging in...' : 'Login'}
                                        </button>
                                        <p className="text-center text-sm mt-3">No account? <Link href="/signup" className="font-bold" style={{ color: COFFEE_BROWN }}>Sign up</Link></p>
                              </form>
                    </div>
          )
}