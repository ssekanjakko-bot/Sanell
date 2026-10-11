"use client"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
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
      const s = await getDoc(doc(db,'shops', id as string))
      if(!s.exists()){ setLoading(false); return }
      const shopData = {id:s.id,...s.data()} as any
      setShop(shopData)

      // Try shopId first, then sellerId/ownerId fallback (this is why yours showed 0)
      let snap = await getDocs(query(collection(db,'products'), where('shopId','==', id as string)))
      if(snap.empty && shopData.ownerId){
        snap = await getDocs(query(collection(db,'products'), where('sellerId','==', shopData.ownerId)))
      }
      if(snap.empty && shopData.sellerId){
        snap = await getDocs(query(collection(db,'products'), where('sellerId','==', shopData.sellerId)))
      }
      setProducts(snap.docs.map(d=>({id:d.id,...d.data()})))
      setCart(JSON.parse(localStorage.getItem('sanel_cart')||'[]'))
      setLoading(false)
    }
    if(id) load()
  },[id])

  const addToCart = (p:any)=>{
    const item = {...p, shopId: shop.id, shopName: shop.shopName, cartShopId: shop.id }
    const newCart = [...cart, item]
    localStorage.setItem('sanel_cart', JSON.stringify(newCart))
    setCart(newCart)
    // tiny haptic
    if(navigator.vibrate) navigator.vibrate(30)
  }

  if(loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black">Loading {id}...</div>
  if(!shop) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-10 text-center"><h1 className="font-black text-xl">Shop not found</h1><p className="text-xs text-neutral-400 mt-2">ID: {id}</p></div>

  const shopCartCount = cart.filter((c:any)=>c.cartShopId===shop.id).length

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* TOP BAR */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-black text-[#FFD60A]">⬢ sanel-ug.online</Link>
        <div className="flex items-center gap-2">
          <Link href="/cart" className="bg-white text-black px-4 py-1.5 rounded-full text-[11px] font-black">Cart • {shopCartCount}</Link>
        </div>
      </div>

      {/* BANNER */}
      <div className="relative h-[260px] bg-neutral-900">
        {shop.banner? (
          <img src={shop.banner} className="w-full h-full object-cover" alt="banner" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FFD60A] via-[#FFA600] to-[#111]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
          <div className="bg-[#FFD60A] text-black px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">✓ VERIFIED OFFICIAL SHOP • {shop.views || 0} views</div>
          <button onClick={()=>{ if(navigator.share) navigator.share({title:shop.shopName, url:window.location.href}); else { navigator.clipboard.writeText(window.location.href); alert('Link copied')}}} className="bg-black/70 backdrop-blur text-white border border-white/20 px-3 py-1.5 rounded-full text-[10px] font-black">↗ Share</button>
        </div>
      </div>

      <div className="max-w-[520px] mx-auto px-4 -mt-8 relative z-10 pb-24">
        {/* SHOP CARD */}
        <div className="bg-[#141414] border border-white/10 rounded-[24px] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-full bg-[#FFD60A] text-black flex items-center justify-center font-black text-xl shrink-0">{shop.shopName?.[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-black leading-none tracking-tight">{shop.shopName}</h1>
              <p className="text-[12px] mt-1.5 text-neutral-400 leading-snug line-clamp-2">{shop.bio || 'Welcome to our official store on Sanel Ug — authentic products direct from seller.'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-4">
            {shop.categories?.map((c:string)=>(
              <span key={c} className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-neutral-200">{c}</span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5">
            <a href={`https://wa.me/${shop.whatsapp}?text=Hi%20${encodeURIComponent(shop.shopName)}%20I%20saw%20your%20shop%20on%20Sanel`} target="_blank" className="bg-[#25D366] text-black text-center py-3.5 rounded-full font-black text-[13px] active:scale-[0.98]">WhatsApp Shop</a>
            <Link href="/cart" className="bg-white text-black text-center py-3.5 rounded-full font-black text-[13px] active:scale-[0.98]">Go to Cart ({shopCartCount})</Link>
          </div>

          <p className="text-[10px] text-neutral-500 font-bold mt-3 text-center tracking-widest">🌐 sanel-ug.online/shop/{shop.id.slice(0,8)} • PINNED ON HOMEPAGE</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-3 text-center"><p className="text-[20px] font-black">{products.length}</p><p className="text-[10px] text-neutral-400 font-bold uppercase">Items</p></div>
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-3 text-center"><p className="text-[20px] font-black text-[#FFD60A]">★ 4.9</p><p className="text-[10px] text-neutral-400 font-bold uppercase">Rating</p></div>
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-3 text-center"><p className="text-[20px] font-black">✓</p><p className="text-[10px] text-neutral-400 font-bold uppercase">Official</p></div>
        </div>

        <div className="flex justify-between items-center mt-7 mb-3">
          <h2 className="font-black text-[16px] tracking-tight">Shop Items • {products.length}</h2>
          <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full font-bold">Newest first</span>
        </div>

        {products.length===0? (
          <div className="bg-[#141414] border border-dashed border-white/10 rounded-2xl p-10 text-center"><p className="text-3xl">🛍️</p><p className="font-black mt-2">No products yet</p><p className="text-xs text-neutral-500 mt-1">Seller is adding items, check back soon</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p:any)=>{
              const img = p.imageUrl || p.images?.[0] || p.image || 'https://via.placeholder.com/300'
              return (
                <div key={p.id} className="group bg-[#161616] border border-white/[0.06] hover:border-white/20 rounded-[20px] overflow-hidden transition">
                  <Link href={`/product/${p.id}`} className="block">
                    <div className="relative h-[148px] bg-neutral-900 overflow-hidden">
                      <img src={img} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-[9px] font-black px-2 py-1 rounded-full border border-white/10">{p.category || 'New'}</div>
                    </div>
                    <div className="p-3">
                      <p className="text-[12px] font-bold text-white truncate">{p.title}</p>
                      <p className="text-[14px] font-black text-[#FFD60A] mt-0.5">{Number(p.price).toLocaleString()} UGX</p>
                    </div>
                  </Link>
                  <div className="px-3 pb-3">
                    <button onClick={()=>addToCart(p)} className="w-full bg-white text-black py-2.5 rounded-full text-[11px] font-black active:scale-[0.97] transition">Add to Cart</button>
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