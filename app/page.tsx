"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Coffee, Eye, X, LayoutGrid, Film, ArrowRight, Clock } from "lucide-react"

const CATEGORIES = [
  {name: 'All', icon: '🌐'}, {name: 'Electronics', icon: '📱'}, {name: 'Home, Furniture & Appliances', icon: '🛋️'},
  {name: 'Health', icon: '💊'}, {name: 'Fashion', icon: '👗'},
  {name: 'Sports, Arts & Outdoor', icon: '⚽'},
  {name: 'Babies & Kids', icon: '🧸'},
  {name: 'Animals & Pets', icon: '🐶'}, {name: 'Agriculture & Food', icon: '🌾'},
  {name: 'Commercial Equipment & Tools', icon: '🔧'}, {name: 'Repair & Construction', icon: '🔨'},
  {name: 'Stationery', icon: '📚'}, {name: 'Services', icon: '❤️'},
  {name: 'Jobs', icon: '📢'}
]

const HOME_CATEGORIES = CATEGORIES.filter(c => c.name!== 'All')

const BOTTOM_NAV = [
  { name: 'Home', icon: '🏠', href: '/' },
  { name: 'FAQs', icon: '💬', href: '/chat' },
  { name: 'stress-clinic', icon: '🧠', href: '/games' },
  { name: 'Profile', icon: '👤', href: '/profile' }
]

function getTimeLeft(boosted_until: any) {
  if(!boosted_until) return null
  try {
    const end = boosted_until.toDate? boosted_until.toDate() : new Date(boosted_until)
    const diff = end.getTime() - new Date().getTime()
    if(diff <= 0) return "Expired"
    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if(h > 24) return `${Math.floor(h/24)}d ${h%24}h left`
    if(h > 0) return `${h}h ${m}m left`
    return `${m}m left`
  } catch { return null }
}

function TrendingSection({ products, onView, onWhatsApp }: any) {
  const [tick, setTick] = useState(0)
  useEffect(() => { const t = setInterval(()=>setTick(x=>x+1), 60000); return ()=>clearInterval(t)}, [])
  if (!products || products.length === 0) return null;
  return (
    <div className="px-3 mt-3">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-3 py-2.5 bg-[#FFF7ED] border-b border-gray-100">
          <h2 className="font-black text-[15px] flex items-center gap-2 text-black">🔥 TRENDING <span className="bg-red-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black">HOT</span></h2>
          <span className="bg-black text-white text-[7px] px-2 py-0.5 rounded-full font-bold">SPONSORED • {products.length} SLOTS</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto p-2.5 scrollbar-hide">
          {products.map((p: any) => {
            const timeLeft = getTimeLeft(p.boosted_until)
            return (
              <div key={p.id} className="min-w-[145px] max-w-[145px] bg-white border border-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <div className="relative">
                  <img src={p.images?.[0]} className="w-full h-32 object-cover" />
                  <span className="absolute top-1.5 left-1.5 bg-yellow-400 text-black text-[7px] font-black px-2 py-0.5 rounded-full shadow-sm">BOOSTED</span>
                  <button onClick={() => onView(p)} className="absolute top-1.5 right-1.5 bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center"><Eye size={10} /></button>
                  {p.images?.length > 1 && <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">+{p.images.length}</span>}
                </div>
                <div className="p-2">
                  <p className="font-bold text-[11px] text-black leading-tight line-clamp-2 min-h-[28px]">{p.title}</p>
                  <p className="font-black text-[13px] mt-1" style={{color: '#B45309'}}>{p.price} UGX</p>
                  {timeLeft && <p className="text-[9px] mt-1 font-bold flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full w-fit"><Clock size={10}/> {timeLeft}</p>}
                  <button onClick={() => onWhatsApp(p)} className="w-full mt-1.5 bg-green-500 text-white text-[10px] py-1.5 rounded-md font-bold">WhatsApp</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// FIXED: use <a> not <Link> for tel: and wa.me
function SanelBestPicksSection() {
  return (
    <div className="px-3 mt-4">
      <h2 className="font-black text-[16px] mb-2.5 text-black px-1">Unlock big savings on our best picks</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        <a href="tel:+256700000000" className="min-w-[260px] max-w-[260px] bg-[#FFF7ED] border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 flex-shrink-0 shadow-sm no-underline">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[26px] shadow-sm border flex-shrink-0">🌍</div>
          <div><p className="font-bold text-[13px] text-black">Call To Order</p><p className="text-[12px] text-gray-600 truncate">Shopping Made Easier</p><p className="text-[11px] text-gray-500 truncate">Your Needs, One Call Away</p></div>
        </a>
        <a href="https://wa.me/256700000001?text=Hello%20Sanel!%20I%20need%20delivery" target="_blank" className="min-w-[260px] max-w-[260px] bg-[#F0F9FF] border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 flex-shrink-0 shadow-sm no-underline">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[26px] shadow-sm border flex-shrink-0">🛵</div>
          <div><p className="font-bold text-[13px] text-black">Campus Delivery</p><p className="text-[12px] text-gray-600 truncate">Fast Delivery To Campus</p><p className="text-[11px] text-gray-500 truncate">MUBS, MUK, KYU & More</p></div>
        </a>
        <Link href="/sell" className="min-w-[260px] max-w-[260px] bg-[#F0FDF4] border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[26px] shadow-sm border flex-shrink-0">💰</div>
          <div><p className="font-bold text-[13px] text-black">Sell On Sanel</p><p className="text-[12px] text-gray-600 truncate">Turn Your Items To Cash</p></div>
        </Link>
        <Link href="/support" className="min-w-[260px] max-w-[260px] bg-[#FEF3F2] border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[26px] shadow-sm border flex-shrink-0">💬</div>
          <div><p className="font-bold text-[13px] text-black">Sanel Support</p><p className="text-[12px] text-gray-600 truncate">Need Help? We Are Here</p></div>
        </Link>
      </div>
    </div>
  )
}

function CategoryRow({ title, icon, products, onView, onWhatsApp, onSeeAll }: any) {
  if (!products || products.length === 0) return null
  return (
    <div className="mt-5">
      <div className="px-3 flex justify-between items-center mb-2.5">
        <h2 className="font-black text-[15px] flex items-center gap-2 text-black"><span>{icon}</span> {title} <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full">{products.length}</span></h2>
        <button onClick={onSeeAll} className="text-[12px] font-bold px-3 py-1 rounded-full bg-black text-white flex items-center gap-1">See All <ArrowRight size={12}/></button>
      </div>
      <div className="px-3 flex gap-3 overflow-x-auto scrollbar-hide">
        {products.slice(0,3).map((p: any) => (
          <div key={p.id} className="min-w-[160px] max-w-[160px] bg-white rounded-lg shadow-sm overflow-hidden border flex-shrink-0">
            <div className="relative w-full h-40 bg-gray-100">
              <img src={p.images?.[0]} alt={p.title} className="w-full h-40 object-cover" />
              <button onClick={() => onView(p)} className="absolute top-2 right-2 bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center"><Eye size={12} /></button>
              {p.images?.length > 1 && <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">+{p.images.length} pics</span>}
              {p.is_boosted && <span className="absolute top-2 left-2 bg-yellow-400 text-black text-[8px] font-bold px-2 py-0.5 rounded-full">BOOSTED</span>}
            </div>
            <div className="p-2">
              <p className="text-[10px] bg-orange-100 text-orange-800 w-fit px-2 py-0.5 rounded-md mb-1 font-bold">{p.category}</p>
              <p className="font-bold text-[12px] line-clamp-2 min-h-[32px] text-black leading-tight">{p.title}</p>
              <p className="font-black text-[13px] mt-1" style={{color: '#B45309'}}>{p.price} UGX</p>
              <button onClick={() => onWhatsApp(p)} className="w-full mt-2 bg-green-500 text-white text-[11px] py-2 rounded-md font-bold">WhatsApp</button>
            </div>
          </div>
        ))}
        <button onClick={onSeeAll} className="min-w-[110px] bg-white border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 flex-shrink-0">
          <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"><ArrowRight size={16}/></span>
          <p className="font-bold text-[12px] text-black">See All</p>
          <p className="text-[10px] text-gray-500">{products.length} items</p>
        </button>
      </div>
    </div>
  )
}

function PromoStrip({ catName, catIndex, setCategory, router }: any) {
  const promos = [
    { text: `🛵 Free Delivery on ${catName} Today`, btn: "Order Now", type: "order", bg: "bg-black" },
    { text: `💰 Sell on Sanel & Get Paid in 10 Mins`, btn: "Sell Now", type: "sell", bg: "bg-[#8B4513]" },
    { text: `🎓 Best Deals in ${catName} - Up to 40% OFF`, btn: "Shop Now", type: "shop", bg: "bg-gradient-to-r from-orange-600 to-black" },
  ]
  const promo = promos[catIndex % promos.length]
  const handleClick = () => {
    if(promo.type === "sell") router.push('/sell')
    else if(promo.type === "shop") { setCategory(catName); window.scrollTo({top:0, behavior:'smooth'}) }
    else { window.open(`https://wa.me/256700000001?text=Hello%20Sanel!%20I%20need%20delivery%20for%20${catName}`, '_blank') }
  }
  return (
    <button onClick={handleClick} className={`mx-3 mt-5 rounded-xl p-3 flex justify-between items-center w-[calc(100%-24px)] active:scale-[0.98] transition ${promo.bg}`}>
      <p className="text-white font-bold text-[12px] text-left">{promo.text}</p>
      <span className="bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-full ml-2 flex-shrink-0">{promo.btn}</span>
    </button>
  )
}

function ProductViewModal({ product, onClose, onWhatsApp }: any) {
  const [activeImg, setActiveImg] = useState(product.images?.[0])
  useEffect(() => { setActiveImg(product.images?.[0]) }, [product])
  const timeLeft = getTimeLeft(product.boosted_until)
  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-[420px] w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center z-20"><X size={16} /></button>
        <div className="relative bg-gray-100">
          <img src={activeImg} alt={product.title} className="w-full h-80 object-contain bg-gray-100" />
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[11px] px-3 py-1 rounded-full font-bold">{product.images?.findIndex((i:string)=>i===activeImg)+1} / {product.images?.length} pics</div>
          {timeLeft && <div className="absolute bottom-2 right-2 bg-red-600 text-white text-[11px] px-3 py-1 rounded-full font-bold flex items-center gap-1"><Clock size={12}/>{timeLeft}</div>}
        </div>
        {product.images?.length > 1 && (
          <div className="flex gap-2 p-2 overflow-x-auto bg-white">
            {product.images.map((img: string, idx: number) => (
              <button key={idx} onClick={() => setActiveImg(img)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImg === img? 'border-orange-600' : 'border-transparent opacity-70'}`}><img src={img} className="w-full h-full object-cover" /></button>
            ))}
          </div>
        )}
        <div className="p-4">
          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-md font-bold">{product.category} • {product.images?.length} pics {product.is_boosted? `• ${timeLeft}`: ''}</span>
          <h2 className="font-bold text-xl mt-2 text-black">{product.title}</h2>
          <p className="font-bold text-2xl mt-1" style={{color: '#B45309'}}>{product.price} UGX</p>
          <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{product.description || "No description"}</p>
          <div className="mt-5 flex flex-col gap-2">
            <button onClick={() => onWhatsApp(product)} className="w-full bg-green-600 text-white py-3.5 rounded-full font-bold">📞 WhatsApp Seller</button>
            <button onClick={onClose} className="w-full bg-gray-100 text-black py-3 rounded-full font-bold text-sm">Close</button>
          </div>
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
  const [loading, setLoading] = useState(true)
  const [viewProduct, setViewProduct] = useState<any>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [currentBanner, setCurrentBanner] = useState(0)
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
    const handleScroll = () => setCurrentBanner(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', handleScroll);
    let i = 0;
    const timer = setInterval(() => { i = (i + 1) % banners.length; if(el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }); }, 3500);
    return () => { clearInterval(timer); el.removeEventListener('scroll', handleScroll); }
  }, [banners.length]);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => { setProducts(snap.docs.map(d => ({ id: d.id,...d.data() }))); setLoading(false) })
    return () => unsub()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'products'), where("is_boosted", "==", true))
    const unsub = onSnapshot(q, (snap) => {
      const now = new Date()
      const boosted = snap.docs.map(d => ({ id: d.id,...d.data() } as any)).filter((p: any) => p.boosted_until && p.boosted_until.toDate() > now).sort((a: any, b: any) => b.boosted_at.toDate() - a.boosted_at.toDate()).slice(0, 30)
      setBoostedProducts(boosted)
    })
    return () => unsub()
  }, [])

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  }), [products, selectedCategory, search])

  const getProductsByCat = (catName: string) => products.filter(p => p.category === catName && p.title?.toLowerCase().includes(search.toLowerCase()))

  const handleWhatsApp = (product: any) => {
    let phone = product.whatsapp || product.whatsApp || product.WhatsApp
    if(!phone) return alert("Seller did not add WhatsApp number")
    let cleanPhone = phone.toString().replace(/\D/g, '')
    if(cleanPhone.startsWith('0')) cleanPhone = '256' + cleanPhone.substring(1)
    else if(!cleanPhone.startsWith('256')) cleanPhone = '256' + cleanPhone
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello! I'm interested in ${product.title} - ${product.price} UGX`)}`, '_blank')
  }

  return (
    <div className="min-h-screen pb-20 bg-[#FDF8F3] relative">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCategories(!showCategories)} className="bg-black text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md"><LayoutGrid size={18} /></button>
            <span className="font-bold text-lg" style={{color: '#8B4513'}}>Sanel Ug</span>
            <Link href="/about" className="text-xs text-gray-500 ml-1">About</Link>
          </div>
          <div className="flex gap-1.5 text-xs items-center">
            {selectedCategory!== 'All' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[10px] font-bold">{selectedCategory}</span>}
            <Link href="/support" className="bg-black text-white px-2 py-1 rounded-md">Support</Link>
            <select className="bg-black text-white px-2 py-1 rounded-md"><option>MUBS</option></select>
          </div>
        </div>
        <div className="px-3 pb-3"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="w-full bg-[#1a1a1a] text-white rounded-lg p-3 text-sm placeholder:text-gray-400" /></div>
        {showCategories && (
          <div className="px-3 pb-3">
            <div className="bg-gray-50 rounded-2xl p-3 border grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.name} onClick={() => { setSelectedCategory(cat.name); setShowCategories(false); }} className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-bold ${selectedCategory === cat.name? 'bg-orange-600 text-white' : 'bg-white text-gray-700 shadow-sm border'}`}>
                  <span className="text-xl">{cat.icon}</span><span className="text-[10px] leading-tight text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pt-2">
        {banners.length > 0 && (
          <>
            <div ref={scrollRef} className="flex overflow-x-auto scroll-smooth rounded-2xl snap-x snap-mandatory scrollbar-hide">
              {banners.map((b) => (<Link key={b.id} href={b.link || "/"} className="w-full flex-shrink-0 snap-center"><img src={b.imageUrl} alt="banner" className="w-full h-44 object-cover rounded-2xl"/></Link>))}
            </div>
            <div className="flex justify-center gap-1.5 mt-2">{banners.map((_, idx) => (<button key={idx} onClick={() => { setCurrentBanner(idx); scrollRef.current?.scrollTo({ left: idx * scrollRef.current.clientWidth, behavior: "smooth" }); }} className={`h-1.5 rounded-full ${currentBanner === idx? 'bg-orange-600 w-6' : 'bg-gray-300 w-1.5'}`} />))}</div>
          </>
        )}
      </div>

      <TrendingSection products={boostedProducts} onView={setViewProduct} onWhatsApp={handleWhatsApp} />
      <SanelBestPicksSection />

      <div className="p-3 pb-0"><h2 className="font-black text-[18px] text-black">{selectedCategory === 'All'? 'Shop by Category' : `${selectedCategory} (${filteredProducts.length})`}{selectedCategory!== 'All' && <button onClick={() => setSelectedCategory('All')} className="ml-3 bg-black text-white text-[11px] px-3 py-1 rounded-full">Back</button>}</h2></div>

      {loading? <p className="p-3">Loading...</p> : selectedCategory === 'All'? (
        <>
          {HOME_CATEGORIES.map((cat, idx) => {
            const catProducts = getProductsByCat(cat.name)
            if(catProducts.length === 0) return null
            return (
              <div key={cat.name}>
                <CategoryRow title={cat.name} icon={cat.icon} products={catProducts} onView={setViewProduct} onWhatsApp={handleWhatsApp} onSeeAll={() => { setSelectedCategory(cat.name); window.scrollTo({top: 0, behavior: 'smooth'}) }} />
                <PromoStrip catName={cat.name} catIndex={idx} setCategory={setSelectedCategory} router={router} />
              </div>
            )
          })}
        </>
      ) : (
        <div className="p-3"><div className="grid grid-cols-2 gap-3">{filteredProducts.map(p => (
          <div key={p.id} className="bg-white rounded-lg shadow-sm overflow-hidden border"><div className="relative w-full h-40 bg-gray-100"><img src={p.images?.[0]} className="w-full h-40 object-cover" /><button onClick={() => setViewProduct(p)} className="absolute top-2 right-2 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center"><Eye size={14} /></button>{p.images?.length > 1 && <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">+{p.images.length} pics</span>}</div><div className="p-2"><p className="text-[10px] bg-orange-100 text-orange-800 w-fit px-2 py-0.5 rounded-md mb-1 font-bold">{p.category}</p><p className="font-bold text-[14px] line-clamp-2 text-black">{p.title}</p><p className="font-black text-[15px] mt-1" style={{color: '#B45309'}}>{p.price} UGX</p><button onClick={() => handleWhatsApp(p)} className="w-full mt-2 bg-green-500 text-white text-sm py-2.5 rounded-md font-bold">WhatsApp</button></div></div>
        ))}</div></div>
      )}

      {viewProduct && <ProductViewModal product={viewProduct} onClose={() => setViewProduct(null)} onWhatsApp={handleWhatsApp} />}

      <Link href="/movies" className="fixed bottom-24 left-4 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl z-40 border-2 border-white"><Film size={18} /></Link>
      <button onClick={() => router.push('/sell')} className="fixed bottom-24 right-4 bg-amber-800 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl z-40"><Coffee size={20} /></button>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center py-1 z-30">
        {BOTTOM_NAV.map((nav) => (<button key={nav.name} onClick={() => router.push(nav.href)} className={`flex flex-col items-center text-xs pt-1 ${pathname === nav.href? 'text-orange-600' : 'text-gray-500'}`}><span className="text-2xl">{nav.icon}</span>{nav.name}</button>))}
      </div>
    </div>
  )
}