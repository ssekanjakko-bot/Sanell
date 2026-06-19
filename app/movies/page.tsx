"use client"
import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "../lib/firebase"
import Link from "next/link"

interface Movie {
  id: string
  title: string
  genre: string[]
  posterUrl: s

const CATEGORIES = ["All", "Action", "Adventure", "Anime", "TV shows", "Comedy", "Sex,love and crime", "Documentary", "Family", "Fantasy", "Horror"]

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [activeCat, setActiveCat] = useState("All")

  useEffect(() => {
    const fetchMovies = async () => {
      const q = query(collection(db, "movies"), orderBy("createdAt", "desc"))
      const snap = await getDocs(q)
      setMovies(snap.docs.map(d => ({ id: d.id,...d.data() } as Movie)))
    }
    fetchMovies()
  }, [])

  const filtered = activeCat === "All"? movies : movies.filter(m => m.genre?.includes(activeCat))

  return (
    <main className="bg-black min-h-screen text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sanell</h1>
        <Link href="/product" className="bg-green-600 px-4 py-2 rounded">Store</Link>
      </div>

      <input placeholder="Search movies..." className="w-full bg-gray-800 p-3 rounded mb-4 text-white"/>

      <div className="flex gap-2 overflow-x-auto pb-4">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)} className={`px-4 py-2 rounded-full whitespace-nowrap ${activeCat===cat? "bg-red-600" : "bg-gray-800"}`}>
            {cat}
          </button>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4">Movies</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map(m => (
          <Link href={`/movies/watch/${m.id}`} key={m.id} className="block group">
            <div className="aspect-[2/3] bg-gray-900 rounded overflow-hidden">
              <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition"/>
            </div>
            <p className="mt-2 font-bold truncate">{m.title}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
