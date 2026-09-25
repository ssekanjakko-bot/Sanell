'use client'
import { useEffect, useState, useMemo } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, BadgeCheck, Package, CheckCircle, Zap, TrendingUp, Wallet, Eye, Calendar, Edit3, Plus } from 'lucide-react'

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
        await setDoc(userRef, {
          name: u.displayName || 'Seller',
          email: u.email,
          phone: u.phoneNumber || '',
          isVerified: true,
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

  // --- STATISTICS LOGIC ---
  const stats = useMemo(() => {
    const totalValue = products.reduce((s,p)=> s + (Number(p.price)||0), 0)
    const active = products.filter(p => p.status!== 'sold' &&!p.is_sold).length
    const sold = products.filter(p => p.status === 'sold' || p.is_sold).length
    const boosted = products.filter(p => p.is_boosted || p.boost_pending).length
    const thisMonth = products.filter(p => {
      const d = p.createdAt?.toDate? p.createdAt.toDate() : null
      if(!d) return false
      const now = new Date()
      return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear()
    }).length

    // category breakdown
    const catMap: any = {}
    products.forEach(p=> { catMap[p.category] = (catMap[p.category]||0)+1 })
    const topCats = Object.entries(catMap).sort((a:any,b:any)=>b[1]-a[1]).slice(0,3)

    // last 6 days posting
    const days = [...Array(6)].map((_,i)=>{
      const d = new Date(); d.setDate(d.getDate()-(5-i))
      const count = products.filter(p=>{
        const cd = p.createdAt?.toDate?.()
        return cd && cd.toDateString()===d.toDateString()
      }).length
      return { label: d.toLocaleDateString('en', {weekday:'short'}).slice(0,2), count }
    })

    return { totalValue, active, sold, boosted, thisMonth, topCats, days }
  }, [products])

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="min-h-screen bg-[#FDF8F3] text-black pb-24">
      {/* TOP NAV */}
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="bg-white border px-4 py-2 rounded-full text-[12px] font-black">← Home</Link>
        <button onClick={handleLogout} className="bg-black text-white px-4 py-2 rounded-full text-[12px] font-black flex items-center gap-1"><LogOut size={14}/> Logout</button>
      </div>

      <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-[320px_1fr] gap-4 mt-2">
        {/* LEFT PROFILE CARD */}
        <div className="bg-white rounded-[24px] border p-5 h-fit sticky top-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-black text-white flex items-center justify-center text-3xl font-black relative">
              {userData.name?.[0]?.toUpperCase() || 'S'}
              {userData.isVerified && <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white w-7 h-7 rounded-full flex items-center justify-center text-white"><BadgeCheck size={16}/></div>}
            </div>
            <h1 className="mt-3 font-black text-[18px] flex items-center gap-1">{userData.name || 'Seller'} {userData.isVerified && <BadgeCheck className="text-green-500" size={18}/>}</h1>
            <p className="text-[12px] text-gray-500 font-medium">{user?.email}</p>
            <p className="text-[12px] text-gray-500 font-medium">{userData.phone || 'No phone added'}</p>
            <div className="mt-3 bg-black text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest">VERIFIED SELLER</div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-[13px]">About Me</h2>
              <button onClick={()=>setEditingDesc(!editingDesc)} className="text-[11px] font-black bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1"><Edit3 size={12}/>{editingDesc? 'Cancel':'Edit'}</button>
            </div>
            {editingDesc? (
              <div className="mt-3">
                <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-[#FDF8F3] border border-black p-3 rounded-2xl text-[13px] font-medium outline-none h-24 text-black" maxLength={200} placeholder="Who are you? Where are you located? Delivery?"/>
                <button onClick={saveDescription} className="w-full bg-black text-white py-3 rounded-full font-black text-[12px] mt-2">Save Description</button>
              </div>
            ) : (
              <p className="mt-3 bg-[#FDF8F3] p-3 rounded-2xl text-[12px] font-medium text-gray-700 min-h-[60px]">{description || "No description yet. Click Edit to add one - e.g your hostel, delivery time."}</p>
            )}
          </div>

          <Link href="/sell" className="mt-5 bg-[#FDF8F3] border border-black w-full py-3 rounded-full font-black text-[13px] flex items-center justify-center gap-2"><Plus size={16}/> Post New Product</Link>
        </div>

        {/* RIGHT STATS */}
        <div className="space-y-4">
          {/* 4 STAT CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-[20px] border p-4"><div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center"><Package size={14}/></div><p className="font-black text-[22px] mt-3">{products.length}</p><p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Total Listings</p></div>
            <div className="bg-black text-white rounded-[20px] p-4"><div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><TrendingUp size={14}/></div><p className="font-black text-[22px] mt-3">{stats.active}</p><p className="text-[11px] text-white/60 font-bold uppercase">Active Now</p></div>
            <div className="bg-white rounded-[20px] border p-4"><div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center"><CheckCircle size={14}/></div><p className="font-black text-[22px] mt-3">{stats.sold}</p><p className="text-[11px] text-gray-500 font-bold uppercase">Sold</p></div>
            <div className="bg-white rounded-[20px] border p-4"><div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"><Zap size={14}/></div><p className="font-black text-[22px] mt-3">{stats.boosted}</p><p className="text-[11px] text-gray-500 font-bold uppercase">Boosted</p></div>
          </div>

          {/* VALUE + CHART */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white rounded-[20px] border p-5">
              <h3 className="font-black text-[13px] flex items-center gap-2"><Wallet size={16}/> Inventory Value</h3>
              <p className="text-[28px] font-black mt-2">{stats.totalValue.toLocaleString()} <span className="text-[12px] text-gray-400">UGX</span></p>
              <div className="mt-3 flex gap-2">
                <span className="bg-[#FDF8F3] px-3 py-1 rounded-full text-[11px] font-bold">{stats.thisMonth} this month</span>
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold">+{stats.thisMonth >0? 'Active' : 'Start posting'}</span>
              </div>
              {stats.topCats.length>0 && <div className="mt-4 border-t pt-3"><p className="text-[11px] font-black tracking-widest text-gray-400">TOP CATEGORIES</p><div className="mt-2 space-y-1.5">{stats.topCats.map(([cat,count]:any)=><div key={cat} className="flex justify-between text-[12px] font-bold"><span>{cat}</span><span className="bg-black text-white px-2 rounded-full text-[10px]">{count}</span></div>)}</div></div>}
            </div>

            <div className="bg-white rounded-[20px] border p-5">
              <h3 className="font-black text-[13px] flex items-center gap-2"><Calendar size={16}/> Posting Activity 📉</h3>
              <div className="mt-5 flex items-end gap-2 h-[90px]">
                {stats.days.map((d,i)=>{
                  const h = d.count===0? 8 : Math.max(20, d.count*30)
                  return <div key={i} className="flex-1 flex flex-col items-center gap-2"><div className={`w-full rounded-full ${d.count>0? 'bg-black' : 'bg-gray-100'}`} style={{height: `${h}px`}}></div><span className="text-[10px] font-black">{d.label}</span></div>
                })}
              </div>
              <p className="text-[11px] text-gray-500 mt-4 font-medium">Post daily to get more visibility. Boosted products get 5x views.</p>
            </div>
          </div>

          {/* MY LISTINGS MODERN */}
          <div className="bg-white rounded-[24px] border p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-[15px]">My Listings ({products.length})</h2>
              <Link href="/sell" className="bg-black text-white px-4 py-2 rounded-full text-[11px] font-black">+ Post</Link>
            </div>
            {products.length === 0? (
              <div className="bg-[#FDF8F3] border border-dashed p-8 rounded-[20px] text-center"><p className="text-3xl">📦</p><p className="font-black mt-2">No listings yet</p><p className="text-[12px] text-gray-500">Your products will appear here</p></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {products.map(p => {
                  const imageUrl = p.image || p.imageUrl || p.images?.[0] || '/placeholder.png'
                  return (
                    <div key={p.id} className="bg-[#FDF8F3] rounded-[18px] p-3 flex gap-3 border hover:border-black transition">
                      <img src={imageUrl} alt={p.title} className="w-20 h-20 rounded-xl object-cover bg-white" onError={(e:any)=>e.target.src='/placeholder.png'}/>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-[13px] truncate">{p.title}</p>
                        <p className="font-bold text-[13px] mt-1">{p.price?.toLocaleString()} UGX</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`text-[9px] px-2 py-1 rounded-full font-black ${p.status === 'sold'? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>{(p.status || 'active').toUpperCase()}</span>
                          {p.is_boosted && <span className="text-[9px] bg-yellow-400 px-2 py-1 rounded-full font-black">BOOSTED</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}