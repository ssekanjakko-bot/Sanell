'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const CATS = ['Phones','Electronics','Fashion','Home, Furniture & Appliances','Vehicles','Houses & Rentals','Health','Sports, Arts & Outdoor','Babies & Kids','Services','Jobs','Others']

export default function CreateShop(){
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [momo, setMomo] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [txId, setTxId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ const unsub = onAuthStateChanged(auth, u=>setUser(u)); return ()=>unsub() },[])

  const toggleCat = (c:string)=>{
    if(cats.includes(c)) setCats(cats.filter(x=>x!==c))
    else { if(cats.length>=2) return alert("Max 2"); setCats([...cats,c]) }
  }

  const submit = async (e:any)=>{
    e.preventDefault()
    if(!user) return alert("Login")
    if(!txId.trim()) return alert("Paste MoMo Transaction ID")
    setLoading(true)
    await addDoc(collection(db,'shop_requests'),{
      sellerId: user.uid,
      sellerEmail: user.email,
      shopName: name,
      whatsapp: momo,
      categories: cats,
      amount: 15000,
      momoTxId: txId.trim(),
      status: 'pending',
      createdAt: serverTimestamp()
    })
    setLoading(false)
    alert("✅ Request sent. We will verify your 15K payment and activate your shop in 5-15 mins.")
    window.location.href="/sell"
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] p-4">
      <div className="max-w-[500px] mx-auto bg-white rounded-[24px] border p-6 mt-4">
        <h1 className="font-black text-[18px]">Get Official Shop - 15,000 UGX</h1>
        <p className="text-[11px] text-gray-500 mt-1">60 days pinned on top • Own link • Cart + verified</p>

        <div className="mt-4 bg-black rounded-2xl p-4 text-white">
          <p className="font-black text-[13px]">STEP 1: Send MoMo Now</p>
          <p className="text-[12px] mt-2">To: <b className="text-yellow-400">0767483636 - Sanel Ug</b></p>
          <p className="text-[12px]">Amount: <b>15,000 UGX</b></p>
          <p className="text-[11px] mt-2 text-white/70">Reason: SHOP + your number last 4 digits</p>
          <p className="text-[10px] mt-2 bg-white/10 p-2 rounded-xl">After sending, MoMo will give you Transaction ID e.g 1234567890. Copy it.</p>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Shop Name" className="w-full bg-[#FDF8F3] p-3.5 rounded-2xl border text-[13px]" required />
          <input value={momo} onChange={e=>setMomo(e.target.value)} placeholder="Your MoMo / WhatsApp 2567xxxxxxx" className="w-full bg-[#FDF8F3] p-3.5 rounded-2xl border text-[13px]" required />
          <div className="flex flex-wrap gap-2">
            {CATS.map(c=>(
              <button type="button" key={c} onClick={()=>toggleCat(c)} className={`text-[11px] px-3 py-1.5 rounded-full border font-bold ${cats.includes(c)?'bg-black text-white':'bg-white'}`}>{c}</button>
            ))}
          </div>
          <input value={txId} onChange={e=>setTxId(e.target.value)} placeholder="Paste MoMo Transaction ID here *" className="w-full bg-yellow-50 border-yellow-400 border p-3.5 rounded-2xl text-[13px] font-bold" required />
          <button disabled={loading} className="w-full bg-black text-white py-4 rounded-full font-black">{loading?'Sending...':'I Have Sent 15K - Submit'}</button>
        </form>
      </div>
    </div>
  )
}