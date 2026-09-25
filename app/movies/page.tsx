'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, Bell, Home, Tv, Film, Play, Star, Clock, ChevronRight, X } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

type Movie = {
    id: string
    title: string
    year?: number
    releaseDate?: string
    genre?: string[]
    description: string
    videoUrl: string
    posterUrl: string
    category?: string
    duration: string
    createdAt: any
}

export const CATEGORY_OPTIONS = [
    'All', 'Action', 'Adventure', 'Anime', 'Comedy', 'Family', 'Fantasy', 'Horror', '💖Romance', 'Sci-Fi', 'Thriller', 'K-Drama', 'C-Drama', 'DC Movies', 'Marval Movies', 'Trending Now', 'Most popular'
]

export default function MoviesPage() {
    const [movies, setMovies] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [heroIndex, setHeroIndex] = useState(0)

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const q = query(collection(db, "movies"), orderBy("createdAt", "desc"))
                const snapshot = await getDocs(q)
                const moviesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                   ...doc.data()
                })) as Movie[]
                setMovies(moviesData)
            } catch (error) {
                console.error("Error fetching movies:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchMovies()
    }, [])

    // auto rotate hero
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

    if (loading) return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-4">
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-white/10 rounded w-24"></div>
                <div className="h-[420px] bg-white/10 rounded-2xl"></div>
                <div className="grid grid-cols-3 gap-3">{[1,2,3,4,5,6].map(i=><div key={i} className="h-44 bg-white/10 rounded-xl"></div>)}</div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
                <div className="px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-black">S</div>
                        <h1 className="text-xl font-black tracking-tight">SANEL<span className="text-red-600">FLIX</span></h1>
                    </Link>
                    <div className="flex gap-3 items-center">
                        <Link href="/" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><Home size={16}/></Link>
                        <button className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><Bell size={16}/></button>
                    </div>
                </div>
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18}/>
                        <input
                            type="text" placeholder="Search movies, series..." value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 rounded-full bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 focus:border-red-600 text-sm"
                        />
                        {searchQuery && <button onClick={()=>setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"><X size={12}/></button>}
                    </div>
                </div>
            </header>

            {/* HERO */}
            {!searchQuery && hero && (
                <div className="relative mx-3 mt-3 rounded-[20px] overflow-hidden h-[460px] group">
                    <img src={hero.posterUrl} alt={hero.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 p-5 w-full">
                        <div className="flex gap-2 mb-3">
                            <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">TRENDING # {heroIndex+1}</span>
                            <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Star size={10} fill="white"/> 4.8</span>
                            {hero.duration && <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock size={10}/>{hero.duration}</span>}
                        </div>
                        <h2 className="text-3xl font-black leading-tight line-clamp-2">{hero.title}</h2>
                        <p className="text-sm text-white/70 mt-2 line-clamp-2">{hero.description || 'Watch now on SanelFlix - Uganda\'s best campus streaming'}</p>
                        <div className="flex gap-2 mt-4">
                            <Link href={`/movies/watch/${hero.id}`} className="flex-1 bg-white text-black py-3 rounded-full font-black text-sm flex items-center justify-center gap-2"><Play size={16} fill="black"/> Watch Now</Link>
                            <Link href={`/movies/watch/${hero.id}`} className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"><ChevronRight size={20}/></Link>
                        </div>
                        <div className="flex gap-1.5 mt-4 justify-center">
                            {heroMovies.map((_,i)=><div key={i} className={`h-1 rounded-full transition-all ${i===heroIndex?'w-6 bg-red-600':'w-1.5 bg-white/30'}`}></div>)}
                        </div>
                    </div>
                </div>
            )}

            {/* CATEGORIES */}
            <div className="px-3 mt-5">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {CATEGORY_OPTIONS.map((cat) => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${selectedCategory === cat? 'bg-white text-black border-white' : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15 hover:text-white'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* RECENT / CONTINUED */}
            {!searchQuery && (
                <section className="px-3 mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-black text-[16px]">Continue Watching</h2>
                        <span className="text-[11px] text-white/50 font-bold">{movies.slice(0,3).length} NEW</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                        {movies.slice(0,6).map((movie) => (
                            <Link key={movie.id} href={`/movies/watch/${movie.id}`} className="flex-shrink-0 group">
                                <div className="w-[140px]">
                                    <div className="w-[140px] h-[200px] rounded-xl overflow-hidden relative bg-white/10">
                                        <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
                                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-[9px] font-black px-2 py-1 rounded-full">{movie.duration || '2h'}</div>
                                        <div className="absolute bottom-2 left-2 right-2">
                                            <div className="h-1 bg-white/30 rounded-full overflow-hidden"><div className="h-full bg-red-600 w-[35%]"></div></div>
                                        </div>
                                        <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition drop-shadow-xl" fill="white"/>
                                    </div>
                                    <h3 className="text-[12px] font-bold mt-2 truncate">{movie.title}</h3>
                                    <p className="text-[10px] text-white/50 truncate">{(movie as any).year || movie.releaseDate || '2024'} • {movie.category || movie.genre?.[0] || 'Movie'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ALL MOVIES GRID */}
            <section className="px-3 mt-7">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-black text-[16px]">{searchQuery? `Results for "${searchQuery}"` : `${selectedCategory} • ${filteredMovies.length} titles`}</h2>
                </div>

                {filteredMovies.length === 0? (
                    <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                        <Film className="mx-auto text-white/20" size={40}/>
                        <p className="text-white/60 mt-3 text-sm font-bold">No movies found</p>
                        <p className="text-white/30 text-xs mt-1">Try another category or add from admin</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {filteredMovies.map((m) => (
                            <Link key={m.id} href={`/movies/watch/${m.id}`} className="group">
                                <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition">
                                    <div className="aspect-[2/3] relative overflow-hidden">
                                        <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                                        <div className="absolute bottom-1.5 left-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition">
                                            <div className="bg-white text-black text-[10px] font-black py-1 rounded-full text-center flex items-center justify-center gap-1"><Play size={10} fill="black"/> Play</div>
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <h3 className="font-bold text-[11px] truncate">{m.title}</h3>
                                        <p className="text-[10px] text-white/50 truncate mt-0.5">{(m as any).year || m.releaseDate?.slice(0,4) || '2024'} • {(m as any).genre?.[0] || m.category || 'Movie'}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* BOTTOM NAV - Matches Sanel main site */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/10 z-50">
                <div className="flex justify-around items-center h-[72px] px-2">
                    <Link href="/" className="flex flex-col items-center gap-1 text-white/40 hover:text-white"><Home className="w-5 h-5" /><span className="text-[10px] font-bold">Home</span></Link>
                    <Link href="/movies" className="flex flex-col items-center gap-1 text-white"><Film className="w-5 h-5 fill-white" /><span className="text-[10px] font-black">Movies</span></Link>
                    <Link href="/movies" className="flex flex-col items-center gap-1 text-white/40 hover:text-white"><Tv className="w-5 h-5" /><span className="text-[10px] font-bold">Series</span></Link>
                    <Link href="/profile" className="flex flex-col items-center gap-1 text-white/40 hover:text-white"><div className="w-6 h-6 bg-white/20 rounded-full"></div><span className="text-[10px] font-bold">Profile</span></Link>
                </div>
            </nav>
        </div>
    )
}