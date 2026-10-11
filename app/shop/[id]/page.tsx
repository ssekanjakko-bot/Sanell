"use client"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useParams } from "next/navigation"

export default function PublicShop(){
  const {id}=useParams()
  const [shop,setShop]=useState<any>(null)
  const [products,setProducts]=useState<any[]>([])
  const [cart,setCart]=useState<any[]>([])

  useEffect(()=>{
    const load = async()=>{
      const s = await getDoc(doc(db,'shops', id as string))
      if(s.exists()) setShop({id:s.id,...s.data()})
      const q = query(collection(db,'products'), where('shopId','==', id))
      const snap = await getDocs(q)
      setProducts(snap.docs.map(d=>({id:d.id,...d.data()})))
      setCart(JSON.parse(localStorage.getItem('sanel_cart')||'[]'))
    }
    load()
  },[id])

  const addToCart = (p:any)=>{
    const newCart = [...cart, {...p, shopId: shop.id, shopName: shop.shopName, cartShopId: shop.id }]
    localStorage.setItem('sanel_cart', JSON.stringify(newCart))
    setCart(newCart)
    alert(`Added to cart - from ${shop.shopName}`)
  }

  if(!shop) return <div className="p-10 text-center bg-black text-white min-h-screen">Loading shop...</div>

  return (
    <div className="min-h-screen bg-black text-white">
      {/* BANNER */}
      <div className="h-56 bg-neutral-900 relative">
        {shop.banner? (
          <img src={shop.banner} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 bg-[#FFD60A] text-black px-4 py-1.5 rounded-full text-[11px] font-black tracking-wide">✓ VERIFIED OFFICIAL SHOP</div>
      </div>

      <div className="max-w-[500px] mx-auto p-4 -mt-6 relative z-10">
        {/* SHOP CARD */}
        <div className="bg-[#111] border border-neutral-800 rounded-[24px] p-4 shadow-xl">
          <h1 className="text-[24px] font-black text-white leading-none">{shop.shopName}</h1>
          <p className="text-[13px] mt-2 text-neutral-300 leading-snug">{shop.bio || 'Welcome to our official store on Sanel Ug'}</p>
          <p className="text-[11px] mt-2 text-[#FFD60A] font-bold">Pinned in: {shop.categories?.join(', ')}</p>

          <div className="flex gap-2 mt-4">
            <a href={`https://wa.me/${shop.whatsapp}`} className="flex-1 bg-[#25D366] text-black text-center py-3.5 rounded-full font-black text-[13px]">WhatsApp Shop</a>
            <button className="flex-1 bg-white text-black py-3.5 rounded-full font-black text-[13px]">Cart ({cart.filter((c:any)=>c.cartShopId===shop.id).length})</button>
          </div>
        </div>

        <h2 className="font-black mt-6 mb-3 text-[15px] text-white">Shop Items ({products.length})</h2>

        {products.length===0? (
          <div className="bg-[#111] border border-dashed border-neutral-700 rounded-2xl p-8 text-center text-neutral-400 text-sm">No products yet in this shop</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p:any)=>(
              <div key={p.id} className="bg-[#1A1A1A] border border-neutral-800 rounded-[20px] overflow-hidden">
                <img src={p.imageUrl} className="h-36 w-full object-cover bg-neutral-900" />
                <div className="p-3">
                  <p className="text-[12px] font-bold text-white truncate">{p.title}</p>
                  <p className="text-[14px] font-black text-[#FFD60A] mt-1">{p.price?.toLocaleString()} UGX</p>
                  <button onClick={()=>addToCart(p)} className="w-full mt-2.5 bg-white text-black py-2.5 rounded-full text-[11px] font-black active:scale-95">Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}