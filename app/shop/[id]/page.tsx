'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore'

export default function ShopPage({ params }: { params: { id: string } }) {
  const [shop, setShop] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const id = params.id

  useEffect(() => {
    // load shop
    getDoc(doc(db, 'shops', id)).then(s => { if(s.exists()) setShop({id:s.id,...s.data()}) })
    // load products of this seller
    const q = query(collection(db, 'products'), where('sellerId', '==', shop?.sellerId || ''))
    // we use onSnapshot after shop loaded
  }, [id])

  useEffect(() => {
    if(!shop?.sellerId) return
    const q = query(collection(db, 'products'), where('sellerId', '==', shop.sellerId))
    const unsub = onSnapshot(q, snap => setProducts(snap.docs.map(d=>({id:d.id,...d.data()}))))
    return () => unsub()
  }, [shop])

  // load cart
  useEffect(()=>{ const c = localStorage.getItem('sanel_cart_'+id); if(c) setCart(JSON.parse(c)) },[id])
  useEffect(()=>{ localStorage.setItem('sanel_cart_'+id, JSON.stringify(cart)) },[cart,id])

  const add = (p:any) => {
    const ex = cart.find(c=>c.id===p.id)
    if(ex) setCart(cart.map(c=>c.id===p.id?{...c,qty:c.qty+1}:c))
    else setCart([...cart,{...p,qty:1}])
  }

  const total = cart.reduce((s,c)=>s + (c.price||0)*c.qty,0)

  const orderWhatsApp = () => {
    if(!shop) return
    let msg = `Hello ${shop.shopName}, I want to order from Sanel Ug:%0A`
    cart.forEach(c=>{ msg += `%0A- ${c.title} x${c.qty} = ${c.price*c.qty} UGX` })
    msg += `%0ATotal: ${total} UGX`
    const phone = shop.whatsapp?.replace('+','')
    window.open(`https://wa.me/${phone}?text=${msg}`,'_blank')
  }

  if(!shop) return <div style={{padding:20, color:'black', background:'white', minHeight:'100vh'}}>Loading shop...</div>

  return (
    <div style={{minHeight:'100vh', background:'white', color:'black'}}>
      {/* HEADER */}
      <div style={{background:'black', color:'white', padding:'20px'}}>
        <h1 style={{fontWeight:'900', fontSize:'22px'}}>{shop.shopName} {shop.is_active && <span style={{background:'#FACC15', color:'black', padding:'2px 8px', borderRadius:'999px', fontSize:'11px'}}>VERIFIED ✓</span>}</h1>
        <p style={{fontSize:'13px', marginTop:'6px', opacity:0.8}}>WhatsApp: {shop.whatsapp} • {shop.categories?.join(', ')}</p>
        <a href="/" style={{display:'inline-block', marginTop:'10px', background:'white', color:'black', padding:'8px 14px', borderRadius:'999px', fontWeight:'900', fontSize:'12px', textDecoration:'none'}}>← Back to Sanel</a>
      </div>

      {/* PRODUCTS */}
      <div style={{maxWidth:'1000px', margin:'0 auto', padding:'16px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'12px'}}>
        {products.map(p=>(
          <div key={p.id} style={{border:'2px solid black', borderRadius:'16px', overflow:'hidden', background:'white'}}>
            <img src={p.image || p.images?.[0]} style={{width:'100%', height:'140px', objectFit:'cover'}} />
            <div style={{padding:'10px'}}>
              <p style={{fontWeight:'800', fontSize:'13px', color:'black'}}>{p.title?.slice(0,40)}</p>
              <p style={{fontWeight:'900', fontSize:'14px', marginTop:'4px', color:'black'}}>{p.price?.toLocaleString()} UGX</p>
              <button onClick={()=>add(p)} style={{width:'100%', marginTop:'8px', background:'black', color:'white', padding:'10px', borderRadius:'999px', fontWeight:'900', fontSize:'12px', border:'none'}}>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>

      {/* CART BAR */}
      {cart.length>0 && (
        <div style={{position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'3px solid black', padding:'14px', maxWidth:'500px', margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', fontWeight:'900'}}>
            <span>Cart ({cart.reduce((s,c)=>s+c.qty,0)})</span>
            <span>{total.toLocaleString()} UGX</span>
          </div>
          <div style={{maxHeight:'80px', overflow:'auto', marginTop:'8px'}}>
            {cart.map(c=><div key={c.id} style={{fontSize:'12px', display:'flex', justifyContent:'space-between'}}><span>{c.title?.slice(0,20)} x{c.qty}</span><button onClick={()=>setCart(cart.filter(x=>x.id!==c.id))} style={{color:'red', fontWeight:'900'}}>X</button></div>)}
          </div>
          <button onClick={orderWhatsApp} style={{width:'100%', marginTop:'10px', background:'#25D366', color:'white', padding:'14px', borderRadius:'999px', fontWeight:'900', border:'none'}}>Order on WhatsApp</button>
        </div>
      )}
    </div>
  )
}