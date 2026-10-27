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

  const clear = (shopId?:string)=>{
    if(!confirm(shopId ? "Clear this shop's cart? You must clear before leaving." : "Clear cart?")) return
    playSound()
    if(shopId){
      updateCart(cart.filter(c => (c.cartShopId||c.shopId) !== shopId))
    } else {
      updateCart([])
    }
  }

  const grouped = cart.reduce((acc:any, item, originalIndex)=>{
    const key = item.cartShopId || item.shopId || 'unknown'
    if(!acc[key]) acc[key] = { 
      shopId: key, 
      shopName: item.shopName || 'Unknown Shop',
      shopPhone: item.shopPhone || (item as any).whatsapp || '',
      items: [] as {item:CartItem, index:number}[] 
    }
    if(item.shopPhone || (item as any).whatsapp){
      acc[key].shopPhone = item.shopPhone || (item as any).whatsapp
    }
    acc[key].items.push({item, index: originalIndex})
    return acc
  }, {} as Record<string, {shopId:string, shopName:string, shopPhone:string, items:{item:CartItem,index:number}[]}>)

  const groupKeys = Object.keys(grouped)
  const isLocked = groupKeys.length > 1
  const firstShopKey = groupKeys[0]
  const firstShop = firstShopKey ? grouped[firstShopKey] : null

  const checkoutShop = (shopGroup:any)=>{
    playSound()
    const lines = shopGroup.items.map(({item}:any)=>`• ${item.title} x${item.qty||1} - ${Number(item.price).toLocaleString()} UGX`).join('%0A')
    const subtotal = shopGroup.items.reduce((s:number,{item}:any)=> s+Number(item.price)*(item.qty||1),0)
    const text = `Hello ${shopGroup.shopName}%0A%0AI want to order from Sanel Ug:%0A${lines}%0A%0ATotal for your shop: ${subtotal.toLocaleString()} UGX%0A%0AShop link: https://sanel-ug.online/shop/${shopGroup.shopId}`
    let phone = (shopGroup.shopPhone || '').toString().replace(/\D/g,'')
    if(phone.startsWith('0')) phone = '256' + phone.slice(1)
    if(phone.length === 9) phone = '256' + phone
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(url, '_blank')
    // Auto clear this shop after checkout after 2 sec
    setTimeout(()=> {
      updateCart(cart.filter(c => (c.cartShopId||c.shopId) !== shopGroup.shopId))
    }, 2000)
  }

  if(cart.length===0) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center text-3xl">🛒</div>
      <h1 className="font-black text-xl mt-4">Your cart is empty</h1>
      <p className="text-sm text-neutral-500 mt-1">Add items from a shop</p>
      <Link href="/" className="mt-6 bg-[#FFD60A] text-black px-8 py-3 rounded-full font-black text-sm">Start Shopping</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-white/10 px-4 py-3.5 flex justify-between items-center">
        <Link href="/" className="font-black text-[#FFD60A]">← Continue Shopping</Link>
        <button onClick={()=>clear()} className="text-[11px] font-black bg-white/10 px-3 py-1.5 rounded-full border border-white/10">Clear All</button>
      </div>

      <div className="max-w-[540px] mx-auto p-4 space-y-4">
        {/* LOCKED MESSAGE */}
        {isLocked && firstShop && (
          <div className="bg-[#FFD60A] text-black rounded-[20px] p-4 border-2 border-black">
            <p className="font-black text-[14px]">🛒 Cart Locked to {firstShop.shopName}</p>
            <p className="text-[11px] font-bold mt-1 leading-tight">You have items from {groupKeys.length} shops. You must checkout or clear <b>{firstShop.shopName}</b> before you can order from others. This is your shop trolley - you can't leave with it.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>checkoutShop(firstShop)} className="bg-black text-[#FFD60A] px-4 py-2 rounded-full font-black text-[11px]">Checkout {firstShop.shopName}</button>
              <button onClick={()=>clear(firstShop.shopId)} className="bg-white border border-black text-black px-4 py-2 rounded-full font-black text-[11px]">Clear {firstShop.shopName}</button>
            </div>
          </div>
        )}

        <h1 className="font-black text-[18px] tracking-tight">
          {isLocked ? `Active Shop: ${firstShop?.shopName} • ${firstShop?.items.length} items` : `Cart • ${cart.length} items from ${firstShop?.shopName}`}
        </h1>

        {/* Show only FIRST shop if locked, else show all (which will be 1) */}
        {(isLocked ? [firstShop] : Object.values(grouped)).map((group:any)=> {
          const subtotal = group.items.reduce((s:number,{item}:any)=> s+Number(item.price)*(item.qty||1),0)
          return (
            <div key={group.shopId} className="bg-[#141414] border border-white/10 rounded-[22px] overflow-hidden">
              <div className="bg-[#1A1A1A] px-4 py-3 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#FFD60A] text-black flex items-center justify-center font-black text-xs">{group.shopName[0]}</div>
                  <Link href={`/shop/${group.shopId}`} className="font-black text-[13px] hover:underline">{group.shopName}</Link>
                  <span className="bg-[#FFD60A] text-black text-[8px] px-1.5 py-0.5 rounded-full font-black">OFFICIAL</span>
                </div>
                <span className="text-[11px] font-bold text-neutral-400">{group.shopPhone}</span>
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
                <button onClick={()=>checkoutShop(group)} className="bg-[#25D366] text-black px-5 py-2 rounded-full font-black text-[12px] active:scale-95">Order via WhatsApp • {group.shopPhone}</button>
              </div>
            </div>
          )
        })}

        {isLocked && (
          <div className="bg-white/5 border border-white/10 rounded-[16px] p-3">
            <p className="text-[11px] font-bold text-neutral-400">+ {groupKeys.length - 1} other shop(s) waiting. Checkout {firstShop?.shopName} to unlock them.</p>
            <div className="mt-2 space-y-1">
              {Object.values(grouped).slice(1).map((g:any)=><p key={g.shopId} className="text-[11px] font-black text-white/50">• {g.shopName} - {g.items.length} items locked</p>)}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 p-3 z-30">
        <div className="max-w-[540px] mx-auto">
          <Link href="/" className="w-full bg-white/10 border border-white/10 text-white text-center py-3.5 rounded-full font-black text-[13px] block">Continue Shopping (Will ask to clear if different shop)</Link>
        </div>
      </div>
    </div>
  )
}