"use client"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"

type CartItem = {
  id: string
  title: string
  price: number
  image?: string
  images?: string[]
  imageUrl?: string
  shopId: string
  shopName: string
  shopPhone?: string
  whatsapp?: string
  cartShopId: string
  qty?: number
}

export default function CartPage(){
  const [cart,setCart]=useState<CartItem[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(()=>{
    setCart(JSON.parse(localStorage.getItem('sanel_cart')||'[]'))
  },[])

  const playSound = () => {
    try{
      if(typeof window=== 'undefined') return
      if(!audioCtxRef.current){
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if(ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(900, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
      if(navigator.vibrate) navigator.vibrate(30)
    }catch{}
  }

  const updateCart = (newCart: CartItem[])=>{
    setCart(newCart)
    localStorage.setItem('sanel_cart', JSON.stringify(newCart))
  }

  const remove = (idx:number)=>{
    playSound()
    const n = [...cart]
    n.splice(idx,1)
    updateCart(n)
  }

  const incQty = (idx:number)=>{
    playSound()
    const n = [...cart]
    n[idx].qty = (n[idx].qty||1)+1
    updateCart(n)
  }

  const decQty = (idx:number)=>{
    playSound()
    const n = [...cart]
    if((n[idx].qty||1)>1) n[idx].qty!--
    else n.splice(idx,1)
    updateCart(n)
  }

  const clear = ()=>{
    if(!confirm("Clear cart?")) return
    playSound()
    updateCart([])
  }

  // FIXED: Group by shop and KEEP phone
  const grouped = cart.reduce((acc:any, item, originalIndex)=>{
    const key = item.cartShopId || item.shopId || 'unknown'
    if(!acc[key]) acc[key] = { 
      shopId: key, 
      shopName: item.shopName || 'Unknown Shop',
      shopPhone: item.shopPhone || item.whatsapp || '',
      items: [] as {item:CartItem, index:number}[] 
    }
    if(item.shopPhone || (item as any).whatsapp){
      acc[key].shopPhone = item.shopPhone || (item as any).whatsapp
    }
    acc[key].items.push({item, index: originalIndex})
    return acc
  }, {} as Record<string, {shopId:string, shopName:string, shopPhone:string, items:{item:CartItem,index:number}[]}>)

  const total = cart.reduce((s,i)=> s + (Number(i.price)||0)*(i.qty||1), 0)

  const checkoutShop = (shopGroup:any)=>{
    playSound()
    const lines = shopGroup.items.map(({item}:any)=>`• ${item.title} x${item.qty||1} - ${Number(item.price).toLocaleString()} UGX`).join('%0A')
    const subtotal = shopGroup.items.reduce((s:number,{item}:any)=> s+Number(item.price)*(item.qty||1),0)
    const text = `Hello ${shopGroup.shopName}%0A%0AI want to order from Sanel Ug:%0A${lines}%0A%0ATotal for your shop: ${subtotal.toLocaleString()} UGX%0A%0AShop link: https://sanel-ug.online/shop/${shopGroup.shopId}`
    
    // FIXED: Get the shop's real number
    let phone = (shopGroup.shopPhone || '').toString().replace(/\D/g,'')
    if(phone.startsWith('0')) phone = '256' + phone.slice(1)
    if(phone.length === 9) phone = '256' + phone
    
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  if(cart.length===0) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center text-3xl">🛒</div>
      <h1 className="font-black text-xl mt-4">Your cart is empty</h1>
      <p className="text-sm text-neutral-500 mt-1">Add items from official shops</p>
      <Link href="/" className="mt-6 bg-[#FFD60A] text-black px-8 py-3 rounded-full font-black text-sm">Start Shopping</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-36">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-white/10 px-4 py-3.5 flex justify-between items-center">
        <Link href="/" className="font-black text-[#FFD60A]">← Continue Shopping</Link>
        <button onClick={clear} className="text-[11px] font-black bg-white/10 px-3 py-1.5 rounded-full border border-white/10">Clear</button>
      </div>

      <div className="max-w-[540px] mx-auto p-4 space-y-4">
        <h1 className="font-black text-[22px] tracking-tight">Cart • {cart.length} items • {Object.keys(grouped).length} shops</h1>

        {Object.values(grouped).map((group:any)=> {
          const subtotal = group.items.reduce((s:number,{item}:any)=> s+Number(item.price)*(item.qty||1),0)
          return (
            <div key={group.shopId} className="bg-[#141414] border border-white/10 rounded-[22px] overflow-hidden">
              <div className="bg-[#1A1A1A] px-4 py-3 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#FFD60A] text-black flex items-center justify-center font-black text-xs">{group.shopName[0]}</div>
                  <Link href={`/shop/${group.shopId}`} className="font-black text-[13px] hover:underline">{group.shopName}</Link>
                  <span className="bg-[#FFD60A] text-black text-[8px] px-1.5 py-0.5 rounded-full font-black">OFFICIAL</span>
                </div>
                <span className="text-[11px] font-bold text-neutral-400">{group.items.length} items • {group.shopPhone || 'No WhatsApp'}</span>
              </div>

              <div className="divide-y divide-white/5">
                {group.items.map(({item,index}:any)=>{
                  const img = item.imageUrl || item.images?.[0] || item.image || 'https://via.placeholder.com/200'
                  return (
                    <div key={`${item.id}-${index}`} className="p-3 flex gap-3">
                      <img src={img} className="w-16 h-16 rounded-xl object-cover bg-neutral-900 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold truncate">{item.title}</p>
                        <p className="text-[12px] font-black text-[#FFD60A] mt-0.5">{Number(item.price).toLocaleString()} UGX</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={()=>decQty(index)} className="w-7 h-7 bg-white/10 border border-white/10 rounded-full font-black text-xs active:scale-90">-</button>
                          <span className="text-xs font-black w-5 text-center">{item.qty||1}</span>
                          <button onClick={()=>incQty(index)} className="w-7 h-7 bg-white text-black rounded-full font-black text-xs active:scale-90">+</button>
                          <button onClick={()=>remove(index)} className="ml-auto text-[10px] font-black text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">Remove</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="p-3 bg-black/30 flex justify-between items-center">
                <p className="text-[12px] font-bold text-neutral-400">Subtotal: <span className="text-white font-black">{subtotal.toLocaleString()} UGX</span></p>
                <button onClick={()=>checkoutShop(group)} className="bg-[#25D366] text-black px-5 py-2 rounded-full font-black text-[12px] active:scale-95">Order via WhatsApp</button>
              </div>
            </div>
          )
        })}

        <div className="bg-[#FFD60A] text-black rounded-[20px] p-4 flex justify-between items-center mt-6">
          <div><p className="text-[11px] font-black opacity-60 uppercase">Grand Total</p><p className="font-black text-[20px]">{total.toLocaleString()} UGX</p></div>
          <p className="text-[10px] font-bold max-w-[140px] leading-tight">Grouped by shop. WhatsApp each shop owner separately.</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 p-3 z-30">
        <div className="max-w-[540px] mx-auto grid grid-cols-2 gap-2">
          <Link href="/" className="bg-white/10 border border-white/20 text-white text-center py-3.5 rounded-full font-black text-[13px]">Continue Shopping</Link>
          <button onClick={()=>{
            playSound()
            const all = Object.values(grouped).map((g:any)=>`${g.shopName}: ${g.items.reduce((s:number,{item}:any)=>s+Number(item.price)*(item.qty||1),0).toLocaleString()} UGX`).join('%0A')
            const text = `Hello Sanel Ug%0A%0AI have ${cart.length} items in cart from ${Object.keys(grouped).length} shops:%0A${all}%0A%0AGrand Total: ${total.toLocaleString()} UGX%0A%0ALink: https://sanel-ug.online/cart`
            window.open(`https://wa.me/256767483636?text=${text}`,'_blank')
          }} className="bg-[#FFD60A] text-black py-3.5 rounded-full font-black text-[13px]">Checkout All • {total.toLocaleString()}</button>
        </div>
      </div>
    </div>
  )
}