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
      const s = await getDoc(doc(db,'shops', id as string))
      if(s.exists()){
        const data = {id:s.id,...s.data()} as any
        setShop(data)
        // count view
        updateDoc(doc(db,'shops', data.id), { views: increment(1) }).catch(()=>{})

        let snap = await getDocs(query(collection(db,'products'), where('shopId','==', id as string)))
        if(snap.empty && data.ownerId) snap = await getDocs(query(collection(db,'products'), where('sellerId','==', data.ownerId)))
        if(snap.empty && data.sellerId) snap = await getDocs(query(collection(db,'products'), where('sellerId','==', data.sellerId)))
        setProducts(snap.docs.map(d=>({id:d.id,...d.data()})))
      }
      setCart(JSON.parse(localStorage.getItem('sanel_cart')||'[]'))
      setLoading(false)
    }
    if(id) load()
  },[id])

  const addToCart = (p:any)=>{
    const newCart = [...cart, {...p, shopId: shop.id, shopName: shop.shopName, cartShopId: shop.id }]
    localStorage.setItem('sanel_cart', JSON.stringify(newCart))
    setCart(newCart)
    if(navigator.vibrate) navigator.vibrate(30)
  }

  if(loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black">Loading shop...</div>
  if(!shop) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Shop not found - {id}</div>

  const shopCartCount = cart.filter((c:any)=>c.cartShopId===shop.id).length
  const address = shop.storeLocation?.address || shop.location || ""
  const lat = shop.storeLocation?.lat || shop.lat || ""
  const lng = shop.storeLocation?.lng || shop.lng || ""
  const hasLocation = address || (lat && lng)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-white/10 px-4 py-3 flex justify-between">
        <Link href="/" className="font-black text-[#FFD60A] text-sm">⬢ sanel-ug.online</Link>
        <Link href="/cart" className="bg-white text-black px-4 py-1.5 rounded-full text-[11px] font-black">Cart • {shopCartCount}</Link>
      </div>

      <div className="relative h-[260px] bg-neutral-900">
        {shop.banner? <img src={shop.banner} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-[#FFD60A] to-[#111]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
        <div className="absolute bottom-3 left-4 bg-[#FFD60A] text-black px-3 py-1 rounded-full text-[10px] font-black">✓ VERIFIED OFFICIAL SHOP</div>
      </div>

      <div className="max-w-[520px] mx-auto px-4 -mt-8 relative z-10 pb-28 space-y-4">
        <div className="bg-[#141414] border border-white/10 rounded-[24px] p-5 shadow-xl">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FFD60A] text-black flex items-center justify-center font-black text-lg">{shop.shopName?.[0]}</div>
            <div className="flex-1">
              <h1 className="text-[20px] font-black leading-none">{shop.shopName}</h1>
              <p className="text-[12px] text-neutral-400 mt-1 line-clamp-2">{shop.bio}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <a href={`https://wa.me/${shop.whatsapp}`} target="_blank" className="bg-[#25D366] text-black text-center py-3 rounded-full font-black text-[13px]">WhatsApp</a>
            <Link href="/cart" className="bg-white text-black text-center py-3 rounded-full font-black text-[13px]">Cart ({shopCartCount})</Link>
          </div>
        </div>

        {/* LOCATION - NEW */}
        {hasLocation && (
          <div className="bg-[#141414] border border-white/10 rounded-[24px] p-4">
            <h3 className="font-black text-[13px] flex items-center gap-