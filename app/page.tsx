'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

const COFFEE_BROWN = '#6F4E37'
const COFFEE_LIGHT = '#A67B5B'

const TOP_TABS = [
  { name: 'Movies', href: '/movies' }, // Links to your existing app/movies/page.tsx
  { name: 'Stores', href: '/stores' },
  { name: 'Invoices', href: '/invoices' },
  { name: 'Receipts', href: '/receipts' },
]

const CATEGORIES = [
  { name: 'Vehicles', icon: '🚗' }, { name: 'Phones', icon: '📱' },
  { name: 'Hostels & Rentals', icon: '🏠' }, { name: 'Electronics', icon: '💻' },
  { name: 'Home, Furniture & Appliances', icon: '🛋️' }, { name: 'Health', icon: '💊' },
  { name: 'Fashion', icon: '👗' }, { name: 'Sports, Arts & Outdoor', icon: '⚽' },
  { name: 'Babies & Kids', icon: '🧸' }, { name: 'Animals & Pets', icon: '🐶' },
  { name: 'Agriculture & Food', icon: '🌾' }, { name: 'Commercial Equipment & Tools', icon: '🔧' },
  { name: 'Repair & Construction', icon: '🔨' }, { name: 'Stationery', icon: '📚' },
  { name: 'Services', icon: '❤️' }, { name: 'Jobs', icon: '📢' },
]

// Admin is removed from here. Hidden. Only accessible via /admin URL
const BOTTOM_NAV = [
  { name: 'Home', icon: '🏠', href: '/' },
  { name: 'Chat', icon: '💬', href: '/' },
  { name: 'Stores', icon: '🏪', href: '/' },
  { name: 'Profile', icon: '👤', href: '/profile' },
]

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory)

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#FDF8F3'>
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="p-3 flex justify-between items-center border-b">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/')}>☰</button>
            <h1 className="font-bold" style={{ color: COFFEE_BROWN }}>Sanel Ug</h1>
            <Link href="/about" className="text-xs text-gray-500">About</Link>
          </div>
          <div className="flex gap-2 text-xs">
            <Link href="/get-app" className="border border-zinc-700 bg-zinc-800 text-white px-3 py-1.5 rounded-md text-sm">Get App</Link>
            <Link href="/tools" className="border border-zinc-700 bg-zinc-800 text-white px-3 py-1.5 rounded-md text-sm">Tools</Link>
            <Link href="/support" className="border border-zinc-700 bg-zinc-800 text-white px-3 py-1.5 rounded-md text-sm">Support</Link>
            <select className="border  border-zinc-700 bg-zinc-800 text-white px-3 py-1.5 rounded-md text-sm"><option>Uganda</option><option>Kenya</option></select>
          
          </div>
        </div>

        <div className="p-3"><input placeholder="Search products" className="w-full p-3 bg-zinc-800 text-white border-zinc-700  rounded-lg text-sm placehold:text-zinc-400 " /></div>

        <div className="flex gap-2 px-3 pb-2 overflow-x-auto">
          {TOP_TABS.map(tab => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap font-medium border ${pathname === tab.href ?  'text-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
              style={{ backgroundColor: pathname === tab.href ? COFFEE_BROWN : '' }}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>
      {/* Main Page = Stores */}
      <div className="bg-white">
        <div className="grid grid-cols-4 gap-4">
          <button onClick={() => setSelectedCategory('All')} className={`flex flex-col items-center text-xs ${selectedCategory === 'All' ? 'font-bold' : ''}`} style={{ color: selectedCategory === 'All' ? COFFEE_BROWN : '#666' }}>
            <div className="text-2xl mb-1">🏪</div><span>All</span>
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className={`flex flex-col items-center text-xs ${selectedCategory === cat.name ? 'font-bold' : ''}`} style={{ color: selectedCategory === cat.name ? COFFEE_BROWN : '#666' }}>
              <div className="text-2xl mb-1">{cat.icon}</div><span className="text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        <p className="font-bold mb-3" style={{ color: COFFEE_BROWN }}>Listings {selectedCategory !== 'All' && `- ${selectedCategory}`} ({filteredProducts.length})</p>
        {loading && <p className="text-center py-10">Loading...</p>}
        {filteredProducts.length === 0 && !loading && <p className="text-center py-20 text-gray-500">No listings yet. Tap the + button to post.</p>}
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white border rounded-lg overflow-hidden shawdow-sm">
              {p.images?.[0] && <img src={p.images[0]} className="w-full h-50 object-cover bg-black p-2" alt={p.title} />}
              <div className="p-3">
                <span className="text-xs px-2 py-1 rounded-full text-white mb-1 inline-block" style={{ backgroundColor: COFFEE_LIGHT }}>{p.category}</span>
                <p className="font-bold text-sm mb-1 line-clamp-1" style={{ color: COFFEE_BROWN }}>{p.title}</p>
                <p className="font-bold mb-2" style={{ color: COFFEE_BROWN }}>{p.price?.toLocaleString()} UGX</p>
                <a href={`https://wa.me/${p.whatsapp}`} target="_blank" className="block w-full text-white text-center py-1.5 rounded text-sm font-medium" style={{ backgroundColor: '#25D366' }}>Contact on WhatsApp</a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav - No Admins icon */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16">
        {BOTTOM_NAV.map(item => (
          <Link key={item.name} href={item.href} className={`flex flex-col items-center text-xs ${pathname === item.href ? 'font-bold' : 'text-gray-600'}`} style={{ color: pathname === item.href ? COFFEE_BROWN : '' }}>
            <span className="text-xl">{item.icon}</span><span>{item.name}</span>
          </Link>
        ))}
        <Link href="/sell" className="absolute bottom-6 w-14 h-14 rounded-full text-white flex items-center justify-center text-3xl shadow-lg" style={{ backgroundColor: COFFEE_BROWN }}>+</Link>
      </div>
    </div>
  )
}
