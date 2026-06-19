"use client"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../../lib/firebase" // <- 3 dots up: watch -> movies -> app -> lib
import { useParams } from "next/navigation"
import Link from "next/link"

interface Movie {
  title: string
  description: string
  youtubeId: string
  genre: string[]
  director?: string
  cast?: string
  posterUrl: string
}

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return
      const snap = await getDoc(doc(db, "movies", id))
      if (snap.exists()) setMovie(snap.data() as Movie)
      setLoading(false)
    }
    fetchMovie()
  }, [id])

  if (loading) return <div className="bg-black text-white p-8">Loading...</div>
  if (!movie) return <div className="bg-black text-white p-8">Movie not found</div>

  return (
    <main className="bg-black min-h-screen text-white">
      <Link href="/" className="p-4 block underline">← Back</Link>

      <div className="aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${movie.youtubeId}?autoplay=1&rel=0`}
          title={movie.title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>

      <div className="p-6">
        <h1 className="text-3xl font-bold">{movie.title}</h1>
        <p className="text-gray-400 my-2">{movie.genre?.join(", ")}</p>
        <p className="mt-4">{movie.description}</p>
        {movie.director && <p className="mt-2"><b>Director:</b> {movie.director}</p>}
        {movie.cast && <p><b>Cast:</b> {movie.cast}</p>}
      </div>
    </main>
  )
}
