"use client"
import { useEffect, useState, useMemo } from "react"
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Product = {
  id: string
  title: string
  price: string | number
  images?: string[]
  category?: string
}

type AdminSettings = {
  showBlackMarket?: boolean
  blackMarketMaxPrice?: number
  blackMarketTitle?: string
}

export default function BlackMarketPage(){
  const [products, setProducts] = useState<Product[]>([])
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    blackMarketMaxPrice: 45000,
    blackMarketTitle: "BLACK MARKET"
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(()=>{
    const unsub1 = onSnapshot(doc(db, "admin_settings", "homepage"), snap=>{
      if(snap.exists()) setAdminSettings((p)=>({...p,...snap.data() as AdminSettings}))
    })
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"))
    const unsub2 = onSnapshot(q, snap=>{
      setProducts(snap.docs.map(d=>({id:d.id,...d.data()} as Product)))
      setLoading(false)
    })
    return ()=>{ unsub1(); unsub2(); }
  }, [])

  const filtered = useMemo(()=>{
    const max = adminSettings.blackMarketMaxPrice || 45000
    return products.filter((p)=>{
      const num = Number(String(p.price).replace(/,/g,'').replace(/UGX/g,'').trim())
      return!isNaN(num) && num > 0 && num <= max
    }).sort((a,b)=> Number(String(a.price).replace(/,/g,'')) - Number(String(b.price).replace(/,/g,'')))
  }, [products, adminSettings.blackMarketMaxPrice])

  if(loading) return <div className="p-6 bg-black min-h-screen text-white text-center">Loading Black Market...</div>

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-zinc-900 p-3 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={()=>router.back()} className="bg-white text-black w-8 h-8 rounded-full font-bold">←</button>
        <h1 className="font-black text-[14px] text-yellow-400">
          {adminSettings.blackMarketTitle} • {filtered.length} items ≤ {adminSettings.blackMarketMaxPrice?.toLocaleString()} UGX
        </h1>
      </div>

      <div className="p-3 grid grid-cols-2 gap-3">
        {filtered.map((p)=>(
          <div key={p.id} className="rounded-[18px] bg-gradient-to-b from-[#FFB347] to-[#FF6A00] p-[2px]">
            <div className="bg-gradient-to-b from-[#FF9E2B] to-[#FF7A00] rounded-[16px] p-2.5">
              <p className="text-[9px] font-black text-white/90">SANEL 45K</p>
              <p className="text-[12px] font-black text-white line-clamp-2 h-[28px]">{p.title}</p>
              <div className="mt-1 bg-white rounded-full px-2 py-1 w-fit">
                <span className="text-[11px] font-black text-black">
                  {Number(String(p.price).replace(/,/g,'')).toLocaleString()} UGX
                </span>
              </div>
              <div className="mt-2 bg-white rounded-xl h-[110px] overflow-hidden">
                <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <Link href={`/product/${p.id}`} className="mt-2 block bg-black text-white text-center text-[11px] font-bold py-2 rounded-full">
                Shop Now →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filtered.length===0 && (
        <div className="p-10 text-center text-white/60">
          No products under {adminSettings.blackMarketMaxPrice} UGX found.
        </div>
      )}
    </div>
  )
}