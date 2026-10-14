"use client"
import { useEffect, useState, useRef } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment } from "firebase/firestore"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function PublicShop(){
  const params = useParams()
  const id = (params?.id as string) || ""
  const [shop,setShop]=useState<any>(null)
  const [products,setProducts]=useState<any[]>([])
  const [cart,setCart]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [cartBounce,setCartBounce]=useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playSound = () => {
    try{
      if(!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      const ctx = audioCtxRef.current
      if(ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.18)
      if(navigator.vibrate) navigator.vibrate(30)
      setCartBounce(true); setTimeout(()=> setCartBounce(false), 500)
    }catch{}
  }

  useEffect(()=>{
    const load = async()=>{
      if(!id) return
      setLoading(true)
      try{
        const sRef = doc(db,'shops', id)
        const s = await getDoc(sRef)
        if(s.exists()){
          const data = {id:s.id,...s.data()} as any
          setShop(data)
          if(typeof window!== 'undefined'){
            const key = `viewed_${data.id}`
            if(!sessionStorage.getItem(key)){ updateDoc(sRef, { views: increment(1) }).catch(()=>{}); sessionStorage.setItem(key, "1") }
          }
          const byShopSnap = await getDocs(query(collection(db,'products'), where('shopId','==', id)))
          let allDocs = [...byShopSnap.docs]
          if(data.ownerId){ const byOwnerSnap = await getDocs(query(collection(db,'products'), where('sellerId','==', data.ownerId))); allDocs = [...allDocs,...byOwnerSnap.docs] }
          if(data.sellerId && data.sellerId!== data.ownerId){ const bySellerSnap = await getDocs(query(collection(db,'products'), where('sellerId','==', data.sellerId))); allDocs = [...allDocs,...bySellerSnap.docs] }
          const map = new Map<string, any>(); allDocs.forEach(d => { map.set(d.id, {id: d.id,...d.data()}) })
          const all = Array.from(map.values())
          const visibleOnly = all.filter((p:any)=> p.showInShop!== false && p.hidden!== true && p.isHidden!== true)
          setProducts(visibleOnly)
        }
      }catch(e){ console.error(e) }
      try{ if(typeof window!== 'undefined'){ setCart(JSON.parse(localStorage.getItem('sanel_cart')||'[]')) } }catch{}
      setLoading(false)
    }
    load()
  },[id])

  const addToCart = (p:any)=>{
    playSound()
    setCart(prev => {
      const idx = prev.findIndex((c:any)=> c.id === p.id && c.cartShopId === shop.id)
      let newCart: any[]
      if(idx > -1){ newCart = prev.map((c:any,i:number)=> i===idx? {...c, qty: (c.qty||1)+1} : c) }
      else{ newCart = [...prev, {...p, shopId: shop.id, shopName: shop.shopName, cartShopId: shop.id, qty:1 }] }
      if(typeof window!== 'undefined'){ localStorage.setItem('sanel_cart', JSON.stringify(newCart)) }
      return newCart
    })
  }

  if(loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black">Loading shop...</div>
  if(!shop) return <div className="min-h-screen bg-black flex items-center justify-center text-white p-6 text-center"><div><h1 className="font-black">Shop not found</h1><p className="text-xs text-neutral-500 mt-2">{id}</p><Link href="/" className="mt-4 inline-block bg-white text-black px-5 py-2 rounded-full font-black text-xs">Go Home</Link></div></div>

  const shopCartCount = cart.filter((c:any)=>c.cartShopId===shop.id).reduce((a:number,b:any)=>a+(b.qty||1),0)
  const shopCartTotal = cart.filter((c:any)=>c.cartShopId===shop.id).reduce((a:number,b:any)=>a+(Number(b.price)||0)*(b.qty||1),0)
  const address = shop.storeLocation?.address || shop.location || ""
  const lat = shop.storeLocation?.lat || shop.lat || ""
  const lng = shop.storeLocation?.lng || shop.lng || ""
  const hasLocation =!!(address || (lat && lng))
  const featured = products.filter((p:any)=>p.isFeaturedInShop === true)
  const normal = products.filter((p:any)=>p.isFeaturedInShop!== true)
  const sortedProducts = [...featured,...normal]

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

      <div className="max-w-[520px] mx-auto px-4 -mt-8 relative z-10 pb-32 space-y-4">
        <div className="bg-[#141414] border border-white/10 rounded-[24px] p-5">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FFD60A] text-black flex items-center justify-center font-black text-lg shrink-0">{shop.shopName?.[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] font-black leading-none tracking-tight">{shop.shopName}</h1>
              <p className="text-[12px] text-neutral-400 mt-1.5 leading-snug line-clamp-2">{shop.bio || 'Welcome to our official store'}</p>
              {shop.categories && <p className="text-[10px] text-[#FFD60A] font-bold mt-1">Pinned in: {shop.categories.join(', ')}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <a href={`https://wa.me/${shop.whatsapp}?text=Hi%20${encodeURIComponent(shop.shopName)}`} target="_blank" className="bg-[#25D366] text-black text-center py-3.5 rounded-full font-black text-[13px]">WhatsApp Shop</a>
            <Link href="/cart" className="bg-white text-black text-center py-3.5 rounded-full font-black text-[13px]">Cart ({shopCartCount})</Link>
          </div>
        </div>

        {hasLocation && (
          <div className="bg-[#141414] border border-white/10 rounded-[24px] p-4">
            <h3 className="font-black text-[13px]">📍 Store Location</h3>
            {address && <p className="text-[12px] text-neutral-200 mt-2 bg-white/[0.06] border border-white/10 rounded-full px-3.5 py-2.5">{address}</p>}
            {lat && lng? (<><div className="mt-3 rounded-[16px] overflow-hidden border border-white/10 h-[180px] bg-neutral-900"><iframe width="100%" height="100%" frameBorder="0" loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`} /></div><div className="grid grid-cols-2 gap-2 mt-3"><a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" className="bg-[#FFD60A] text-black text-center py-3 rounded-full font-black text-[12px]">🧭 Get Directions</a><a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" className="bg-white/10 border border-white/20 text-white text-center py-3 rounded-full font-black text-[12px]">Open in Maps</a></div></>) : (<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" className="mt-3 block bg-[#FFD60A] text-black text-center py-3 rounded-full font-black text-[12px]">🧭 Search on Maps</a>)}
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <h2 className="font-black text-[15px]">Shop Items • {products.length}</h2>
          <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full font-bold border border-white/10">{shop.shopName}</span>
        </div>

        {sortedProducts.length===0? (<div className="bg-[#141414] border border-dashed border-white/10 rounded-2xl p-10 text-center"><p className="text-3xl">🛍️</p><p className="font-black mt-2">No products selected for shop</p><p className="text-xs text-neutral-500 mt-1">Seller is choosing what appears here</p></div>) : (<><div className="grid grid-cols-2 gap-3">{sortedProducts.map((p:any)=>{const img = p.imageUrl || p.images?.[0] || p.image || 'https://via.placeholder.com/300'; const isFeat = p.isFeaturedInShop; return (<div key={p.id} className={`group bg-[#161616] rounded-[20px] overflow-hidden relative ${isFeat?'border border-[#FFD60A]/40': 'border border-white/[0.06]'}`}><Link href={`/product/${p.id}`}><div className="h-[148px] bg-neutral-900 overflow-hidden relative"><img src={img} className="h-full w-full object-cover" alt={p.title} />{isFeat && <div className="absolute top-2 left-2 bg-[#FFD60A] text-black text-[8px] font-black px-2 py-1 rounded-full">⭐ FEATURED</div>}</div><div className="p-3"><p className="text-[12px] font-bold truncate">{p.title}</p><p className="text-[14px] font-black text-[#FFD60A] mt-0.5">{Number(p.price).toLocaleString()} UGX</p></div></Link><div className="px-3 pb-3"><button onClick={()=>addToCart(p)} className={`w-full py-2.5 rounded-full text-[11px] font-black active:scale-95 ${isFeat?'bg-[#FFD60A] text-black':'bg-white text-black'}`}>Add to Cart</button></div></div>)})}</div></>)}
      </div>

      {/* UNIQUE FLOATING CART - ORB STYLE */}
      {shopCartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[380px]">
          <Link href="/cart" className={`block ${cartBounce? 'animate-[bounce_0.5s_ease]' : ''}`}>
            <div className="relative bg-black/70 backdrop-blur-[20px] border border-white/10 rounded-full p-1.5 flex items-center gap-2 shadow-[0_0_40px_rgba(255,214,10,0.3)] overflow-hidden">
              {/* Animated glow bg */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFD60A]/20 via-[#FFD60A]/10 to-transparent animate-pulse" />

              {/* Cart orb */}
              <div className="relative w-14 h-14 rounded-full bg-[#FFD60A] flex items-center justify-center shrink-0 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                <span className={`text-[26px] ${cartBounce? 'scale-125' : 'scale-100'} transition-transform duration-200`}>🛒</span>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-black">
                  <span className="text-[11px] font-black text-black">{shopCartCount}</span>
                </div>
                {/* ping effect */}
                <div className="absolute inset-0 rounded-full bg-[#FFD60A] animate-ping opacity-30" />
              </div>

              <div className="relative flex-1 pl-2">
                <p className="text-white font-black text-[13px] leading-none">Cart • {shopCartCount} items</p>
                <p className="text-[#FFD60A] font-bold text-[11px] mt-1">{shopCartTotal.toLocaleString()} UGX • {shop.shopName}</p>
              </div>

              <div className="relative bg-white text-black px-6 py-3 rounded-full font-black text-[12px] mr-1 flex items-center gap-1">
                Checkout <span className="text-[14px]">→</span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}