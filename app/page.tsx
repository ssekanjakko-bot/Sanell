"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

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
  { name: 'Chat', icon: '💬', href: '/chat' },
  { name: 'stress-clinic', icon: '🧠', href: '/stress-clinic' },
  { name: 'Profile', icon: '👤', href: '/profile' }
]

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null);

  // FETCH BANNERS
  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => setBanners(snap.docs.map(d => ({id: d.id, ...d.data()}))))
    return () => unsub()
  }, [])

  // AUTO SLIDE
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

  // FETCH REAL PRODUCTS
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // FILTER: Category + Search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, selectedCategory, search])

  const whatsappLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`

  return (
    <div className="min-h-screen pb-20 bg-[#FDF8F3]">
      
      {/* HEADER */}
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg" style={{color: '#8B4513'}}>Sanel Ug</span>
            <Link href="/about" className="text-xs text-gray-500">About</Link>
          </div>
          <div className="flex gap-1.5 text-xs">
            <Link href="/get-app" className="bg-black text-white px-2 py-1 rounded-md">GetApp</Link>
            <Link href="/tools" className="bg-black text-white px-2 py-1 rounded-md">Tools</Link>
            <Link href="/support" className="bg-black text-white px-2 py-1 rounded-md">Support</Link>
            <select className="bg-black text-white px-2 py-1 rounded-md"><option>MUBS</option></select>
          </div>
        </div>

        {/* SEARCH - WORKS NOW */}
        <div className="px-3 pb-3">
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products" 
            className="w-full bg-[#1a1a1a] text-white rounded-lg p-3 text-sm placeholder:text-gray-400"
          />
        </div>

        {/* 4 BLACK BUTTONS */}
        <div className="px-3 pb-3 flex gap-2 overflow-x-auto">
          {['🎬 Movies','⚽ Live Sports','📄 Invoices','🏷️ Receipts'].map(btn => (
            <button key={btn} className="bg-black text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap">{btn}</button>
          ))}
        </div>

        {/* CATEGORIES - CLICKABLE NOW */}
        <div className="grid grid-cols-4 gap-y-4 px-3 pb-4 text-center text-xs">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.name} 
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex flex-col items-center gap-1 ${selectedCategory === cat.name ? 'text-orange-600 font-bold' : 'text-gray-700'}`}
            >
              <div className={`text-2xl p-2 rounded-full ${selectedCategory === cat.name ? 'bg-orange-100' : 'bg-white shadow'}`}>{cat.icon}</div>
              <span className="leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* BANNER SLIDER */}
      <div className="px-3 pt-2">
        {banners.length > 0 && (
          <div ref={scrollRef} className="flex overflow-x-hidden scroll-smooth rounded-2xl">
            {banners.map((b) => (
              <Link key={b.id} href={b.link || "/"} className="w-full flex-shrink-0">
                <img src={b.imageUrl} className="w-full h-44 object-cover rounded-2xl"/>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* LISTINGS WITH WHATSAPP */}
      <div className="p-3">
        <h2 className="font-bold text-lg mb-3">Listings ({filteredProducts.length})</h2>
        {loading ? <p>Loading...</p> : filteredProducts.length === 0 ? <p>No products found</p> : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white rounded-lg shadow-sm overflow-hidden border">
                <img src={p.imageUrl} className="w-full h-40 object-cover"/>
                <div className="p-2">
                  <p className="text-xs bg-orange-100 text-orange-700 w-fit px-2 py-0.5 rounded-full mb-1">{p.category}</p>
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="font-bold">{p.price} UGX</p>
                  
                  {/* WHATSAPP BUTTON */}
                  {p.sellerPhone && (
                    <a 
                      href={whatsappLink(p.sellerPhone)} 
                      target="_blank"
                      className="mt-2 w-full bg-green-500 text-white text-xs py-1.5 rounded-md flex items-center justify-center gap-1"
                    >
                      📞 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center py-1 z-30">
        {BOTTOM_NAV.map((nav) => (
          <button 
            key={nav.name} 
            onClick={() => router.push(nav.href)} 
            className={`flex flex-col items-center text-xs pt-1 ${pathname === nav.href ? 'text-orange-600' : 'text-gray-500'}`}
          >
            <span className="text-2xl">{nav.icon}</span>
            {nav.name}
          </button>
        ))}
        
        <button 
          onClick={() => router.push('/sell')} 
          className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white w-14 h-14 rounded-full flex items-center justify-center text-3xl border-4 border-[#FDF8F3] shadow-lg"
        >
          +
        </button>
      </div>
    </div>
  )
}