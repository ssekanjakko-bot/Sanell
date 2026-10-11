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
    if(!user) return alert("Login first")
    if(!txId.trim()) return alert("Paste MoMo Tx ID")
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
    alert("✅ Request sent. We verify 15K then activate 5-15 mins.")
    window.location.href="/sell"
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-[520px] mx-auto p-4">

        <div className="mt-2">
          <h1 className="font-black text-[22px]">Get Official Shop</h1>
          <p className="text-[13px] text-black font-bold mt-1">15,000 UGX • 60 days pinned on top • Own link + Cart + verified badge</p>
        </div>

        {/* PAY BOX - NOW WHITE WITH YELLOW BORDER, NOT BLACK */}
        <div className="mt-5 bg-yellow-50 border-2 border-yellow-400 rounded-[20px] p-4">
          <p className="font-black text-[13px] text-black">STEP 1: Send MoMo Now</p>
          <p className="text-[13px] mt-2 text-black"><span className="text-gray-600 font-bold">To:</span> <b>0767483636 - Sanel Ug</b></p>
          <p className="text-[13px] text-black"><span className="text-gray-600 font-bold">Amount:</span> <b>15,000 UGX</b></p>
          <p className="text-[12px] mt-2 text-black">Reason: <b className="bg-black text-white px-2 py-1 rounded-full">SHOP {momo.slice(-4) || 'XXXX'}</b></p>
          <p className="text-[11px] mt-3 bg-white border p-2.5 rounded-xl text-black">After sending, MTN gives you Transaction ID e.g 1234567890. Copy it.</p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            value={name}
            onChange={e=>setName(e.target.value)}
            placeholder="Shop Name e.g Smart Mobile Uganda"
            className="w-full bg-white border-2 border-black p-4 rounded-2xl text-[15px] text-black placeholder:text-gray-500 outline-none"
            required
          />
          <input
            value={momo}
            onChange={e=>setMomo(e.target.value)}
            placeholder="Your MoMo / WhatsApp 2567xxxxxxx"
            className="w-full bg-white border-2 border-black p-4 rounded-2xl text-[15px] text-black placeholder:text-gray-500 outline-none"
            required
          />

          <div className="flex flex-wrap gap-2">
            {CATS.map(c=>(
              <button type="button" key={c} onClick={()=>toggleCat(c)} className={`text-[12px] px-4 py-2 rounded-full border-2 font-black ${cats.includes(c)?'bg-black text-white border-black':'bg-white text-black border-gray-300'}`}>{c}</button>
            ))}
          </div>

          <input
            value={txId}
            onChange={e=>setTxId(e.target.value)}
            placeholder="Paste MoMo Transaction ID here *"
            className="w-full bg-white border-2 border-yellow-500 p-4 rounded-2xl text-[15px] text-black placeholder:text-gray-600 font-bold outline-none"
            required
          />

          <button disabled={loading} className="w-full bg-black text-white py-4 rounded-full font-black text-[16px]">{loading?'Sending...':'I Have Sent 15K - Submit'}</button>
        </form>
      </div>
    </div>
  )
}