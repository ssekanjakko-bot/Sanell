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

  if(!shop) return <div className="p-10">Loading...</div>

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <div className="h-48 bg-black relative">
        {shop.banner && <img src={shop.banner} className="w-full h-full object-cover" />}
        <div className="absolute bottom-3 left-3 bg-yellow-400 px-3 py-1 rounded-full text-[10px] font-black">VERIFIED OFFICIAL SHOP</div>
      </div>

      <div className="max-w-[500px] mx-auto p-4">
        <h1 className="text-2xl font-black">{shop.shopName}</h1>
        <p className="text-sm mt-1 text-gray-600">{shop.bio}</p>
        <div className="flex gap-2 mt-3">
          <a href={`https://wa.me/${shop.whatsapp}`} className="flex-1 bg-green-600 text-white text-center py-3 rounded-full font-black text-sm">WhatsApp Shop</a>
          <button className="flex-1 bg-black text-white py-3 rounded-full font-black text-sm">Cart ({cart.filter(c=>c.cartShopId===shop.id).length})</button>
        </div>

        <h2 className="font-black mt-6">Shop Items</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {products.map((p:any)=>(
            <div key={p.id} className="bg-white border-2 border-black rounded-2xl overflow-hidden">
              <img src={p.imageUrl} className="h-32 w-full object-cover" />
              <div className="p-2">
                <p className="text-xs font-black">{p.title}</p>
                <p className="text-sm font-black">{p.price} UGX</p>
                <button onClick={()=>addToCart(p)} className="w-full mt-2 bg-black text-white py-2 rounded-full text-xs font-black">Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}