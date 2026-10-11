"use client"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment } from "firebase/firestore"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function PublicShop(){
  const {id}=useParams()
  const [shop,setShop]=useState<any>(null)
  const [products,setProducts]=useState<any[]>([])
  const [cart,setCart]=useState<any[]>([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    const load = async()=>{
      setLoading(true)
      try{
        const s = await getDoc(doc(db,'shops', id as string))
        if(s.exists()){
          const data = {id:s.id,...s.data()} as any
          setShop(data)
          updateDoc(doc(db,'shops', data.id), { views: increment(1) }).catch(()=>{})

          let snap = await getDocs(query(collection(db,'products'), where('shopId','==', id as string)))
          if(snap.empty && data.ownerId) snap = await getDocs(query(collection(db,'products'), where('sellerId','==', data.ownerId)))
          if(snap.empty && data.sellerId) snap = await getDocs(query(collection(db,'products'), where('sellerId','==', data.sellerId)))
          setProducts(snap.docs.map(d=>({id:d.id,...d.data()})))
        }
      }catch(e){ console.error(e) }
      setCart(JSON.parse(localStorage.getItem('sanel_cart')||'[]'))
      setLoading(false)
    }
    if(id) load()
  },[id])

  const addToCart = (p:any)=>{
    const newCart = [...cart, {...p, shopId: shop.id, shopName: shop.shopName, cartShopId: shop.id, qty:1 }]
    localStorage.setItem('sanel_cart', JSON.stringify(newCart))
    setCart(newCart)
    if(navigator.vibrate) navigator.vibrate(30)
  }

  if(loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black">Loading shop...</div>
  if(!shop) return <div className="min-h-screen bg-black flex items-center justify-center text-white p-6 text-center"><div><h1 className="font-black">Shop not found</h1><p className="text-xs text-neutral-500 mt-2">{id}</p><Link href="/" className="mt-4 inline-block bg-white text-black px-5 py-2 rounded-full font-black text-xs">Go Home</Link></div></div>

  const shopCartCount = cart.filter((c:any)=>c.cartShopId===shop.id).length
  const address = shop.storeLocation?.address || shop.location || ""
  const lat = shop.storeLocation?.lat || shop.lat || ""
  const lng = shop.storeLocation?.lng || shop.lng || ""
  const hasLocation =!!(address || (lat && lng))

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-white/10 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-black text-[#FFD60A] text-sm">⬢ sanel-ug.online</Link>
        <Link href="/cart" className="bg-white text-black px-4 py-1.5 rounded-full text-[11px] font-black">Cart • {shopCartCount}</Link>
      </div>

      <div className="relative h-[260px] bg-neutral-900">
        {shop.banner? <img src={shop.banner} className="w-full h-full object-cover" alt="banner" /> : <div className="w-full h-full bg-gradient-to-br from-[#FFD60A] to-[#111]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-transparent" />
        <div className="absolute bottom-3 left-4 bg-[#FFD60A] text-black px-3 py-1 rounded-full text-[10px] font-black">✓ VERIFIED OFFICIAL SHOP • {shop.views||0} views</div>
      </div>

      <div className="max-w-[520px] mx-auto px-4 -mt-8 relative z-10 pb-28 space-y-4">
        <div className="bg-[#141414] border border-white/10 rounded-[24px] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FFD60A] text-black flex items-center justify-center font-black text-lg shrink-0">{shop.shopName?.[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] font-black leading-none tracking-tight">{shop.shopName}</h1>
              <p className="text-[12px] text-neutral-400 mt-1.5 leading-snug line-clamp-2">{shop.bio || 'Welcome to our official store'}</p>
              {shop.categories && <p className="text-[10px] text-[#FFD60A] font-bold mt-1">Pinned in: {shop.categories.join(', ')}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <a href={`https://wa.me/${shop.whatsapp}?text=Hi%20${encodeURIComponent(shop.shopName)}`} target="_blank" className="bg-[#25D366] text-black text-center py-3.5 rounded-full font-black text-[13px] active:scale-[0.98]">WhatsApp Shop</a>
            <Link href="/cart" className="bg-white text-black text-center py-3.5 rounded-full font-black text-[13px]">Cart ({shopCartCount})</Link>
          </div>
        </div>

        {hasLocation && (
          <div className="bg-[#141414] border border-white/10 rounded-[24px] p-4">
            <h3 className="font-black text-[13px] flex items-center gap-2">📍 Store Location</h3>
            {address && <p className="text-[12px] text-neutral-200 mt-2 bg-white/[0.06] border border-white/10 rounded-full px-3.5 py-2.5">{address}</p>}
            {lat && lng? (
              <>
                <div className="mt-3 rounded-[16px] overflow-hidden border border-white/10 h-[180px] bg-neutral-900">
                  <iframe width="100%" height="100%" frameBorder="0" loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" className="bg-[#FFD60A] text-black text-center py-3 rounded-full font-black text-[12px]">🧭 Get Directions</a>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" className="bg-white/10 border border-white/20 text-white text-center py-3 rounded-full font-black text-[12px]">Open in Maps</a>
                </div>
              </>
            ) : (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" className="mt-3 block bg-[#FFD60A] text-black text-center py-3 rounded-full font-black text-[12px]">🧭 Search on Maps</a>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <h2 className="font-black text-[15px]">Shop Items • {products.length}</h2>
          <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full font-bold border border-white/10">{shop.shopName}</span>
        </div>

        {products.length===0? (
          <div className="bg-[#141414] border border-dashed border-white/10 rounded-2xl p-10 text-center">
            <p className="text-3xl">🛍️</p>
            <p className="font-black mt-2">No products yet</p>
            <p className="text-xs text-neutral-500 mt-1">Seller is adding items</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p:any)=>{
              const img = p.imageUrl || p.images?.[0] || p.image || 'https://via.placeholder.com/300'
              return (
                <div key={p.id} className="group bg-[#161616] border border-white/[0.06] hover:border-white/15 rounded-[20px] overflow-hidden transition">
                  <Link href={`/product/${p.id}`}>
                    <div className="h-[148px] bg-neutral-900 overflow-hidden relative">
                      <img src={img} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" alt={p.title} />
                    </div>
                    <div className="p-3">
                      <p className="text-[12px] font-bold truncate text-white">{p.title}</p>
                      <p className="text-[14px] font-black text-[#FFD60A] mt-0.5">{Number(p.price).toLocaleString()} UGX</p>
                    </div>
                  </Link>
                  <div className="px-3 pb-3">
                    <button onClick={()=>addToCart(p)} className="w-full bg-white text-black py-2.5 rounded-full text-[11px] font-black active:scale-[0.97]">Add to Cart</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}