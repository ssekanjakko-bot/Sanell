"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Coffee, Eye, X } from "lucide-react"

const CATEGORIES = [
  {name: 'All', icon: '🌐'}, {name: 'Electronics', icon: '📱'}, {name: 'Home, Furniture & Appliances', icon: '🛋️'},
  {name: 'Health', icon: '💊'}, {name: 'Fashion', icon: '👗'},
  {name: 'Sports, Arts & Outdoor', icon: '⚽'}, {name: 'Babies & Kids', icon: '🧸'},
  {name: 'Animals & Pets', icon: '🐶'}, {name: 'Agriculture & Food', icon: '🌾'},
  {name: 'Commercial Equipment & Tools', icon: '🔧'}, {name: 'Repair & Construction', icon: '🔨'},
  {name: 'Stationery', icon: '📚'}, {name: 'Services', icon: '❤️'},
  {name: 'Jobs', icon: '📢'}
]

const BOTTOM_NAV = [
  { name: 'Home', icon: '🏠', href: '/' },
  { name: 'FAQs', icon: '💬', href: '/chat' },
  { name: 'stress-clinic', icon: '🧠', href: '/games' },
  { name: 'Profile', icon: '👤', href: '/profile' }
]

// === NEW MODAL COMPONENT - HANDLES MANY IMAGES ===
function ProductViewModal({ product, onClose, onWhatsApp }: any) {
  const [activeImg, setActiveImg] = useState(product.images?.[0])

  useEffect(() => {
    setActiveImg(product.images?.[0])
  }, [product])

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-[420px] w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center z-20">
          <X size={16} />
        </button>

        {/* BIG IMAGE THAT CHANGES */}
        <div className="relative bg-gray-100">
          <img src={activeImg} alt={product.title} className="w-full h-80 object-contain bg-gray-100" />
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded-full">
            {product.images?.findIndex((i:string)=>i===activeImg)+1} / {product.images?.length}
          </div>
        </div>

        {/* THUMBNAILS - NOW SCROLLS AND CLICKABLE FOR MANY IMAGES */}
        {product.images?.length > 1 && (
          <div className="flex gap-2 p-2 overflow-x-auto bg-white">
            {product.images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImg(img)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImg === img? 'border-orange-600' : 'border-transparent opacity-70'}`}
              >
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-4">
          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-md">{product.category}</span>
          <h2 className="font-bold text-xl mt-2">{product.title}</h2>
          <p className="font-bold text-2xl text-orange-700 mt-1">{product.price} UGX</p>
          <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{product.description || "No description"}</p>

          <div className="mt-5 flex flex-col gap-2">
            <button onClick={() => onWhatsApp(product)} className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-full font-bold">
              📞 WhatsApp Seller
            </button>
            <button onClick={onClose} className="w-full bg-gray-100 text-black py-3 rounded-full font-bold text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewProduct, setViewProduct] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => setBanners(snap.docs.map(d => ({id: d.id,...d.data()}))))
    return () => unsub()
  }, [])

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || banners.length <= 1) return;
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % banners.length;
      el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id,...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory
      const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, selectedCategory, search])

  const handleWhatsApp = (product: any) => {
    try {
      let phone = product.whatsapp || product.whatsApp || product.WhatsApp
      if(!phone) return alert("Seller did not add WhatsApp number to this product")
      let cleanPhone = phone.toString().replace(/\D/g, '')
      if(cleanPhone.startsWith('0')) cleanPhone = '256' + cleanPhone.substring(1)
      else if(!cleanPhone.startsWith('256')) cleanPhone = '256' + cleanPhone
      if(cleanPhone.length < 12) return alert("Invalid phone number: " + phone)
      const message = `*Hello! I'm interested in this product* 👋\n\n*📦 PRODUCT DETAILS*\n*Title:* ${product.title}\n*Category:* ${product.category}\n*Price:* ${product.price} UGX\n\n${product.description? `*Description:* ${product.description}` : ''}\n\n${product.images?.[0]? `*Image:* ${product.images[0]}` : ''}\n\nIs it still available?`
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      window.location.href = whatsappUrl
    } catch (error) {
      console.error("WhatsApp Error:", error)
      alert("Failed to open WhatsApp")
    }
  }

  return (
    <div className="min-h-screen pb-20 bg-[#FDF8F3] relative">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg" style={{color: '#8B4513'}}>Sanel Ug</span>
            <Link href="/about" className="text-xs text-gray-500">About</Link>
          </div>
          <div className="flex gap-1.5 text-xs">
            <Link href="/support" className="bg-black text-white px-2 py-1 rounded-md">Support</Link>
            <select className="bg-black text-white px-2 py-1 rounded-md"><option>MUBS</option></select>
          </div>
        </div>
        <div className="px-3 pb-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="w-full bg-[#1a1a1a] text-white rounded-lg p-3 text-sm placeholder:text-gray-400" />
        </div>
        <div className="px-3 pb-3 flex gap-2 overflow-x-auto">
          <Link href="/movies" className="bg-black text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap">🎬 Movies</Link>
          <Link href="/stores" className="bg-black text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap">⚽ Live Sports</Link>
        </div>
        <div className="px-3 pb-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className={`flex flex-col items-center gap-1 min-w-[80px] ${selectedCategory === cat.name? 'text-orange-600 font-bold' : 'text-gray-700'}`}>
                <div className={`text-2xl p-2 rounded-full ${selectedCategory === cat.name? 'bg-orange-100' : 'bg-white shadow'}`}>{cat.icon}</div>
                <span className="text-xs leading-tight text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 pt-2">
        {banners.length > 0 && (
          <div ref={scrollRef} className="flex overflow-x-hidden scroll-smooth rounded-2xl">
            {banners.map((b) => (
              <Link key={b.id} href={b.link || "/"} className="w-full flex-shrink-0">
                <img src={b.imageUrl} alt="banner" className="w-full h-44 object-cover rounded-2xl"/>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="p-3">
        <h2 className="font-bold text-lg mb-3">Listings ({filteredProducts.length})</h2>
        {loading? <p>Loading...</p> : filteredProducts.length === 0? <p>No products found</p> : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white rounded-lg shadow-sm overflow-hidden border relative group">
                <div className="relative w-full h-40 bg-gray-100">
                  <img src={p.images?.[0]} alt={p.title} className="w-full h-40 object-cover" onError={(e: any) => e.target.src="https://placehold.co/400x400/FDF8F3/8B4513?text=No+Image"} />
                  <button onClick={() => setViewProduct(p)} className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80 transition shadow">
                    <Eye size={14} />
                  </button>
                  {p.images?.length > 1 && (
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">+{p.images.length}</span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs bg-orange-100 text-orange-700 w-fit px-2 py-0.5 rounded-md mb-1">{p.category}</p>
                  <p className="font-bold text-sm mb-1 line-clamp-2">{p.title}</p>
                  <p className="font-bold text-lg text-orange-700 mb-2">{p.price} UGX</p>
                  <button onClick={() => handleWhatsApp(p)} className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2.5 rounded-md flex items-center justify-center gap-1 font-bold shadow-md">
                    📞 WhatsApp Seller
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FIXED MODAL */}
      {viewProduct && <ProductViewModal product={viewProduct} onClose={() => setViewProduct(null)} onWhatsApp={handleWhatsApp} />}

      <button onClick={() => router.push('/sell')} className="fixed bottom-20 right-4 bg-amber-800 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-40 hover:scale-110 transition">
        <Coffee size={28} />
      </button>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center py-1 z-30">
        {BOTTOM_NAV.map((nav) => (
          <button key={nav.name} onClick={() => router.push(nav.href)} className={`flex flex-col items-center text-xs pt-1 ${pathname === nav.href? 'text-orange-600' : 'text-gray-500'}`}>
            <span className="text-2xl">{nav.icon}</span>
            {nav.name}
          </button>
        ))}
      </div>
    </div>
  )
}