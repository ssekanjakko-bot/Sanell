"use client"
import { useEffect, useState } from "react"
import { doc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Share2 } from "lucide-react"

export default function ProductDetailsPage(){
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [activeImg, setActiveImg] = useState("")
  const [related, setRelated] = useState<any[]>([])

  useEffect(()=>{
    if(!id) return
    const unsub = onSnapshot(doc(db, "products", id as string), snap=>{
      if(snap.exists()){
        const data = { id: snap.id,...snap.data() } as any
        setProduct(data)
        setActiveImg(data.images?.[0] || "")
      }
    })
    return ()=>unsub()
  }, [id])

  useEffect(()=>{
    if(!product?.category) return
    const q = query(collection(db, "products"), where("category", "==", product.category), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, snap=>{
      setRelated(snap.docs.map(d=>({id:d.id,...d.data()})).filter((p:any)=>p.id!==id).slice(0,6))
    })
    return ()=>unsub()
  }, [product?.category, id])

  const handleWhatsApp = () => {
    let phone = product?.whatsapp || product?.whatsApp || product?.phone
    if(!phone) return alert("No WhatsApp")
    let clean = phone.toString().replace(/\D/g,'')
    if(clean.startsWith('0')) clean='256'+clean.substring(1)
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(`Hi, I'm interested in ${product.title} - ${product.price} UGX on Sanel Ug ${window.location.href}`)}`, '_blank')
  }

  if(!product) return <div className="min-h-screen bg-white p-6 text-center pt-20">Loading product...</div>

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <div className="sticky top-0 z-20 bg-white p-3 flex justify-between items-center shadow-sm">
        <button onClick={()=>router.back()} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center"><ArrowLeft size={16}/></button>
        <span className="font-black text-[13px]">Details</span>
        <button onClick={()=>{
          if(navigator.share) navigator.share({title:product.title, url:window.location.href})
          else { navigator.clipboard.writeText(window.location.href); alert("Link copied") }
        }} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"><Share2 size={16}/></button>
      </div>

      <div className="bg-white">
        <div className="relative bg-gray-100">
          <img src={activeImg} className="w-full h-[380px] object-contain" />
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[11px] px-3 py-1 rounded-full font-bold">
            {product.images?.findIndex((i:string)=>i===activeImg)+1} / {product.images?.length}
          </div>
        </div>
        <div className="flex gap-2 p-3 overflow-x-auto">
          {product.images?.map((img:string, idx:number)=>(
            <button key={idx} onClick={()=>setActiveImg(img)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 ${activeImg===img?'border-orange-600':'border-gray-200'}`}>
              <img src={img} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-white mt-2">
        <span className="bg-orange-100 text-orange-700 text-[11px] px-3 py-1 rounded-full font-bold">{product.category}</span>
        <h1 className="font-black text-[20px] mt-3 text-black">{product.title}</h1>
        <p className="font-black text-[24px] mt-2 text-[#B45309]">{product.price} UGX</p>
        <p className="text-[14px] text-gray-700 mt-4 whitespace-pre-wrap">{product.description || "No description"}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={handleWhatsApp} className="w-full bg-green-600 text-white py-4 rounded-full font-black">WhatsApp Seller</button>
          <button onClick={()=>router.back()} className="w-full bg-black text-white py-3 rounded-full font-bold">Back to Black Market</button>
        </div>
      </div>

      {related.length>0 && (
        <div className="mt-4 p-3">
          <h2 className="font-black mb-3">More in {product.category}</h2>
          <div className="flex gap-3 overflow-x-auto">
            {related.map((p:any)=>(
              <Link key={p.id} href={`/product/${p.id}`} className="min-w-[150px] bg-white rounded-xl border overflow-hidden">
                <img src={p.images?.[0]} className="w-full h-28 object-cover" />
                <div className="p-2"><p className="text-[11px] font-bold line-clamp-2">{p.title}</p><p className="text-[12px] font-black text-[#B45309]">{p.price} UGX</p></div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}