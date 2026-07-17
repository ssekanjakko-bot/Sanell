'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>({})
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDesc, setEditingDesc] = useState(false)
  const [description, setDescription] = useState('')
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push('/')
      setUser(u)

      const userRef = doc(db, "users", u.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const data = userSnap.data()
        setUserData(data)
        setDescription(data.description || '')
      } else {
        // Create user doc with green tick for new accounts
        await setDoc(userRef, {
          name: u.displayName || 'Seller',
          email: u.email,
          phone: u.phoneNumber || '',
          isVerified: true, // GREEN TICK
          description: '',
          createdAt: new Date()
        })
        setUserData({ name: u.displayName, email: u.email, isVerified: true })
      }

      const q = query(collection(db, "products"), where("sellerId", "==", u.uid))
      const snap = await getDocs(q)
      setProducts(snap.docs.map(d => ({id: d.id,...d.data()})))
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  const saveDescription = async () => {
    await updateDoc(doc(db, "users", user.uid), { description })
    setUserData({...userData, description})
    setEditingDesc(false)
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  if (loading) return <div className="p-10 text-center text-[#FFFBEB]">Loading...</div>

  return (
    <div className="bg-[#7C2D12] min-h-screen text-[#FFFBEB] pb-20">
      <div className="p-4"><Link href="/" className="underline">← Back</Link></div>

      {/* HEADER WITH GREEN TICK */}
      <div className="px-5 pb-4 border-b border-[#C2410C]/30">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#C2410C] flex items-center justify-center text-3xl font-bold relative">
            {userData.name?.[0]?.toUpperCase() || 'S'}
            {userData.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#7C2D12] text-sm">✓</div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{userData.name || 'Seller'}</h1>
              {userData.isVerified && <span className="text-green-400 text-xs">Verified</span>}
            </div>
            <p className="text-sm opacity-80">{userData.phone || 'No phone'}</p>
            <p className="text-sm opacity-80">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* ABOUT ME */}
      <div className="px-5 py-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">About Me</h2>
          <button onClick={()=>setEditingDesc(!editingDesc)} className="text-sm underline">{editingDesc? 'Cancel' : 'Edit'}</button>
        </div>
        {editingDesc? (
          <div>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-[#FFFBEB] text-[#7C2D12] p-3 rounded-md h-24 outline-none" maxLength={200}/>
            <button onClick={saveDescription} className="bg-[#C2410C] px-4 py-2 rounded mt-2 font-bold">Save</button>
          </div>
        ) : (
          <p className="bg-[#C2410C]/30 p-3 rounded-lg text-sm">{description || "No description yet. Click Edit to add one."}</p>
        )}
      </div>

      {/* STATS */}
      <div className="px-5 py-2">
        <h2 className="text-lg font-bold mb-3">Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#C2410C] p-3 rounded-lg text-center"><p className="text-2xl font-bold">{products.length}</p><p className="text-xs">Listings</p></div>
          <div className="bg-[#C2410C] p-3 rounded-lg text-center"><p className="text-2xl font-bold">{products.filter(p => p.status === 'sold').length}</p><p className="text-xs">Sold</p></div>
          <div className="bg-[#C2410C] p-3 rounded-lg text-center"><p className="text-2xl font-bold">{products.filter(p => p.status === 'active').length}</p><p className="text-xs">Active</p></div>
        </div>
      </div>

      {/* MY LISTINGS - FIXED IMAGES */}
      <div className="px-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">My Listings</h2>
          <Link href="/sell" className="bg-[#C2410C] px-4 py-2 rounded text-sm font-bold">+ Post</Link>
        </div>
        {products.length === 0? (
          <div className="bg-[#C2410C]/30 p-6 rounded-lg text-center">No listings yet</div>
        ) : (
          <div className="space-y-3">
            {products.map(p => {
              const imageUrl = p.image || p.imageUrl || p.images?.[0] || '/placeholder.png'
              return (
                <div key={p.id} className="bg-[#C2410C]/20  backdrop-blur-md border border-white/10 p-3 rounded-xl flex gap-3 shadow-lg">
                  <img src={imageUrl} alt={p.title} className="w-20 h-20 rounded object-cover" onError={(e:any)=>e.target.src='/placeholder.png'}/>
                  <div className="flex-1">
                    <p className="font-bold">{p.title}</p>
                    <p>UGX {p.price?.toLocaleString()}</p>
                    <p className={`text-xs ${p.status === 'sold'? 'text-red-300' : 'text-green-300'}`}>{p.status || 'active'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-5 mt-8"><button onClick={handleLogout} className="bg-red-800 w-full p-3 rounded-lg font-bold">Logout</button></div>
    </div>
  )
}