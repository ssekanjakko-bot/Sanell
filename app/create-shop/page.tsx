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
        categories: cats, // array - for pinned on top
        momoTxId: txId.trim(),
        amount: 15000,
        sellerId: user.uid, // <-- BASED ON SELLER - matches rules
        sellerEmail: user.email || '',
        status: 'pending',
        createdAt: serverTimestamp()
      })
      alert(`Request sent ✅\n\nAdmin will verify 15K TxID: ${txId} to 0767483636\nYour shop "${shopName}" will be pinned on top of: ${cats.join(', ')}`)
      router.push('/')
    } catch(err:any){
      console.error(err)
      alert('Failed: '+err.message+' - Check Firestore rules for shop_requests')
    } finally {
      setLoading(false)
    }
  }

  if(loadingUser) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  if(!user){
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex flex-col items-center justify-center p-6 max-w-[500px] mx-auto">
        <h1 className="text-2xl font-black">Login Required</h1>
        <p className="text-sm mt-2 text-center">You must login to create an official shop.</p>
        <button onClick={()=>router.push('/login')} className="mt-4 bg-black text-white px-8 py-3 rounded-full font-black">Go to Login</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] p-4 max-w-[500px] mx-auto">
      <h1 className="text-xl font-black mb-2">Create Official Shop - 15K / 60 Days</h1>

      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-4 mb-4">
        <p className="font-black text-sm">STEP 1: Send MoMo Now</p>
        <p className="text-xs mt-1"><b>To:</b> 0767483636 - Sanel Ug<br/><b>Amount:</b> 15,000 UGX</p>
        <p className="text-xs mt-2">Reason: <span className="bg-black text-white px-3 py-1 rounded-full font-black">SHOP {whatsapp.slice(-4)||'XXXX'}</span></p>
        <p className="text-[11px] mt-2 bg-white border rounded-xl p-2">After sending, MTN gives you Transaction ID e.g 1234567890. Copy it below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input value={shopName} onChange={e=>setShopName(e.target.value)} placeholder="Shop Name e.g Mellyarts" className="w-full border-2 border-black p-3.5 rounded-full text-black font-bold" required />
        <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="WhatsApp e.g 256777898370" className="w-full border-2 border-black p-3.5 rounded-full text-black" required />

        <div className="flex flex-wrap gap-2">
          {ALL_CATS.map(c=>(
            <button type="button" key={c} onClick={()=>toggleCat(c)} className={`px-4 py-2 rounded-full text-xs font-black border-2 ${cats.includes(c)?'bg-black text-white border-black':'bg-white text-black border-black'}`}>{c}</button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500">Pick 2 categories only - your shop will be pinned on top of those</p>

        <input value={txId} onChange={e=>setTxId(e.target.value)} placeholder="Enter MoMo Transaction ID (numbers only)" className="w-full border-2 border-yellow-400 p-3.5 rounded-full text-black font-black" required />

        <button disabled={loading} className="w-full bg-black text-white py-4 rounded-full font-black text-sm disabled:opacity-50">
          {loading? 'Sending...' : `Submit For Verification - 15K ( ${user.email} )`}
        </button>
      </form>
    </div>
  )
}