'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, Bell, Home ,Tv, Film, PlayCircle, User, ChevronRight } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

type Movie = {
  id: string
  title: string
  category: string
  description: string
  videoUrl: string
  imageUrl: string  // Changed from posterUrl to match Admin
  youtubeId?: string
  createdAt: any
}

export const CATEGORY_OPTIONS = [
  'All', 'Action', 'Adventure', 'Anime', 'TV shows', 'Comedy', 'Sex,love and crime',
  'Documentary', 'Family', 'Fantasy', 'Horror', '❤️ Romance', 'Sci-Fi', 'Thriller', 
  'K-Drama', 'C-Drama', 'DC Movies', 'Marvel Movies', 'Trending Now', 'Most popular', 'Most Trending'
]

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

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

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesCategory = selectedCategory === 'All' || movie.category === selectedCategory
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery, movies])

  const moviesToShow = showAll ? filteredMovies : filteredMovies.slice(0, 6)
  const recentMovies = movies.slice(0, 3)

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-red-600">Sanel</h1>
          <div className="flex gap-4"><Search className="w-6 h-6" /><Bell className="w-6 h-6" /></div>
        </div>
        <input
          type="text" placeholder="Search movies..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mt-3 px-4 py-2 rounded-lg bg-gray-900 text-white focus:outline-none focus:border-red-600"
        />
      </header>

      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {CATEGORY_OPTIONS.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${selectedCategory === cat ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {recentMovies.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="text-xl font-bold mb-3">Recent</h2>
          <div className="flex gap-3 overflow-x-auto">
            {recentMovies.map((movie) => (
              <Link key={movie.id} href={`/movies/${movie.id}`} className="flex-shrink-0">
                <div className="w-40 h-60 rounded-lg overflow-hidden relative group">
                  <img src={movie.imageUrl} alt={movie.title} className="w-full h-full object-cover" />
                  <PlayCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white opacity-0 group-hover:opacity-100" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-sm font-semibold truncate">{movie.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Movies</h2>
          <button onClick={() => setShowAll(!showAll)} className="text-red-600 text-sm flex items-center gap-1">
            {showAll ? 'Show less' : 'See all'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {movies.length === 0 ? (
          <p className="text-gray-400">No movies yet. Add some from /admin</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {moviesToShow.map((m) => (
              <Link key={m.id} href={`/movies/${m.id}`}>
                <div className="rounded-lg overflow-hidden bg-gray-900 hover:scale-105 transition-transform">
                  <div className="aspect-[2/3]">
                    <img src={m.imageUrl} alt={m.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-sm truncate">{m.title}</h3>
                    <p className="text-xs text-gray-400">{m.category}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-gray-800">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className="flex flex-col items-center text-gray-400"><Home className="w-6 h-6" /><span className="text-xs">Home</span></Link>
          <Link href="/series" className="flex flex-col items-center text-gray-400"><Tv className="w-6 h-6" /><span className="text-xs">Series</span></Link>
          <Link href="/movies" className="flex flex-col items-center text-red-600"><Film className="w-6 h-6" /><span className="text-xs">Movies</span></Link>
          <Link href="/tv" className="flex flex-col items-center text-gray-400"><PlayCircle className="w-6 h-6" /><span className="text-xs">TV Show</span></Link>
          <Link href="/profile" className="flex flex-col items-center text-gray-400"><User className="w-6 h-6" /><span className="text-xs">Profile</span></Link>
        </div>
      </nav>
    </div>
  )
}
