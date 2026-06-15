'use client'
import { useEffect, useState, ReactNode } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: ReactNode }) {
          const [user, setUser] = useState<User | null>(null)
          const [loading, setLoading] = useState(true)
          const [email, setEmail] = useState('')
          const [password, setPassword] = useState('')
          const [error, setError] = useState('')

          useEffect(() => {
                    const unsub = onAuthStateChanged(auth, (currentUser) => {
                              setUser(currentUser)
                              setLoading(false)
                    })
                    return () => unsub()
          }, [])

          const handleLogin = async (e: React.FormEvent) => {
                    e.preventDefault()
                    setError('')
                    try {
                              await signInWithEmailAndPassword(auth, email, password)
                    } catch (err: any) {
                              setError(err.message)
                    }
          }

          const handleLogout = async () => {
                    await signOut(auth)
          }

          if (loading) {
                    return <main className="min-h-screen bg-[#F5F1EB] flex items-center justify-center text-[#6F4E37]">Loading...</main>
          }

          // If NOT logged in, show login screen with Coffee Brown layout
          if (!user) {
                    return (
                              <main className="min-h-screen bg-[#F5F1EB]">
                                        <header className="bg-white border-b border-[#A67C52] p-3 sticky top-0 z-10">
                                                  <div className="flex items-center gap-2">
                                                            <Link href="/" className="text-2xl text-[#6F4E37]">☰</Link>
                                                            <h1 className="text-xl font-bold text-[#6F4E37]">Sanel Ug Admin</h1>
                                                  </div>
                                        </header>

                                        <div className="max-w-sm mx-auto mt-10 bg-white p-6 rounded-lg shadow-md border-[#A67C52]">
                                                  <h2 className="text-2xl font-bold text-[#6F4E37] mb-4 text-center">Admin Login</h2>

                                                  {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                                                  <form onSubmit={handleLogin}>
                                                            <input
                                                                      type="email"
                                                                      placeholder="Email"
                                                                      value={email}
                                                                      onChange={(e) => setEmail(e.target.value)}
                                                                      className="w-full p-2 mb-3 border-[#A67C52] rounded focus:ring-2 focus:ring-[#6F4E37] outline-none"
                                                                      required
                                                            />
                                                            <input
                                                                      type="password"
                                                                      placeholder="Password"
                                                                      value={password}
                                                                      onChange={(e) => setPassword(e.target.value)}
                                                                      className="w-full p-2 mb-4 border-[#A67C52] rounded focus:ring-2 focus:ring-[#6F4E37] outline-none"
                                                                      required
                                                            />

                                                            <button
                                                                      type="submit"
                                                                      className="w-full bg-[#6F4E37] text-white py-2 rounded hover:bg-[#A67C52]"
                                                            >
                                                                      Login
                                                            </button>
                                                  </form>

                                                  <Link href="/" className="block text-center text-sm text-[#A67C52] mt-4 hover:underline">
                                                            Back to Home
                                                  </Link>
                                        </div>
                              </main>
                    )
          }

          // If LOGGED IN, show Coffee Brown layout + your untouched admin page
          return (
                    <main className="min-h-screen bg-[#F5F1EB]">
                              <header className="bg-white border-b border-[#A67C52] p-3 sticky top-0 z-10">
                                        <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                            <Link href="/" className="text-2xl text-[#6F4E37]">☰</Link>
                                                            <h1 className="text-xl font-bold text-[#6F4E37]">Sanel Ug Admin</h1>
                                                  </div>
                                                  <div className="flex items-center gap-3">
                                                            <span className="text-sm text-[#A67C52]">{user.email}</span>
                                                            <button
                                                                      onClick={handleLogout}
                                                                      className="bg-[#6F4E37] text-white px-3 py-1 rounded text-sm hover:bg-[#A67C52]"
                                                            >
                                                                      Logout
                                                            </button>
                                                  </div>
                                        </div>
                              </header>

                              <div className="p-4">
                                        {children} {/* This is your untouched app/admin/page.tsx */}
                              </div>
                    </main>
          )
}