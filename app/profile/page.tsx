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

        // BACKFILL: if old user has no isVerified field, add it now
        if (data.isVerified === undefined) {
          await updateDoc(userRef, { isVerified: true })
          setUserData({...data, isVerified: true})
        }
      } else {
        // Create user doc with green tick for new accounts
        const newUserData = {
          name: u.displayName || 'Seller',
          email: u.email,
          phone: u.phoneNumber || '',
          isVerified: true, // GREEN TICK FOR ALL NEW USERS
          description: '',
          createdAt: new Date()
        }
        await setDoc(userRef, newUserData)
        setUserData(newUserData)
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

  // This makes badge show for old users too
  const isVerified = userData.isVerified?? true

  return (
    <div className="bg-[#7C2D12] min-h-screen text-[#FFFBEB] pb-20">

      {/* BACK BUTTON */}
      <div className="p-4">
        <Link href="/" className="text-[#FFFBEB] underline">← Back</Link>
      </div>

      {/* 1. SELLER HEADER WITH GREEN TICK */}
      <div className="px-5 pb-4 border-b border-[#C2410C]/30">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#C2410C] flex items-center justify-center text-3xl font-bold relative">
            {userData.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-7 h-7 flex items-center justify-center border-2 border-[#7C2D12]">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{userData.name || 'Seller'}</h1>
              {isVerified && <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Verified</span>}
            </div>
            <p className="text-sm opacity-80">{userData.phone || 'No phone'}</p>
            <p className="text-sm opacity-80">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* 2. SELLER DESCRIPTION */}
      <div className="px-5 py-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">About Me</h2>
          <button onClick={()=>setEditingDesc(!editingDesc)} className="text-sm underline">
            {editingDesc? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingDesc? (
          <div>
            <textarea
              value={description}
              onChange={e=>setDescription(e.target.value)}
              placeholder="Tell buyers about yourself. Ex: I sell original iPhones and laptops in Kampala."
              className="w-full bg-[#FFFBEB] text-[#7C2D12] p-3 rounded-md h-24 outline-none"
              maxLength={200}
            />
            <button
              onClick={saveDescription}
              className="bg-[#C2410C] px-4 py-2 rounded mt-2 font-bold"
            >
              Save
            </button>
          </div>
        ) : (
          <p className="bg-[#C2410C]/30 p-3 rounded-lg text-sm">
            {description || "No description yet. Click Edit to add one."}
          </p>
        )}
      </div>

      {/* 3. STATS */}
      <div className="px-5 py-2">
        <h2 className="text-lg font-bold mb-3">Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#C2410C] p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs">Listings</p>
          </div>
          <div className="bg-[#C2410C] p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">{products.filter(p => p.status === 'sold').length}</p>
            <p className="text-xs">Sold</p>
          </div>
          <div className="bg-[#C2410C] p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">{products.filter(p => p.status === 'active').length}</p>
            <p className="text-xs">Active</p>
          </div>
        </div>
      </div>

      {/* 4. MY LISTINGS */}
      <div className="px-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">My Listings</h2>
          <Link href="/sell" className="bg-[#C2410C] px-4 py-2 rounded text-sm font-bold">+ Post</Link>
        </div>

        {products.length === 0? (
          <div className="bg-[#C2410C]/30 p-6 rounded-lg text-center">
            <p>No listings yet</p>
            <Link href="/sell" className="underline text-sm">Post your first item</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(p => {
              const imageUrl = p.image || p.imageUrl || p.images?.[0] || '/placeholder.png'
              return (
                <div key={p.id} className="bg-[#C2410C]/30 p-3 rounded-lg flex gap-3">
                  <img
                    src={imageUrl}
                    alt={p.title}
                    className="w-20 h-20 rounded object-cover"
                    onError={(e: any) => {e.target.src = '/placeholder.png'}}
                  />
                  <div className="flex-1">
                    <p className="font-bold">{p.title}</p>
                    <p>UGX {p.price?.toLocaleString()}</p>
                    <p className={`text-xs ${p.status === 'sold'? 'text-red-300' : 'text-green-300'}`}>
                      {p.status || 'active'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. LOGOUT */}
      <div className="px-5 mt-8">
        <button
          onClick={handleLogout}
          className="bg-red-800 hover:bg-red-900 w-full p-3 rounded-lg font-bold"
        >
          Logout
        </button>
      </div>

    </div>
  )
}