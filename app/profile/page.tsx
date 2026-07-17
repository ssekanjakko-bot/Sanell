'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Product = {
  id: string,
  title: string,
  price: number,
  image: string,
  status: 'active' | 'sold'
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>({})
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/profile') // layout will show login modal
        return
      }
      setUser(u)

      // 1. Get user data from Firestore
      const userRef = doc(db, "users", u.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) setUserData(userSnap.data())

      // 2. Get real listings from Firestore
      const q = query(collection(db, "products"), where("sellerId", "==", u.uid))
      const querySnap = await getDocs(q)
      const userProducts: Product[] = []
      querySnap.forEach((doc) => {
        userProducts.push({ id: doc.id,...doc.data() } as Product)
      })
      setProducts(userProducts)
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  const handleLogout = async () => {
    await signOut(auth)
    router.refresh()
  }

  if (loading) return <div className="p-10 text-center text-white">Loading...</div>

  return (
    <div className="bg-[#7C2D12] min-h-screen text-[#FFFBEB] pb-20">

      {/* 1. PROFILE HEADER */}
      <div className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-[#C2410C] flex items-center justify-center text-3xl font-bold">
            {userData.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hi {userData.name || 'Seller'}</h1>
            <p className="text-sm opacity-80">{userData.email}</p>
            <p className="text-sm opacity-80">{userData.phone}</p>
          </div>
        </div>
      </div>

      {/* 2. STATS */}
      <div className="grid grid-cols-3 gap-3 px-5 mb-5">
        <div className="bg-[#C2410C] p-3 rounded-lg text-center">
          <p className="text-2xl font-bold">{products.length}</p>
          <p className="text-xs">Listings</p>
        </div>
        <div className="bg-[#C2410C] p-3 rounded-lg text-center">
          <p className="text-2xl font-bold">{products.filter(p => p.status === 'sold').length}</p>
          <p className="text-xs">Sold</p>
        </div>
        <div className="bg-[#C2410C] p-3 rounded-lg text-center">
          <p className="text-2xl font-bold">98%</p>
          <p className="text-xs">Response</p>
        </div>
      </div>

      {/* 3. MY LISTINGS */}
      <div className="px-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">My Listings</h2>
          <Link href="/sell" className="bg-[#C2410C] px-4 py-2 rounded text-sm font-bold">
            + Add New
          </Link>
        </div>

        {products.length === 0? (
          <div className="bg-[#C2410C]/50 p-6 rounded-lg text-center">
            <p>No listings yet</p>
            <Link href="/sell" className="underline">Post your first item</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="bg-[#C2410C]/30 p-3 rounded-lg flex gap-3">
                <img src={product.image} className="w-20 h-20 rounded object-cover" />
                <div className="flex-1">
                  <p className="font-bold">{product.title}</p>
                  <p className="text-lg">UGX {product.price?.toLocaleString()}</p>
                  <p className={`text-xs ${product.status === 'sold'? 'text-red-300' : 'text-green-300'}`}>
                    {product.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. SETTINGS + LOGOUT */}
      <div className="px-5 mt-6">
        <button
          onClick={handleLogout}
          className="bg-red-700 hover:bg-red-800 w-full p-3 rounded-lg font-bold"
        >
          Logout
        </button>
      </div>

    </div>
  )
}