'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, Home, Film, Play, Lock, Crown } from 'lucide-react'
import { db, auth } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

type Movie = {
    id: string; title: string; year?: number; releaseDate?: string; genre?: string[]; description: string; videoUrl: string; posterUrl: string; category?: string; duration: string; createdAt: any
}

export const CATEGORY_OPTIONS = ['All','Action','Adventure','Anime','Comedy','Family','Fantasy','Horror','💖Romance','Sci-Fi','Thriller','K-Drama','C-Drama','DC Movies','Marval Movies','Trending Now','Most popular']

const MOVIE_PACKAGES = [
  {id:'daily', name:'Daily', price:1000, days:1, desc:'24 Hours access'},
  {id:'3days', name:'3 Days', price:2500, days:3, desc:'Best for weekend', popular:true},
  {id:'7days', name:'Weekly', price:5000, days:7, desc:'7 Days full'},
  {id:'15days', name:'1/2 Month', price:8000, days:15, desc:'15 Days'},
  {id:'30days', name:'Monthly', price:12000, days:30, desc:'30 Days - Popular'},
  {id:'60days', name:'2 Months', price:20000, days:60, desc:'Save 4k'},
  {id:'180days', name:'1/2 Year', price:50000, days:180, desc:'6 Months'},
  {id:'365days', name:'Full Year', price:90000, days:365, desc:'Best Value 👑'},
]

export default function MoviesPage() {
    const [movies, setMovies] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [heroIndex, setHeroIndex] = useState(0)
    const [user, setUser] = useState<User | null>(null)

    const [hasAccess, setHasAccess] = useState(false)
    const [showPaywall, setShowPaywall] = useState(false)
    const [selectedPackage, setSelectedPackage] = useState(MOVIE_PACKAGES[1])
    const [payLoading, setPayLoading] = useState(false)

    // NEW AUTH STATES - PHONE/EMAIL
    const [authMode, setAuthMode] = useState<'login'|'signup'>('signup')
    const [authInput, setAuthInput] = useState('')
    const [authPassword, setAuthPassword] = useState('')
    const [loginLoading, setLoginLoading] = useState(false)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, setUser)
        return ()=>unsub()
    }, [])

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const q = query(collection(db, "movies"), orderBy("createdAt", "desc"))
                const snapshot = await getDocs(q)
                setMovies(snapshot.docs.map(doc => ({ id: doc.id,...doc.data() })) as Movie[])
            } finally { setLoading(false) }
        }
        fetchMovies()
    }, [])

    useEffect(() => {
        const checkAccess = async () => {
            if(!user) { setHasAccess(false); return }
            const subRef = doc(db, 'movie_subscriptions', user.uid)
            const subSnap = await getDoc(subRef)
            if(subSnap.exists()) {
                const data = subSnap.data()
                const until = data.validUntil?.toDate() as Date
                if(until && until > new Date()) { setHasAccess(true); return }
            }
            setHasAccess(false)
        }
        if(user!==undefined) checkAccess()
    }, [user])

    useEffect(() => {
        if(movies.length===0) return
        const t = setInterval(()=> setHeroIndex(i=> (i+1)%Math.min(5,movies.length)), 5000)
        return ()=>clearInterval(t)
    }, [movies.length])

    const filteredMovies = useMemo(() => {
        return movies.filter(movie => {
            const cat = (movie as any).genre?.join(' ') + ' ' + (movie.category||'')
            const matchesCategory = selectedCategory === 'All' || cat.toLowerCase().includes(selectedCategory.toLowerCase())
            const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesCategory && matchesSearch
        })
    }, [selectedCategory, searchQuery, movies])

    const heroMovies = movies.slice(0,5)
    const hero = heroMovies[heroIndex]

    // Convert phone 0767... to email 0767...@sanel.ug for Firebase
    const normalizeEmail = (input: string) => {
        input = input.trim()
        if(input.includes('@')) return input.toLowerCase()
        let phone = input.replace(/\D/g,'')
        return `${phone}@sanel.ug`
    }

    const handleEmailAuth = async () => {
        if(!authInput || authPassword.length<6) return alert('Enter email/phone and password 6+ chars')
        setLoginLoading(true)
        try{
            const email = normalizeEmail(authInput)
            if(authMode==='login'){
                await signInWithEmailAndPassword(auth, email, authPassword)
            } else {
                await createUserWithEmailAndPassword(auth, email, authPassword)
            }
            // stays in paywall, will now show packages
        }catch(e:any){
            alert(e.message.includes('invalid-credential')? 'Wrong password or no account' : e.message)
        }
        setLoginLoading(false)
    }

    const requestSubscription = async () => {
        if(!user) return
        setPayLoading(true)
        try{
            await addDoc(collection(db, 'movie_boost_requests'), {
                userId: user.uid,
                email: user.email,
                packageId: selectedPackage.id,
                packageName: selectedPackage.name,
                amount: selectedPackage.price,
                days: selectedPackage.days,
                status: 'pending',
                createdAt: serverTimestamp()
            })
            alert(`Request sent! Send ${selectedPackage.price} UGX to 0767483636\nReason: MOVIE ${user.uid.slice(0,4)}\nAdmin will approve.`)
            setShowPaywall(false)
        } catch(e:any){ alert(e.message) }
        setPayLoading(false)
    }

    if (loading) return <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">Loading SanelFlix...</div>

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white pb-24 relative">
            {showPaywall && (
                <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[24px] w-full max-w-[400px] p-6 text-black max-h-[90vh] overflow-y-auto">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto"><Crown className="text-yellow-400" /></div>
                            <h2 className="font-black text-xl mt-3">1 Min Free Ended 🔒</h2>
                            <p className="text-sm text-black/70 mt-1">You get 60 sec free per movie</p>
                            <p className="text-xs mt-2 bg-red-100 text-red-600 font-bold py-1 px-3 rounded-full inline-block">Pay to 0767483636</p>
                        </div>

                        {!user? (
                          <div className="mt-6">
                            <div className="flex bg-gray-100 rounded-full p-1 mb-4">
                                <button onClick={()=>setAuthMode('login')} className={`flex-1 py-2 rounded-full text-xs font-black ${authMode==='login'?'bg-black text-white':'text-black/60'}`}>Login</button>
                                <button onClick={()=>setAuthMode('signup')} className={`flex-1 py-2 rounded-full text-xs font-black ${authMode==='signup'?'bg-black text-white':'text-black/60'}`}>Sign Up</button>
                            </div>
                            <input value={authInput} onChange={e=>setAuthInput(e.target.value)} placeholder="Email or Phone (0767...)" className="w-full border-2 border-black/10 rounded-full px-4 py-3 text-sm text-black outline-none focus:border-black mb-3" />
                            <input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="Password (6+ chars)" className="w-full border-2 border-black/10 rounded-full px-4 py-3 text-sm text-black outline-none focus:border-black mb-3" />
                            <button onClick={handleEmailAuth} disabled={loginLoading} className="w-full bg-black text-white py-3.5 rounded-full font-black text-sm">
                                {loginLoading? 'Wait...' : authMode==='login'? 'Login' : 'Create Account'}
                            </button>
                            <p className="text-[10px] text-center text-gray-400 mt-3">Phone login is for movies only - not admin</p>
                          </div>
                        ) : (
                          <>
                            <div className="mt-5 space-y-2">
                                {MOVIE_PACKAGES.map(pkg=>(
                                    <button key={pkg.id} onClick={()=>setSelectedPackage(pkg)} className={`w-full text-left border-2 rounded-xl p-3 flex justify-between items-center ${selectedPackage.id===pkg.id?'border-black bg-[#FFF7ED]':'border-gray-200'}`}>
                                        <div><p className="font-black text-sm flex gap-2 items-center">{pkg.name} {pkg.popular && <span className="bg-black text-white text-[8px] px-2 py-0.5 rounded-full">POPULAR</span>}</p><p className="text-xs text-black/60">{pkg.desc} • {pkg.days} days</p></div>
                                        <div className="text-right"><p className="font-black">{pkg.price.toLocaleString()}</p><p className="text-[10px] font-bold">UGX</p></div>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 bg-black text-white rounded-xl p-3 text-xs font-bold">
                                <p>Send <b>{selectedPackage.price} UGX</b> to <b>0767483636</b></p>
                                <p>Reason: <b>MOVIE {user.uid.slice(0,4)}</b></p>
                            </div>
                            <button onClick={requestSubscription} disabled={payLoading} className="w-full bg-black text-white py-3.5 rounded-full font-black mt-4">
                                {payLoading? 'Sending...' : `I Have Paid ${selectedPackage.price} UGX`}
                            </button>
                          </>
                        )}
                        <button onClick={()=>setShowPaywall(false)} className="block w-full text-center text-xs font-bold mt-3 text-gray-500">Browse (1 min free)</button>
                    </div>
                </div>
            )}

            <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2"><div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-black">S</div><h1 className="text-xl font-black">SANEL<span className="text-red-600">FLIX</span></h1></Link>
                        {hasAccess? <span className="bg-green-500 text-black text-[10px] font-black px-2 py-1 rounded-full">VIP</span> : <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-full">1 MIN FREE</span>}
                    </div>
                    <div className="flex gap-2 items-center">
                        {!hasAccess && <button onClick={()=>setShowPaywall(true)} className="bg-red-600 text-white px-3 py-1.5 rounded-full text-[11px] font-black flex gap-1 items-center"><Lock size={12}/> SUBSCRIBE</button>}
                        <Link href="/" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><Home size={16}/></Link>
                    </div>
                </div>
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18}/>
                        <input type="text" placeholder="Search movies..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-full bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-red-600 text-sm"/>
                    </div>
                </div>
            </header>

            <div>
                {!searchQuery && hero && (
                    <div className="relative mx-3 mt-3 rounded-[20px] overflow-hidden h-[460px]">
                        <img src={hero.posterUrl} alt={hero.title} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 p-5 w-full">
                            <h2 className="text-3xl font-black leading-tight line-clamp-2">{hero.title}</h2>
                            <p className="text-sm text-white/70 mt-2 line-clamp-2">{hero.description}</p>
                            <div className="flex gap-2 mt-4">
                                <Link href={`/movies/watch/${hero.id}`} className="flex-1 bg-white text-black py-3 rounded-full font-black text-sm flex items-center justify-center gap-2"><Play size={16} fill="black"/> Watch 1 Min Free</Link>
                            </div>
                        </div>
                    </div>
                )}
                <div className="px-3 mt-5">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        {CATEGORY_OPTIONS.map((cat) => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${selectedCategory===cat?'bg-white text-black':'bg-white/10 text-white/70 border-white/10'}`}>{cat}</button>
                        ))}
                    </div>
                </div>
                <section className="px-3 mt-6">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {filteredMovies.map((m) => (
                            <Link key={m.id} href={`/movies/watch/${m.id}`} className="group">
                                <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
                                    <div className="aspect-[2/3] overflow-hidden relative">
                                        <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">1 MIN FREE</span>
                                    </div>
                                    <div className="p-2"><h3 className="font-bold text-[11px] truncate">{m.title}</h3></div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>

            <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/10 z-40">
                <div className="flex justify-around items-center h-[72px]">
                    <Link href="/" className="flex flex-col items-center gap-1 text-white/40"><Home className="w-5 h-5" /><span className="text-[10px] font-bold">Home</span></Link>
                    <Link href="/movies" className="flex flex-col items-center gap-1 text-white"><Film className="w-5 h-5 fill-white" /><span className="text-[10px] font-black">Movies</span></Link>
                </div>
            </nav>
        </div>
    )
}