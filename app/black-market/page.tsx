"use client"
import { useEffect, useState, useMemo } from "react"
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, X } from "lucide-react"

type Product = {
  id: string
  title: string
  price: string | number
  images?: string[]
  category?: string
  description?: string
  whatsapp?: string
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
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [activeImg, setActiveImg] = useState<string>("")
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

  useEffect(()=>{
    if(viewProduct?.images?.[0]) setActiveImg(viewProduct.images[0])
  }, [viewProduct])

  const filtered = useMemo(()=>{
    const max = adminSettings.blackMarketMaxPrice || 45000
    return products.filter((p)=>{
      const num = Number(String(p.price).replace(/,/g,'').replace(/UGX/g,'').trim())
      return!isNaN(num) && num > 0 && num <= max
    }).sort((a,b)=> Number(String(a.price).replace(/,/g,'')) - Number(String(b.price).replace(/,/g,'')))
  }, [products, adminSettings.blackMarketMaxPrice])

  const handleWhatsApp = (product: Product) => {
    let phone = (product as any).whatsapp || (product as any).whatsApp || (product as any).phone
    if(!phone) return alert("Seller did not add WhatsApp")
    let clean = phone.toString().replace(/\D/g,'')
    if(clean.startsWith('0')) clean='256'+clean.substring(1)
    else if(!clean.startsWith('256')) clean='256'+clean
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(`Hi, I'm interested in ${product.title} - ${product.price} UGX`)}`, '_blank')
  }

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
              <p className="text-[9px] font-black text-white/90 tracking-widest">SANEL 45K</p>
              <p className="text-[12px] font-black text-white line-clamp-2 h-[28px] leading-[13px] mt-1">{p.title}</p>
              <div className="mt-1 bg-white rounded-full px-2 py-1 w-fit">
                <span className="text-[11px] font-black text-black">
                  {Number(String(p.price).replace(/,/g,'')).toLocaleString()} UGX
                </span>
              </div>
              <div className="mt-2 bg-white rounded-xl h-[110px] overflow-hidden relative">
                <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover cursor-pointer" onClick={()=>setViewProduct(p)} />
                {/* EYE ICON */}
                <button onClick={()=>setViewProduct(p)} className="absolute top-1.5 right-1.5 bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center">
                  <Eye size={14}/>
                </button>
                {p.images && p.images.length > 1 && <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">+{p.images.length}</span>}
              </div>
              <button onClick={()=>handleWhatsApp(p)} className="mt-2 block w-full bg-black text-white text-center text-[11px] font-bold py-2 rounded-full">
                Shop Now →
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length===0 && (
        <div className="p-10 text-center text-white/60">
          No products under {adminSettings.blackMarketMaxPrice} UGX found.
        </div>
      )}

      {/* MAGNIFY MODAL WITH EYE */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={()=>setViewProduct(null)}>
          <div className="bg-white rounded-2xl max-w-[420px] w-full max-h-[90vh] overflow-y-auto relative text-black" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setViewProduct(null)} className="absolute top-3 right-3 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center z-20"><X size={16}/></button>
            <div className="relative bg-gray-100">
              <img src={activeImg} className="w-full h-80 object-contain" />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[11px] px-3 py-1 rounded-full font-bold">
                {(viewProduct.images?.findIndex(i=>i===activeImg)?? 0) + 1} / {viewProduct.images?.length} pics
              </div>
            </div>
            {viewProduct.images && viewProduct.images.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto">
                {viewProduct.images.map((img, idx)=>(
                  <button key={idx} onClick={()=>setActiveImg(img)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${activeImg===img? 'border-orange-600':'border-transparent opacity-70'}`}>
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="p-4">
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-md font-bold">{viewProduct.category} • {viewProduct.images?.length} pics</span>
              <h2 className="font-bold text-xl mt-2">{viewProduct.title}</h2>
              <p className="font-black text-2xl mt-1" style={{color:'#B45309'}}>{viewProduct.price} UGX</p>
              <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{viewProduct.description || "No description"}</p>
              <div className="mt-5 flex flex-col gap-2">
                <button onClick={()=>handleWhatsApp(viewProduct)} className="w-full bg-green-600 text-white py-3.5 rounded-full font-bold">📞 WhatsApp Seller</button>
                <Link href={`/product/${viewProduct.id}`} className="w-full bg-black text-white py-3 rounded-full font-bold text-center text-sm">View Full Details</Link>
                <button onClick={()=>setViewProduct(null)} className="w-full bg-gray-100 text-black py-3 rounded-full font-bold text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}