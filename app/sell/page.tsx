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
import { Rocket, MessageCircle, Truck, Trash2, Pencil, Check, X, Zap, Crown, Flame } from 'lucide-react'

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
        return () => { unsubProducts(); unsubChat(); }
      } else {
        setProducts([])
        setChatMessages([])
      }
    })
    return () => unsubAuth()
  }, [])

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
    setShowBoostModal(true)
  }

  const handleBoost = async () => {
    if (!selectedProductToBoost ||!user) return
    const product = selectedProductToBoost
    const pkg = selectedPackage
    setBoostLoading(product.id)
    try {
      await addDoc(collection(db, 'boost_requests'), {
        productId: product.id,
        productTitle: product.title,
        productImage: product.images[0] || '',
        sellerId: user.uid,
        sellerEmail: user.email,
        sellerPhone: product.whatsapp,
        amount: pkg.price,
        packageId: pkg.id,
        packageName: pkg.name,
        durationDays: pkg.durationDays,
        status: 'pending',
        createdAt: serverTimestamp()
      })
      await updateDoc(doc(db, 'products', product.id), {
        boost_pending: true,
        boost_pending_packageId: pkg.id,
        boost_pending_packageName: pkg.name,
        boost_pending_durationDays: pkg.durationDays,
        boost_pending_amount: pkg.price
      })
      alert(`Boost request sent!\n${pkg.name} - ${pkg.price} UGX for ${pkg.durationDays} days\n\nSend ${pkg.price} to 0767483636 with reason BOOST ${product.id.slice(0,6)}`)
      setShowBoostModal(false)
    } catch (e:any) {
      console.error(e)
      alert("Failed: " + e.message)
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
          is_boosted: false, boost_pending: false
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
      {/* MODERN HEADER */}
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
        {/* BOOST MODAL - MODERN */}
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
              <div className="mt-4 bg-[#FDF8F3] rounded-2xl p-3.5 border border-dashed">
                <p className="font-bold text-[12px]">Pay to 0767483636</p>
                <p className="text-[11px] mt-1">Send <b>{selectedPackage.price} UGX</b> • Reason: <b className="bg-black text-white px-2 py-0.5 rounded-full">BOOST {selectedProductToBoost.id.slice(0,6).toUpperCase()}</b></p>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setShowBoostModal(false)} className="flex-1 bg-gray-100 py-3.5 rounded-full font-bold text-[13px]">Cancel</button>
                <button onClick={handleBoost} disabled={boostLoading === selectedProductToBoost.id} className="flex-1 bg-black text-white py-3.5 rounded-full font-bold text-[13px] flex items-center justify-center gap-2">
                  {boostLoading? 'Sending...' : <><Check size={16}/> I Have Paid</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORM CARD */}
        <div className="bg-white rounded-[24px] shadow-sm border p-5 md:p-6">
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-[20px] font-black">{editing? 'Edit Product' : 'Post New Product'} <span className="ml-2 text-[11px] bg-black text-white px-2.5 py-1 rounded-full">{editing? 'EDITING' : 'NEW'}</span></h1>
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
            <button disabled={loading} className="w-full bg-black text-white py-4 rounded-full font-black text-[14px] disabled:opacity-50 flex items-center justify-center gap-2">{loading? 'Saving...' : editing? <><Pencil size={16}/> Update Product</> : <><Zap size={16}/> Post Product</>}</button>
          </form>
        </div>

        {/* DELIVERY CARD */}
        <div className="mt-6 bg-black rounded-[24px] p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"><Truck size={20}/></div>
            <div><h3 className="font-black text-[14px]">Need Delivery?</h3><p className="text-[12px] text-white/60">Affordable campus delivery</p></div>
          </div>
          <div className="flex gap-2">
            <a href="https://wa.me/256775760430?text=Hi%20Sanel%20Delivery,%20I%20need%20delivery" target="_blank" className="flex-1 md:flex-none bg-white text-black px-5 py-3 rounded-full font-black text-[12px] text-center">WhatsApp</a>
            <a href="tel:+256775760430" className="flex-1 md:flex-none bg-white/10 border border-white/20 px-5 py-3 rounded-full font-black text-[12px] text-center">Call Us</a>
          </div>
        </div>

        {/* CHAT */}
        <div className="mt-6 bg-white rounded-[24px] border shadow-sm overflow-hidden">
          <button onClick={()=>setChatOpen(!chatOpen)} className="w-full p-4 flex justify-between items-center font-black text-[14px]">
            <span className="flex items-center gap-2"><MessageCircle size={16}/> Talk to Admin {chatMessages.length>0 && <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">{chatMessages.length}</span>}</span>
            <span className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition ${chatOpen?'rotate-180':''}`}>▼</span>
          </button>
          {chatOpen && (
            <div className="border-t">
              <div className="h-72 overflow-y-auto bg-[#FDF8F3] p-3 space-y-2">
                {chatMessages.length===0 && <p className="text-center text-[12px] text-gray-400 mt-10">No messages yet. Ask admin anything.</p>}
                {chatMessages.map(m=>(
                  <div key={m.id} className={`flex ${m.sender==='seller'? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] px-3.5 py-2.5 rounded-[16px] text-[12px] font-medium ${m.sender==='seller'? 'bg-black text-white rounded-br-[4px]' : 'bg-white border text-black rounded-bl-[4px]'}`}>
                      {m.message}
                      <div className="text-[9px] opacity-60 mt-1">{m.createdAt?.toDate? m.createdAt.toDate().toLocaleTimeString() : '...'}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 flex gap-2 bg-white">
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=> e.key==='Enter' && sendChat()} placeholder="Message admin..." className="flex-1 bg-[#FDF8F3] rounded-full px-4 py-3 text-[13px] outline-none focus:bg-white focus:ring-2 focus:ring-black" />
                <button onClick={sendChat} className="bg-black text-white w-12 h-12 rounded-full font-black flex items-center justify-center">↑</button>
              </div>
            </div>
          )}
        </div>

        {/* PRODUCTS */}
        <h2 className="text-[18px] font-black mt-8 mb-3">My Products <span className="bg-black text-white text-[11px] px-2.5 py-1 rounded-full ml-2">{products.length}</span></h2>
        {products.length === 0? (
          <div className="bg-white rounded-[24px] border p-10 text-center"><p className="text-3xl">📦</p><p className="font-bold mt-2">No products yet</p><p className="text-[12px] text-gray-500">Post your first product above</p></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => {
              const boostStatus = getBoostStatus(p)
              return (
                <div key={p.id} className={`bg-white rounded-[20px] overflow-hidden border shadow-sm flex flex-col ${p.is_boosted? 'ring-2 ring-yellow-400' : ''}`}>
                  <div className="relative bg-gray-100">
                    {p.images[0] && (<img src={p.images[0]} className="w-full h-48 object-cover" alt={p.title} />)}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className="bg-black/80 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-full font-bold">{p.category}</span>
                      {boostStatus && <span className={`text-[9px] px-2.5 py-1 rounded-full font-black flex items-center gap-1 ${boostStatus.color}`}><Flame size={10}/>{boostStatus.label}</span>}
                    </div>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col">
                    <h3 className="font-black text-[13px] line-clamp-2 min-h-[32px]">{p.title}</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{p.description}</p>
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
        )}
      </div>
    </div>
  )
}