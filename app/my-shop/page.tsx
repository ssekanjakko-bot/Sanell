"use client"
import { useEffect, useState } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import Link from "next/link"

export default function MyShop(){
  const [user,setUser]=useState<any>(null)
  const [shop,setShop]=useState<any>(null)
  const [products,setProducts]=useState<any[]>([])
  const [edit,setEdit]=useState({shopName:'', bio:'', banner:'', whatsapp:''})

  useEffect(()=>{
    return onAuthStateChanged(auth, async (u)=>{
      if(!u) return
      setUser(u)
      // Find shop owned by this seller
      const q = query(collection(db,'shops'), where('ownerId','==',u.uid))
      const snap = await getDocs(q)
      if(!snap.empty){
        const s = {id:snap.docs[0].id,...snap.docs[0].data()} as any
        setShop(s)
        setEdit({shopName:s.shopName, bio:s.bio||'', banner:s.banner||'', whatsapp:s.whatsapp})
        // Get products belonging to this shop
        const pq = query(collection(db,'products'), where('shopId','==',s.id))
        const ps = await getDocs(pq)
        setProducts(ps.docs.map(d=>({id:d.id,...d.data()})))
      }
    })
  },[])

  const saveShop = async()=>{
    // This will be allowed after you update rules at the end
    // For now admin will save for them
    await updateDoc(doc(db,'shops', shop.id), {...edit})
    alert('Saved ✅')
  }

  if(!shop) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-xl font-black">No Official Shop Yet</h1>
      <p className="text-sm mt-2">Go to Create Shop, pay 15K, admin will approve.</p>
      <Link href="/create-shop" className="mt-4 bg-black text-white px-8 py-3 rounded-full font-black">Create Shop</Link>
    </div>
  )

  return (
    <div className="max-w-[500px] mx-auto min-h-screen bg-[#FDF8F3] p-4">
      <div className="bg-black text-white rounded-2xl p-4">
        <h1 className="font-black">{shop.shopName}</h1>
        <p className="text-xs text-yellow-400">OFFICIAL • Pinned in {shop.categories?.join(', ')}</p>
        <p className="text-[10px] mt-1">Active till: {shop.paid_until?.toDate?.()?.toLocaleDateString()}</p>
      </div>

      <div className="mt-4 space-y-3">
        <label className="text-xs font-black">Shop Name</label>
        <input value={edit.shopName} onChange={e=>setEdit({...edit, shopName:e.target.value})} className="w-full border-2 border-black p-3 rounded-full font-black" />

        <label className="text-xs font-black">Banner URL</label>
        <input value={edit.banner} onChange={e=>setEdit({...edit, banner:e.target.value})} placeholder="https://..." className="w-full border-2 border-black p-3 rounded-full" />
        {edit.banner && <img src={edit.banner} className="h-24 w-full object-cover rounded-xl" />}

        <label className="text-xs font-black">Bio</label>
        <textarea value={edit.bio} onChange={e=>setEdit({...edit, bio:e.target.value})} className="w-full border-2 border-black p-3 rounded-2xl" placeholder="Welcome to my official store..." />

        <label className="text-xs font-black">WhatsApp</label>
        <input value={edit.whatsapp} onChange={e=>setEdit({...edit, whatsapp:e.target.value})} className="w-full border-2 border-black p-3 rounded-full" />

        <button onClick={saveShop} className="w-full bg-black text-white py-4 rounded-full font-black">Save My Shop Design</button>
      </div>

      <h2 className="font-black mt-8">Products Inside This Shop ({products.length})</h2>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {products.map((p:any)=>(
          <div key={p.id} className="bg-white border rounded-xl p-2">
            <img src={p.imageUrl} className="h-24 object-cover w-full rounded-xl" />
            <p className="text-xs font-bold truncate">{p.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}