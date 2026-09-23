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

const COFFEE_BROWN = '#6F4E37'
const COFFEE_LIGHT = '#A67B5B'

const CATEGORIES = [
  'Vehicles','Phones','Houses & Rentals','Electronics','Home, Furniture & Appliances','Health','Fashion','Sports, Arts & Outdoor','Babies & Kids','Animals & Pets','Agriculture & Food','Commercial Equipment & Tools','Repair & Construction','Stationery','Services','Jobs'
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

  // === BOOST LOGIC ===
  const handleBoost = async (product: Product) => {
    if (!user) return alert("Login required")
    if (product.is_boosted && product.boosted_until && product.boosted_until.toDate() > new Date()) {
      return alert("This product is already boosted!")
    }
    if (product.boost_pending) {
      return alert("Already pending approval. Admin will approve soon.")
    }

    const confirmBoost = confirm(`Boost "${product.title}" for 2,000 UGX?\n\nIt will appear in Trending section under hero banner for 24h.\n\nPay to: MTN 0775760430\nReason: BOOST ${product.id.slice(0,6)}\n\nClick OK then click "I have paid"`)
    if (!confirmBoost) return

    setBoostLoading(product.id)
    try {
      // 1. Create boost request for admin panel
      await addDoc(collection(db, 'boost_requests'), {
        productId: product.id,
        productTitle: product.title,
        productImage: product.images[0] || '',
        sellerId: user.uid,
        sellerEmail: user.email,
        sellerPhone: product.whatsapp,
        amount: 2000,
        status: 'pending',
        createdAt: serverTimestamp()
      })

      // 2. Mark product as pending
      await updateDoc(doc(db, 'products', product.id), {
        boost_pending: true
      })

      alert("Boost request sent! Admin will approve after payment.\n\nSend 2k to 0767483636 with reason BOOST")
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
      return { label: `🔥 BOOSTED - ${hours}h left`, color: 'bg-yellow-400 text-black', active: true }
    }
    if (p.boost_pending) {
      return { label: '⏳ PENDING APPROVAL', color: 'bg-orange-400 text-white', active: false }
    }
    return null
  }

  if (!user) {
    return (
      <div className="p-8 text-center min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
        <h1 className="text-2xl font-bold mb-4" style={{ color: COFFEE_BROWN }}>Seller Login Required</h1>
        <Link href="/admin" className="text-white px-6 py-2 rounded font-medium inline-block" style={{ backgroundColor: COFFEE_BROWN }}>Go to Login</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: COFFEE_BROWN }}>{editing? 'Edit Product' : 'Post New Product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-lg mb-10 border-t-4" style={{ borderColor: COFFEE_BROWN }}>
        <input className="w-full p-3 border rounded text-black placeholder:text-gray-600" style={{ borderColor: COFFEE_LIGHT }} placeholder="Product Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea className="w-full p-3 border rounded text-black placeholder:text-gray-600" style={{ borderColor: COFFEE_LIGHT }} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
        <div className="grid md:grid-cols-3 gap-4">
          <input className="w-full p-3 border rounded text-black placeholder:text-gray-600" style={{ borderColor: COFFEE_LIGHT }} type="number" placeholder="Price UGX" value={price} onChange={e => setPrice(e.target.value)} required min="0" />
          <select className="w-full p-3 border rounded text-black" style={{ borderColor: COFFEE_LIGHT, color: COFFEE_BROWN }} value={category} onChange={e => setCategory(e.target.value)} required>{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
          <input className="w-full p-3 border rounded text-black placeholder:text-gray-600" style={{ borderColor: COFFEE_LIGHT }} placeholder="WhatsApp: 2567xxxxxxx" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required />
        </div>
        <div><label className="block mb-1 font-medium" style={{ color: COFFEE_BROWN }}>Photos: {editing && '(Leave empty to keep current)'}</label><input type="file" multiple accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setImageFiles(Array.from(e.target.files || []))} required={!editing} className="w-full" /></div>
        <div><label className="block mb-1 font-medium" style={{ color: COFFEE_BROWN }}>Video: {editing && '(Leave empty to keep current)'}</label><input type="file" accept="video/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setVideoFile(e.target.files?.[0] || null)} className="w-full" /></div>
        <div className="flex gap-2">
          <button disabled={loading} className="text-white px-6 py-2 rounded font-medium disabled:opacity-50" style={{ backgroundColor: COFFEE_BROWN }}>{loading? 'Saving...' : editing? 'Update Product' : 'Post Product'}</button>
          {editing && (<button type="button" onClick={resetForm} className="px-6 py-2 border rounded font-medium" style={{ borderColor: COFFEE_BROWN, color: COFFEE_BROWN }}>Cancel</button>)}
        </div>
      </form>

      <div className=" mt-6 mb-10 p-5 border rounded-xl bg-amber-50 border-amber-200 text-center">
        <h3 className="text-lg font-bold text-[#6F4E37] mb-2">🛵 Need Delivery?</h3>
        <p className="text-sm text-gray-700 mb-4">We can carry out deliveries for you at affordable prices.</p>
        <div className="flex gap-3">
          <a href="https://wa.me/256775760430?text=Hi%20Sanel%20Delivery,%20I%20need%20delivery%20for%20my%20product" target="_blank" rel="nooperner noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg"><span>💬</span>WhatsApp</a>
          <a href="tel:+256775760430" className="flex-1 flex items-center justify-center gap-2 bg-[#6F4E37] hover:bg-[#5A3E2C] text-white font-semibold py-3 px-4 rounded-lg"><span>☎️</span> Call Us</a>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg mb-10 border">
        <button onClick={()=>setChatOpen(!chatOpen)} className="w-full p-4 flex justify-between items-center font-bold" style={{color: COFFEE_BROWN}}>
          <span>💬 Talk to Admin {chatMessages.length > 0 && `(${chatMessages.length})`}</span>
          <span>{chatOpen? '▲' : '▼'}</span>
        </button>
        {chatOpen && (
          <div className="border-t p-4">
            <div className="h-72 overflow-y-auto bg-[#FDF8F3] p-3 rounded mb-3 space-y-2">
              {chatMessages.length===0 && <p className="text-gray-500 text-sm text-center">No messages yet.</p>}
              {chatMessages.map(m=>(
                <div key={m.id} className={`flex ${m.sender==='seller'? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm font-medium border ${m.sender==='seller'? 'bg-green-600 text-white' : 'bg-white text-green-700 border-green-600'}`}>
                    {m.message}
                    <div className="text-[10px] opacity-70 mt-1">{m.createdAt?.toDate? m.createdAt.toDate().toLocaleString() : 'Sending...'}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=> e.key==='Enter' && sendChat()} placeholder="Type message to admin..." className="flex-1 p-3 border-2 rounded text-green-700 font-medium placeholder:text-gray-400 focus:border-green-600 outline-none" />
              <button onClick={sendChat} className="bg-green-600 hover:bg-green-700 text-white px-6 rounded font-bold">Send</button>
            </div>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-4" style={{ color: COFFEE_BROWN }}>My Products ({products.length})</h2>
      {products.length === 0? (<p className="text-gray-500">You haven't posted any products yet.</p>) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => {
            const boostStatus = getBoostStatus(p)
            return (
              <div key={p.id} className={`border rounded-lg overflow-hidden shadow-sm bg-white ${p.is_boosted? 'border-yellow-400 border-2' : ''}`}>
                {p.images[0] && (<img src={p.images[0]} className="w-full h-48 object-cover" alt={p.title} />)}
                {p.videoUrl && (<video src={p.videoUrl} controls className="w-full h-48 bg-black" />)}
                <div className="p-4">
                  <div className="flex gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded-full text-white inline-block" style={{ backgroundColor: COFFEE_LIGHT }}>{p.category}</span>
                    {boostStatus && <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${boostStatus.color}`}>{boostStatus.label}</span>}
                  </div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: COFFEE_BROWN }}>{p.title}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{p.description}</p>
                  <p className="font-bold text-xl mb-3" style={{ color: COFFEE_BROWN }}>{p.price.toLocaleString()} UGX</p>

                  {/* BOOST BUTTON - NEW */}
                  {!boostStatus?.active && (
                    <button
                      onClick={() => handleBoost(p)}
                      disabled={!!p.boost_pending || boostLoading === p.id}
                      className={`w-full py-2.5 rounded font-bold mb-2 text-sm flex items-center justify-center gap-2 ${p.boost_pending? 'bg-gray-300 text-gray-600' : 'bg-yellow-400 hover:bg-yellow-500 text-black'}`}
                    >
                      {boostLoading === p.id? 'Sending...' : p.boost_pending? '⏳ Waiting Approval' : '🚀 Boost for 2k - Trending'}
                    </button>
                  )}

                  <a href={`https://wa.me/${p.whatsapp}?text=Hi, I'm interested in: ${encodeURIComponent(p.title)}`} target="_blank" rel="noopener noreferrer" className="block w-full text-white text-center py-2 rounded font-medium mb-2" style={{ backgroundColor: '#25D366' }}>WhatsApp</a>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="flex-1 text-white py-2 rounded font-medium" style={{ backgroundColor: COFFEE_LIGHT }}>Edit</button>
                    <button onClick={() => handleDelete(p)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded font-medium">Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}