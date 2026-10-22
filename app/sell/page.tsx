'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { auth, db, storage } from '@/lib/firebase'
import {
  collection, addDoc, query, where, doc, deleteDoc,
  updateDoc, onSnapshot, serverTimestamp, Timestamp, getDocs
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged, User } from 'firebase/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Rocket, MessageCircle, Truck, Trash2, Pencil, Check, X, Zap, Crown, Flame, Store, ExternalLink } from 'lucide-react'
import { payWithMomo } from '@/lib/api' // <-- LIVE PAYMENT ADDED

const CATEGORIES = [
  'Vehicles','Phones','Houses & Rentals','Electronics','Home, Furniture & Appliances','Health','Fashion','Sports, Arts & Outdoor','Babies & Kids','Animals & Pets','Agriculture & Food','Commercial Equipment & Tools','Repair & Construction','Stationery','Services','Jobs'
]

const BOOST_PACKAGES = [
  { id: 'quick', name: 'Quick Boost', price: 1000, durationDays: 1, desc: '24 Hours in Trending', icon: '⚡' },
  { id: 'standard', name: 'Standard Boost', price: 2000, durationDays: 3, desc: '3 Days in Trending', popular: true, icon: '🔥' },
  { id: 'seller', name: 'Seller Boost', price: 5000, durationDays: 7, desc: '7 Days + Top of Category', icon: '🚀' },
  { id: 'king', name: 'Hostel King', price: 10000, durationDays: 14, desc: '14 Days + Top 3 + VIP Badge', icon: '👑' },
]

type Product = {
  id: string
  title: string
  description: string
  price: number
  category: string
  images: string[]
  videoUrl: string
  whatsapp: string
  sellerId: string
  sellerEmail: string
  createdAt: Timestamp
  is_boosted?: boolean
  boosted_until?: Timestamp
  boosted_at?: Timestamp
  boost_pending?: boolean
  boostDurationDays?: number
  boostPackageId?: string
  shopId?: string
  shopName?: string
}
type ChatMsg = {
  id: string
  sellerId: string
  sellerEmail: string
  sender: 'seller' | 'admin'
  message: string
  createdAt: Timestamp
}

export default function SellPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [whatsapp, setWhatsapp] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [boostLoading, setBoostLoading] = useState<string | null>(null)
  const [showBoostModal, setShowBoostModal] = useState(false)
  const [selectedProductToBoost, setSelectedProductToBoost] = useState<Product | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(BOOST_PACKAGES[1])
  const [myShop, setMyShop] = useState<any>(null)
  const [momoPhone, setMomoPhone] = useState('') // <-- ADDED FOR PAYMENT

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (u) {
        const q = query(collection(db, 'products'), where('sellerId', '==', u.uid))
        const unsubProducts = onSnapshot(q, (snap) => {
          const items = snap.docs.map(d => ({ id: d.id,...d.data() } as Product))
          setProducts(items.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds))
        })
        const chatQ = query(collection(db, 'seller_admin_chats'), where('sellerId','==', u.uid))
        const unsubChat = onSnapshot(chatQ,
          (snap) => {
            const msgs = snap.docs.map(d => ({ id: d.id,...d.data() } as ChatMsg))
            msgs.sort((a:any,b:any)=> (a.createdAt?.seconds||0)-(b.createdAt?.seconds||0))
            setChatMessages(msgs)
          },
          (err) => { console.error("CHAT ERROR:", err) }
        )
        const fetchShop = async()=>{
          let snap = await getDocs(query(collection(db, 'shops'), where('ownerId','==', u.uid)))
          if(snap.empty) snap = await getDocs(query(collection(db, 'shops'), where('sellerId','==', u.uid)))
          if(!snap.empty) setMyShop({id:snap.docs[0].id,...snap.docs[0].data()})
          else setMyShop(null)
        }
        fetchShop()
        return () => { unsubProducts(); unsubChat(); }
      } else {
        setProducts([])
        setChatMessages([])
        setMyShop(null)
      }
    })
    return () => unsubAuth()
  }, [])

  const getShopDaysLeft = ()=>{
    if(!myShop?.paid_until) return 0
    try{
      const end = myShop.paid_until.toDate? myShop.paid_until.toDate() : new Date(myShop.paid_until)
      return Math.max(0, Math.ceil((end.getTime()-Date.now())/(1000*60*60*24)))
    }catch{return 0}
  }
  const isShopActive = ()=>{
    if(!myShop) return false
    if(myShop.is_active===false) return false
    return getShopDaysLeft()>0
  }

  const openBoostModal = (product: Product) => {
    if (!user) return alert("Login required")
    if (product.is_boosted && product.boosted_until && product.boosted_until.toDate() > new Date()) {
      return alert("This product is already boosted!")
    }
    if (product.boost_pending) {
      return alert("Already pending approval. Admin will approve soon.")
    }
    setSelectedProductToBoost(product)
    setSelectedPackage(BOOST_PACKAGES[1])
    setMomoPhone(product.whatsapp || '') // auto-fill with whatsapp
    setShowBoostModal(true)
  }

  // --- LIVE PAYMENT LOGIC - REPLACES MANUAL SEND ---
  const handleBoost = async () => {
    if (!selectedProductToBoost ||!user) return
    if (!momoPhone.match(/^256\d{9}$/)) return alert('Enter Momo number as 2567xxxxxxx')
    
    const product = selectedProductToBoost
    const pkg = selectedPackage
    const orderId = `BOOST-${product.id.slice(0,6).toUpperCase()}-${Date.now()}`
    setBoostLoading(product.id)
    
    try {
      // 1. CALL REAL MOMO API - customer gets PIN prompt
      await payWithMomo(momoPhone, pkg.price, orderId)
      
      // 2. Save request as pending payment verification
      await addDoc(collection(db, 'boost_requests'), {
        productId: product.id,
        productTitle: product.title,
        productImage: product.images[0] || '',
        sellerId: user.uid,
        sellerEmail: user.email,
        sellerPhone: momoPhone,
        amount: pkg.price,
        packageId: pkg.id,
        packageName: pkg.name,
        durationDays: pkg.durationDays,
        status: 'pending',
        paymentRef: orderId,
        paymentPhone: momoPhone,
        paymentStatus: 'pending',
        createdAt: serverTimestamp()
      })
      
      await updateDoc(doc(db, 'products', product.id), {
        boost_pending: true,
        boost_pending_packageId: pkg.id,
        boost_pending_packageName: pkg.name,
        boost_pending_durationDays: pkg.durationDays,
        boost_pending_amount: pkg.price,
        boost_pending_paymentRef: orderId
      })
      
      alert(`Momo request sent to ${momoPhone}!\nEnter PIN on your phone to pay ${pkg.price} UGX\nRef: ${orderId}`)
      setShowBoostModal(false)
    } catch (e:any) {
      console.error(e)
      alert("Payment Failed: " + e.message)
    }
    setBoostLoading(null)
  }

  const sendChat = async () => {
    if(!chatInput.trim() ||!user) return
    try {
      await addDoc(collection(db, 'seller_admin_chats'), {
        sellerId: user.uid,
        sellerEmail: user.email || '',
        sender: 'seller',
        message: chatInput.trim(),
        createdAt: serverTimestamp()
      })
      setChatInput('')
    } catch (e:any) {
      console.error(e)
      alert("Failed: " + e.message)
    }
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setPrice(''); setCategory(CATEGORIES[0]); setWhatsapp(''); setImageFiles([]); setVideoFile(null); setEditing(null)
  }

  const uploadFiles = async (uid: string) => {
    const imageUrls: string[] = []
    const timestamp = Date.now()
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const imgRef = ref(storage, `products/${uid}/${timestamp}_img_${i}_${file.name}`)
      const snap = await uploadBytes(imgRef, file)
      imageUrls.push(await getDownloadURL(snap.ref))
    }
    let videoUrl = ''
    if (videoFile) {
      const vidRef = ref(storage, `products/${uid}/${timestamp}_vid_${videoFile.name}`)
      const snap = await uploadBytes(vidRef, videoFile)
      videoUrl = await getDownloadURL(snap.ref)
    }
    return { imageUrls, videoUrl }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return alert('You must be logged in')
    if (!whatsapp.match(/^256\d{9}$/)) return alert('WhatsApp format: 2567xxxxxxx')
    setLoading(true)
    try {
      const { imageUrls, videoUrl } = await uploadFiles(user.uid)
      if (editing) {
        await updateDoc(doc(db, 'products', editing.id), {
          title, description, price: Number(price), category, whatsapp,
          images: imageUrls.length > 0? imageUrls : editing.images,
          videoUrl: videoUrl || editing.videoUrl,
        })
      } else {
        if (imageUrls.length === 0) throw new Error('Upload at least 1 photo')
        await addDoc(collection(db, 'products'), {
          title, description, price: Number(price), category, whatsapp,
          images: imageUrls, videoUrl, sellerId: user.uid,
          sellerEmail: user.email, createdAt: serverTimestamp(),
          is_boosted: false, boost_pending: false,
          shopId: isShopActive()? myShop.id : null,
          shopName: isShopActive()? myShop.shopName : null,
          ownerId: user.uid
        })
      }
      resetForm()
    } catch (err: any) {
      console.error(err); alert('Error: ' + err.message)
    }
    setLoading(false)
  }

  const handleEdit = (p: Product) => {
    setEditing(p); setTitle(p.title); setDescription(p.description); setPrice(String(p.price)); setCategory(p.category); setWhatsapp(p.whatsapp); setImageFiles([]); setVideoFile(null); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.title}"?`)) return
    try { await deleteDoc(doc(db, 'products', p.id)) } catch (err) { console.error(err); alert('Failed to delete') }
  }

  const getBoostStatus = (p: Product) => {
    if (p.is_boosted && p.boosted_until && p.boosted_until.toDate() > new Date()) {
      const hours = Math.ceil((p.boosted_until.toDate().getTime() - Date.now()) / 3600000)
      return { label: `BOOSTED • ${hours}h left`, color: 'bg-black text-white', active: true }
    }
    if (p.boost_pending) {
      const pendName = (p as any).boost_pending_packageName || 'Pending'
      return { label: `${pendName.toUpperCase()} PENDING`, color: 'bg-orange-500 text-white', active: false }
    }
    return null
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] shadow-xl border p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto text-2xl">🔒</div>
          <h1 className="text-xl font-black mt-4 text-black">Seller Login Required</h1>
          <p className="text-sm text-gray-500 mt-2">Login to post and manage products</p>
          <Link href="/admin" className="mt-5 block bg-black text-white py-3 rounded-full font-bold">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] text-black">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white font-black">S</div>
            <div>
              <p className="font-black text-[14px] leading-none">Seller Dashboard</p>
              <p className="text-[11px] text-gray-500">{user.email}</p>
            </div>
          </div>
          <Link href="/" className="bg-[#FDF8F3] border px-4 py-2 rounded-full text-[12px] font-bold">Home</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {!myShop? (
          <div className="bg-[#111] rounded-[20px] p-4 flex justify-between items-center mb-6 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center"><Store size={18} className="text-black"/></div>
              <div>
                <p className="font-black text-white text-[13px]">Upgrade to Official Shop 🏪</p>
                <p className="text-[11px] text-white/60">Stay on top of 2 categories for 60 days • Cart + Verified badge</p>
              </div>
            </div>
            <Link href="/create-shop" className="bg-yellow-400 text-black px-5 py-2.5 rounded-full font-black text-[11px]">15K UGX →</Link>
          </div>
        ) : (
          <div className={`rounded-[20px] p-4 mb-6 border ${isShopActive()? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isShopActive()?'bg-black text-white':'bg-red-600 text-white'}`}><Store size={18}/></div>
                <div>
                  <p className="font-black text-[14px]">{myShop.shopName} {isShopActive()? '✅' : '❌ Expired'}</p>
                  <p className="text-[11px] text-gray-600">sanel-ug.online/shop/{myShop.id} • {isShopActive()? `${getShopDaysLeft()} days left` : 'Renew needed'} • {myShop.categories?.join(", ")}</p>
                </div>
              </div>
              <span className={`text-[9px] px-2 py-1 rounded-full font-black ${isShopActive()?'bg-black text-white':'bg-red-600 text-white'}`}>{isShopActive()?'ACTIVE':'EXPIRED'}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>router.push('/my-shop')} className="flex-1 bg-black text-white text-center py-2.5 rounded-full font-black text-[11px] flex items-center justify-center gap-1"><Pencil size={12}/> Edit Shop</button>
              <Link href={`/shop/${myShop.id}`} className="flex-1 bg-white border text-center py-2.5 rounded-full font-bold text-[11px] flex items-center justify-center gap-1"><ExternalLink size={12}/> Public View</Link>
              <button onClick={()=>{navigator.clipboard.writeText(`https://sanel-ug.online/shop/${myShop.id}`); alert('Link copied!')}} className="flex-1 bg-white border text-center py-2.5 rounded-full font-bold text-[11px]">Copy Link</button>
            </div>
          </div>
        )}

        {/* BOOST MODAL - NOW WITH LIVE PAYMENT */}
        {showBoostModal && selectedProductToBoost && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] w-full max-w-[420px] p-5 shadow-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-[18px] flex items-center gap-2"><Rocket size={18}/> Boost Product</h3>
                  <p className="text-[12px] text-gray-500 mt-1">{selectedProductToBoost.title.slice(0,30)}...</p>
                </div>
                <button onClick={()=>setShowBoostModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><X size={14}/></button>
              </div>
              <div className="mt-5 grid gap-3">
                {BOOST_PACKAGES.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`text-left border rounded-2xl p-3.5 flex justify-between items-center transition-all ${selectedPackage.id === pkg.id? 'border-black bg-black text-white shadow-lg scale-[0.98]' : 'border-gray-200 bg-white hover:border-black'}`}
                  >
                    <div>
                      <p className="font-black text-[13px] flex items-center gap-2">{pkg.icon} {pkg.name} {pkg.popular && <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${selectedPackage.id===pkg.id?'bg-white text-black':'bg-black text-white'}`}>POPULAR</span>}</p>
                      <p className={`text-[11px] mt-0.5 ${selectedPackage.id===pkg.id?'text-white/70':'text-gray-500'}`}>{pkg.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[15px]">{pkg.price.toLocaleString()}</p>
                      <p className={`text-[10px] ${selectedPackage.id===pkg.id?'text-white/60':'text-gray-400'}`}>UGX</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* MOMO PHONE INPUT - LIVE */}
              <div className="mt-4 bg-[#FDF8F3] rounded-2xl p-3.5 border">
                <label className="text-[10px] font-black tracking-widest">MTN/AIRTEL NUMBER TO PAY FROM</label>
                <input 
                  value={momoPhone}
                  onChange={e=>setMomoPhone(e.target.value)}
                  placeholder="256772123456"
                  className="w-full mt-2 bg-white border p-3 rounded-xl text-[13px] font-bold outline-none focus:border-black"
                />
                <p className="text-[10px] text-gray-500 mt-2">You will receive a PIN prompt on this number for <b>{selectedPackage.price} UGX</b></p>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => setShowBoostModal(false)} className="flex-1 bg-gray-100 py-3.5 rounded-full font-bold text-[13px]">Cancel</button>
                <button onClick={handleBoost} disabled={boostLoading === selectedProductToBoost.id} className="flex-1 bg-black text-white py-3.5 rounded-full font-bold text-[13px] flex items-center justify-center gap-2">
                  {boostLoading? 'Sending Momo...' : <><Zap size={16}/> Pay {selectedPackage.price} UGX</>}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[24px] shadow-sm border p-5 md:p-6">
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-[20px] font-black">{editing? 'Edit Product' : 'Post New Product'} {isShopActive() && <span className="ml-2 text-[10px] bg-yellow-400 text-black px-2.5 py-1 rounded-full">+ SHOP {myShop.shopName}</span>}</h1>
            {editing && <button onClick={resetForm} className="text-[12px] font-bold bg-gray-100 px-3 py-1.5 rounded-full">Cancel Edit</button>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full bg-[#FDF8F3] border border-transparent focus:border-black focus:bg-white outline-none p-3.5 rounded-2xl text-[14px] font-medium placeholder:text-gray-400 transition" placeholder="Product Title e.g iPhone 13 128GB" value={title} onChange={e => setTitle(e.target.value)} required />
            <textarea className="w-full bg-[#FDF8F3] border border-transparent focus:border-black focus:bg-white outline-none p-3.5 rounded-2xl text-[14px] font-medium placeholder:text-gray-400 transition" placeholder="Description, condition, location..." value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
            <div className="grid md:grid-cols-3 gap-3">
              <input className="w-full bg-[#FDF8F3] border border-transparent focus:border-black focus:bg-white outline-none p-3.5 rounded-2xl text-[14px] font-medium" type="number" placeholder="Price UGX" value={price} onChange={e => setPrice(e.target.value)} required min="0" />
              <select className="w-full bg-[#FDF8F3] border border-transparent focus:border-black outline-none p-3.5 rounded-2xl text-[14px] font-bold" value={category} onChange={e => setCategory(e.target.value)} required>{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
              <input className="w-full bg-[#FDF8F3] border border-transparent focus:border-black focus:bg-white outline-none p-3.5 rounded-2xl text-[14px] font-medium" placeholder="WhatsApp 2567xxxxxxx" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-[#FDF8F3] rounded-2xl p-3 border border-dashed"><label className="text-[11px] font-black tracking-widest text-gray-500">PHOTOS {editing && '(leave empty to keep)'}</label><input type="file" multiple accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setImageFiles(Array.from(e.target.files || []))} required={!editing} className="w-full mt-2 text-[12px]" /></div>
              <div className="bg-[#FDF8F3] rounded-2xl p-3 border border-dashed"><label className="text-[11px] font-black tracking-widest text-gray-500">VIDEO (optional)</label><input type="file" accept="video/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setVideoFile(e.target.files?.[0] || null)} className="w-full mt-2 text-[12px]" /></div>
            </div>
            <button disabled={loading} className="w-full bg-black text-white py-4 rounded-full font-black text-[14px] disabled:opacity-50 flex items-center justify-center gap-2">{loading? 'Saving...' : editing? <><Pencil size={16}/> Update Product</> : <><Zap size={16}/> {isShopActive()? `Post to ${myShop.shopName}` : 'Post Product'}</>}</button>
          </form>
        </div>

        <h2 className="text-[18px] font-black mt-8 mb-3">My Products <span className="bg-black text-white text-[11px] px-2.5 py-1 rounded-full ml-2">{products.length}</span></h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => {
              const boostStatus = getBoostStatus(p)
              return (
                <div key={p.id} className={`bg-white rounded-[20px] overflow-hidden border shadow-sm flex flex-col ${p.is_boosted? 'ring-2 ring-yellow-400' : ''}`}>
                  <div className="relative bg-gray-100">
                    {p.images[0] && (<img src={p.images[0]} className="w-full h-48 object-cover" alt={p.title} />)}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className="bg-black/80 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-full font-bold">{p.category}</span>
                      {p.shopId && <span className="bg-yellow-400 text-black text-[9px] px-2 py-1 rounded-full font-black">SHOP</span>}
                      {boostStatus && <span className={`text-[9px] px-2.5 py-1 rounded-full font-black flex items-center gap-1 ${boostStatus.color}`}><Flame size={10}/>{boostStatus.label}</span>}
                    </div>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col">
                    <h3 className="font-black text-[13px] line-clamp-2 min-h-[32px]">{p.title}</h3>
                    <p className="font-black text-[16px] mt-2">{p.price.toLocaleString()} <span className="text-[11px] font-bold text-gray-400">UGX</span></p>
                    <div className="mt-3 space-y-2">
                      {!boostStatus?.active && (
                        <button onClick={() => openBoostModal(p)} disabled={!!p.boost_pending || boostLoading === p.id} className={`w-full py-3 rounded-full font-black text-[12px] flex items-center justify-center gap-1.5 ${p.boost_pending? 'bg-gray-100 text-gray-400' : 'bg-[#FFF7ED] border border-black text-black hover:bg-black hover:text-white transition'}`}>
                          <Rocket size={14}/>{boostLoading === p.id? 'Sending...' : p.boost_pending? 'Waiting Approval' : 'Boost From 1k UGX'}
                        </button>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(p)} className="flex-1 bg-gray-100 py-2.5 rounded-full font-bold text-[11px] flex items-center justify-center gap-1"><Pencil size={12}/> Edit</button>
                        <button onClick={() => handleDelete(p)} className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-full font-bold text-[11px] flex items-center justify-center gap-1"><Trash2 size={12}/> Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}