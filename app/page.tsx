"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Eye, X, LayoutGrid, Film, Coffee, ArrowRight, Zap, Images } from "lucide-react"

const CATEGORIES = [
  {name: 'Electronics', icon: '📱'}, {name: 'Home, Furniture & Appliances', icon: '🛋️'},
  {name: 'Health', icon: '💊'}, {name: 'Fashion', icon: '👗'},
  {name: 'Sports, Arts & Outdoor', icon: '⚽'}, {name: 'Babies & Kids', icon: '🧸'},
  {name: 'Animals & Pets', icon: '🐶'}, {name: 'Agriculture & Food', icon: '🌾'},
  {name: 'Commercial Equipment & Tools', icon: '🔧'}, {name: 'Repair & Construction', icon: '🔨'},
  {name: 'Stationery', icon: '📚'}, {name: 'Services', icon: '❤️'},
  {name: 'Jobs', icon: '📢'}, {name: 'Live Sports', icon: '🏟️'},
]

const BOTTOM_NAV = [
  { name: 'Home', icon: '🏠', href: '/' },
  { name: 'FAQs', icon: '💬', href: '/chat' },
  { name: 'stress-clinic', icon: '🧠', href: '/games' },
  { name: 'Profile', icon: '👤', href: '/profile' }
]

const PROMO_BANNERS = [
  { text: "🔥 Free Campus Delivery - MUBS, MUK, KYU Today", btn: "Order Now", color: "from-[#FF6A00] to-black" },
  { text: "⚡ Sell Fast on Sanel - Buyers in 10 Mins", btn: "Sell Now", color: "from-black to-[#222]" },
  { text: "🎓 Student Deals Up to 40% OFF", btn: "Shop", color: "from-[#6D28D9] to-black" },
]

function TrendingSection({ products, onView, onWhatsApp }: any) {
  if (!products || products.length === 0) return null;
  return (
    <div className="px-3 mt-4">
      <div className="bg-white rounded-[14px] border shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-3 py-2.5">
          <h2 className="font-black text-[14px] flex items-center gap-2 text-black"><span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[12px]">🔥</span> TRENDING NOW</h2>
          <span className="bg-[#FFF1F1] text-red-600 text-[9px] px-2 py-1 rounded-full font-black">BOOSTED</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto px-2.5 pb-2.5 scrollbar-hide">
          {products.map((p: any) => (
            <div key={p.id} className="min-w-[138px] max-w-[138px] bg-[#FAFAFA] border border-gray-100 rounded-[12px] overflow-hidden flex-shrink-0">
              <div className="relative">
                <img src={p.images?.[0]} className="w-full h-[110px] object-cover" />
                {p.images?.length > 1 && <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Images size={8}/>{p.images.length}</span>}
                <button onClick={() => onView(p)} className="absolute top-1.5 right-1.5 bg-white/90 text-black w-6 h-6 rounded-full flex items-center justify-center shadow"><Eye size={12} /></button>
              </div>
              <div className="p-2">
                <p className="font-bold text-[11px] text-black line-clamp-2 min-h-[28px] leading-tight">{p.title}</p>
                <p className="font-black text-[13px] mt-1">{p.price} UGX</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SanelBestPicksSection() {
  const router = useRouter()
  const CALL_NUMBER = "256700000000"
  const DELIVERY_NUMBER = "256700000001"
  const picks = [
    { title: 'Call To Order', sub: 'One call away', icon: '📞', action: () => window.location.href = `tel:+${CALL_NUMBER}` },
    { title: 'Campus Delivery', sub: '2hr delivery', icon: '🛵', action: () => window.location.href = `https://wa.me/${DELIVERY_NUMBER}` },
    { title: 'Sell On Sanel', sub: 'Turn to cash', icon: '💰', action: () => router.push('/sell') },
    { title: 'Sanel Support', sub: '24/7 help', icon: '💬', action: () => router.push('/support') },
  ]
  return (
    <div className="px-3 mt-4">
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
        {picks.map((item, idx) => (
          <button key={idx} onClick={item.action} className="min-w-[140px] bg-white border rounded-[12px] p-3 flex flex-col gap-1.5 items-start shadow-sm active:scale-[0.97] text-left">
            <span className="w-8 h-8 bg-[#FFF7ED] rounded-full flex items-center justify-center text-[16px]">{item.icon}</span>
            <p className="font-bold text-[12px] text-black leading-tight">{item.title}</p>
            <p className="text-[10px] text-gray-500">{item.sub}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function CategoryRow({ title, icon, products, onView, onWhatsApp, onSeeAll }: any) {
  if (!products || products.length === 0) return null
  const display = products.slice(0, 3)
  return (
    <div className="mt-6">
      <div className="px-3 flex justify-between items-center mb-3">
        <h2 className="font-black text-[14px] text-black flex items-center gap-2"><span className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-[14px]">{icon}</span> {title} <span className="bg-gray-100 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">{products.length}</span></h2>
        <button onClick={onSeeAll} className="text-[11px] font-bold text-black border bg-white px-3 py-1.5 rounded-full flex items-center gap-1">See All <ArrowRight size={12}/></button>
      </div>
      <div className="px-3 flex gap-3 overflow-x-auto scrollbar-hide">
        {display.map((p: any) => (
          <div key={p.id} className="min-w-[160px] max-w-[160px] bg-white rounded-[14px] border shadow-sm overflow-hidden flex-shrink-0 group">
            <div className="relative bg-[#F8F8F8]">
              <img src={p.images?.[0]} alt={p.title} className="w-full h-[135px] object-cover group-hover:scale-105 transition duration-300" />
              {/* PICS COUNT BADGE - PRO FORMAT */}
              {p.images?.length > 1? (
                <span className="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Images size={10}/>{p.images.length} pics</span>
              ) : (
                <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">1 pic</span>
              )}
              <button onClick={() => onView(p)} className="absolute top-2 right-2 bg-white/90 backdrop-blur text-black w-7 h-7 rounded-full flex items-center justify-center shadow"><Eye size={12} /></button>
              {p.is_boosted && <span className="absolute top-2 left-2 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full">BOOSTED</span>}
            </div>
            <div className="p-2.5">
              <p className="font-bold text-[11px] line-clamp-2 min-h-[30px] text-[#111] leading-tight">{p.title}</p>
              <p className="font-black text-[14px] mt-1.5 text-black">{p.price} <span className="font-normal text-[10px]">UGX</span></p>
              <button onClick={() => onWhatsApp(p)} className="w-full mt-2.5 bg-black text-white text-[11px] py-2 rounded-full font-bold flex items-center justify-center gap-1"><Zap size={12}/> WhatsApp</button>
            </div>
          </div>
        ))}
        <button onClick={onSeeAll} className="min-w-[110px] bg-white border border-dashed border-gray-300 rounded-[14px] flex flex-col items-center justify-center gap-2">
          <span className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center"><ArrowRight size={18}/></span>
          <p className="font-bold text-[12px]">View All</p>
          <p className="text-[10px] text-gray-500">{products.length} products</p>
        </button>
      </div>
    </div>
  )
}

function ProductViewModal({ product, onClose, onWhatsApp }: any) {
  const [activeImg, setActiveImg] = useState(0)
  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] max-w-[420px] w-full max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center z-20"><X size={16}/></button>

        <div className="relative bg-gray-100">
          <img src={product.images?.[activeImg]} className="w-full h-[320px] object-contain" />
          {/* SHOW NUMBER OF PICS PRO */}
          <div className="absolute bottom-3 left-3 bg-black text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Images size={12}/> {activeImg + 1} / {product.images?.length} pics
          </div>
        </div>

        {/* Thumbnails with count */}
        {product.images?.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto bg-white border-b">
            {product.images.map((img: string, idx: number) => (
              <button key={idx} onClick={() => setActiveImg(idx)} className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 ${activeImg === idx? 'border-black' : 'border-transparent opacity-70'}`}>
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-4">
          <span className="bg-gray-100 text-black text-[10px] font-bold px-2 py-1 rounded-full">{product.category} • {product.images?.length} pics</span>
          <h2 className="font-bold text-[17px] mt-2 leading-tight">{product.title}</h2>
          <p className="font-black text-[20px] mt-1">{product.price} UGX</p>
          <p className="text-[13px] text-gray-600 mt-3 whitespace-pre-wrap leading-relaxed">{product.description || "No description"}</p>
          <button onClick={() => onWhatsApp(product)} className="w-full mt-5 bg-black text-white py-3.5 rounded-full font-bold">📞 WhatsApp Seller • {product.images?.length} pics available</button>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [boostedProducts, setBoostedProducts] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [viewProduct, setViewProduct] = useState<any>(null)
  const [showCategories, setShowCategories] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => setBanners(snap.docs.map(d => ({id: d.id,...d.data()}))))
    return () => unsub()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => setProducts(snap.docs.map(d => ({ id: d.id,...d.data() }))))
    return () => unsub()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'products'), where("is_boosted", "==", true))
    const unsub = onSnapshot(q, (snap) => {
      const now = new Date()
      const boosted = snap.docs.map(d => ({ id: d.id,...d.data() } as any)).filter((p: any) => p.boosted_until && p.boosted_until.toDate() > now).slice(0, 30)
      setBoostedProducts(boosted)
    })
    return () => unsub()
  }, [])

  const filteredProducts = useMemo(() => {
    let filtered = products
    if(selectedCategory!== 'All') filtered = filtered.filter(p => p.category === selectedCategory)
    if(search) filtered = filtered.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
    return filtered
  }, [products, selectedCategory, search])

  const handleWhatsApp = (product: any) => {
    let phone = product.whatsapp || product.whatsApp || product.WhatsApp
    if(!phone) return alert("No WhatsApp")
    let cleanPhone = phone.toString().replace(/\D/g, '')
    if(cleanPhone.startsWith('0')) cleanPhone = '256' + cleanPhone.substring(1)
    else if(!cleanPhone.startsWith('256')) cleanPhone = '256' + cleanPhone
    window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi, I'm interested in ${product.title} - ${product.price} UGX (${product.images?.length} pics)`)}`
  }

  return (
    <div className="min-h-screen pb-24 bg-[#F9F6F2]">
      <div className="bg-white sticky top-0 z-20">
        <div className="p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCategories(!showCategories)} className="bg-black text-white w-9 h-9 rounded-full flex items-center justify-center"><LayoutGrid size={16} /></button>
            <span className="font-black text-[17px] tracking-tight">SANEL<span className="text-orange-600">.UG</span></span>
          </div>
          <Link href="/support" className="bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-full">Support</Link>
        </div>
        <div className="px-3 pb-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Sanel Ug" className="w-full bg-[#111] text-white rounded-full px-4 py-3 text-[13px] placeholder:text-gray-400" />
        </div>
        {showCategories && (
          <div className="px-3 pb-3">
            <div className="bg-[#FAFAFA] rounded-[16px] p-2 border grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.name} onClick={() => { setSelectedCategory(cat.name); setShowCategories(false); }} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl ${selectedCategory === cat.name? 'bg-black text-white' : 'bg-white border'}`}>
                  <span className="text-[18px]">{cat.icon}</span>
                  <span className="text-[8px] font-bold text-center leading-tight">{cat.name}</span>
                </button>
              ))}
              <button onClick={() => { setSelectedCategory('All'); setShowCategories(false); }} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-orange-600 text-white">
                <span className="text-[18px]">🌐</span><span className="text-[8px] font-bold">All</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pt-3">
        {banners.length > 0 && (
          <div ref={scrollRef} className="flex overflow-x-auto rounded-[16px] snap-x snap-mandatory scrollbar-hide">
            {banners.map((b) => (<Link key={b.id} href={b.link || "/"} className="w-full flex-shrink-0 snap-center"><img src={b.imageUrl} alt="banner" className="w-full h-40 object-cover rounded-[16px]"/></Link>))}
          </div>
        )}
      </div>

      <TrendingSection products={boostedProducts} onView={setViewProduct} onWhatsApp={handleWhatsApp} />
      <SanelBestPicksSection />

      {selectedCategory === 'All'? (
        <>
          {CATEGORIES.map((cat, idx) => {
            const catProducts = products.filter(p => p.category === cat.name && (search === '' || p.title.toLowerCase().includes(search.toLowerCase())))
            if(catProducts.length === 0) return null
            return (
              <div key={cat.name}>
                <CategoryRow title={cat.name} icon={cat.icon} products={catProducts} onView={setViewProduct} onWhatsApp={handleWhatsApp} onSeeAll={() => { setSelectedCategory(cat.name); window.scrollTo({top: 0, behavior: 'smooth'}) }} />
                {idx % 2 === 1 && (
                  <div className={`mx-3 mt-6 bg-gradient-to-r ${PROMO_BANNERS[idx % PROMO_BANNERS.length].color} rounded-[12px] p-3 flex justify-between items-center`}>
                    <p className="text-white font-bold text-[12px]">{PROMO_BANNERS[idx % PROMO_BANNERS.length].text}</p>
                    <button className="bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-full">{PROMO_BANNERS[idx % PROMO_BANNERS.length].btn}</button>
                  </div>
                )}
              </div>
            )
          })}
        </>
      ) : (
        <div className="p-3">
          <div className="flex justify-between items-center mb-3 mt-2">
            <h2 className="font-black text-[16px]">{selectedCategory} ({filteredProducts.length})</h2>
            <button onClick={() => setSelectedCategory('All')} className="bg-black text-white text-[11px] px-3 py-1.5 rounded-full">← Back</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white rounded-[14px] border overflow-hidden">
                <div className="relative">
                  <img src={p.images?.[0]} className="w-full h-36 object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Images size={10}/>{p.images?.length} pics</span>
                  <button onClick={() => setViewProduct(p)} className="absolute top-1.5 right-1.5 bg-white/90 w-7 h-7 rounded-full flex items-center justify-center"><Eye size={12}/></button>
                </div>
                <div className="p-2.5">
                  <p className="font-bold text-[12px] line-clamp-2">{p.title}</p>
                  <p className="font-black text-[13px] mt-1">{p.price} UGX</p>
                  <button onClick={() => handleWhatsApp(p)} className="w-full mt-2 bg-black text-white text-[11px] py-2 rounded-full">WhatsApp</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewProduct && <ProductViewModal product={viewProduct} onClose={() => setViewProduct(null)} onWhatsApp={handleWhatsApp} />}

      {/* FLOATING BUTTONS BACK - PRO STYLE */}
      <Link href="/movies" className="fixed bottom-24 left-4 bg-black text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-40 border-2 border-white hover:scale-105 transition">
        <Film size={20} />
      </Link>

      <button onClick={() => router.push('/sell')} className="fixed bottom-24 right-4 bg-black text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-40 border-2 border-white hover:scale-105 transition">
        <Coffee size={22} />
      </button>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-1.5 z-30">
        {BOTTOM_NAV.map((nav) => (
          <button key={nav.name} onClick={() => router.push(nav.href)} className={`flex flex-col items-center text-[10px] font-bold ${pathname === nav.href? 'text-black' : 'text-gray-400'}`}><span className="text-[20px]">{nav.icon}</span>{nav.name}</button>
        ))}
      </div>
    </div>
  )
}