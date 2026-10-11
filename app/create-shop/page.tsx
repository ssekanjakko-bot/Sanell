"use client"
import { useState, useEffect } from "react"
import { db, auth } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

const ALL_CATS = ['Phones','Electronics','Fashion','Home, Furniture & Appliances','Vehicles','Houses & Rentals','Health','Sports, Arts & Outdoor','Babies & Kids','Services','Jobs','Others']

export default function CreateShop(){
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [shopName, setShopName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [txId, setTxId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, (u)=>{
      setUser(u)
      setLoadingUser(false)
    })
    return ()=>unsub()
  },[])

  const toggleCat = (c:string)=>{
    if(cats.includes(c)) setCats(cats.filter(x=>x!==c))
    else {
      if(cats.length>=2) { alert('Pick only 2 categories max'); return }
      setCats([...cats, c])
    }
  }

  const handleSubmit = async (e:any)=>{
    e.preventDefault()
    if(!user) return alert('Please login first')
    if(!shopName.trim()) return alert('Enter shop name')
    if(!whatsapp.trim()) return alert('Enter WhatsApp')
    if(cats.length===0) return alert('Pick 1 or 2 categories')
    if(!txId.trim() || txId.length<6) return alert('Enter valid MoMo Transaction ID from MTN message')

    setLoading(true)
    try{
      await addDoc(collection(db, 'shop_requests'), {
        shopName: shopName.trim(),
        whatsapp: whatsapp.trim(),
        categories: cats,
        momoTxId: txId.trim(),
        amount: 15000,
        sellerId: user.uid,
        sellerEmail: user.email || '',
        status: 'pending',
        createdAt: serverTimestamp()
      })
      alert(`Request sent ✅\n\nAdmin will verify 15K TxID: ${txId} to 0767483636\nYour shop "${shopName}" will be pinned on top of: ${cats.join(', ')}`)
      router.push('/')
    } catch(err:any){
      console.error(err)
      alert('Failed: '+err.message)
    } finally {
      setLoading(false)
    }
  }

  if(loadingUser) return <div className="min-h-screen flex items-center justify-center bg-[#FFFEFB] text-black font-black">Loading...</div>

  if(!user){
    return (
      <div className="min-h-screen bg-[#FFFEFB] flex flex-col items-center justify-center p-6 max-w-[500px] mx-auto">
        <h1 className="text-2xl font-black text-black">Login Required</h1>
        <p className="text-sm mt-2 text-center text-black">You must login to create an official shop.</p>
        <button onClick={()=>router.push('/login')} className="mt-4 bg-black text-[#FFD60A] px-8 py-3 rounded-full font-black">Go to Login</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFEFB] p-4 max-w-[500px] mx-auto">
      <h1 className="text-[20px] font-black text-black tracking-tight">Create Official Shop - 15K / 60 Days</h1>
      <p className="text-[12px] text-neutral-600 mt-1">Pinned on top • Own link sanel-ug.online/shop/ID</p>

      {/* YELLOW BOX - FIXED COLOR */}
      <div className="bg-[#FFF8D6] border-2 border-[#FFD60A] rounded-[18px] p-4 mt-4 shadow-sm">
        <p className="font-black text-[14px] text-black">STEP 1: Send MoMo Now</p>
        <p className="text-[13px] mt-2 text-black"><b>To:</b> 0767483636 - Sanel Ug</p>
        <p className="text-[13px] text-black"><b>Amount:</b> 15,000 UGX</p>
        <p className="text-[13px] mt-2 text-black flex items-center gap-2">
          Reason: <span className="bg-black text-[#FFD60A] px-4 py-1 rounded-full font-black text-[12px] tracking-widest">SHOP {whatsapp.slice(-4)||'XXXX'}</span>
        </p>
        <p className="text-[11px] mt-3 bg-white border border-black/10 rounded-xl p-2.5 text-black leading-snug">
          After sending, MTN gives you Transaction ID e.g <b>1234567890</b>. Copy it below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mt-5">
        <input value={shopName} onChange={e=>setShopName(e.target.value)} placeholder="Shop Name e.g Mellyarts" className="w-full border-2 border-black bg-white p-3.5 rounded-full text-black font-bold placeholder:text-neutral-400 focus:outline-none focus:border-[#FFD60A]" required />
        <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="WhatsApp e.g 256777898370" className="w-full border-2 border-black bg-white p-3.5 rounded-full text-black font-bold placeholder:text-neutral-400 focus:outline-none focus:border-[#FFD60A]" required />

        <div className="flex flex-wrap gap-2 pt-2">
          {ALL_CATS.map(c=>(
            <button type="button" key={c} onClick={()=>toggleCat(c)} className={`px-4 py-2 rounded-full text-[12px] font-black border-2 transition ${cats.includes(c)?'bg-black text-[#FFD60A] border-black':'bg-white text-black border-black/20 hover:border-black'}`}>{c}</button>
          ))}
        </div>
        <p className="text-[10px] text-neutral-500 font-bold tracking-wide">Pick 2 categories only - your shop will be pinned on top of those</p>

        <input value={txId} onChange={e=>setTxId(e.target.value.replace(/\D/g,''))} placeholder="Enter MoMo Transaction ID (numbers only)" className="w-full border-2 border-[#FFD60A] bg-[#FFF8D6] p-3.5 rounded-full text-black font-black placeholder:text-neutral-500 focus:outline-none focus:border-black" required />

        <button disabled={loading} className="w-full bg-black text-[#FFD60A] py-4 rounded-full font-black text-[14px] tracking-wide disabled:opacity-50 mt-2 shadow-[0_6px_0_#FFD60A] active:translate-y-[2px] active:shadow-[0_2px_0_#FFD60A]">
          {loading? 'Sending...' : `Submit For Verification - 15K ( ${user.email} )`}
        </button>
        <p className="text-center text-[10px] text-neutral-500 font-bold">Verified in 10 mins • Pay to 0767483636 </p>
      </form>
    </div>
  )
}