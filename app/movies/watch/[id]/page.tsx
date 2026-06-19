'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'

export default function MovieWatchPage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchMovie = async () => {
      const docRef = doc(db, 'movies', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setMovie({ id: docSnap.id,...docSnap.data() })
      }
      setLoading(false)
    }
    fetchMovie()
  }, [id])

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!movie) return <div className="p-8 text-center">Movie not found</div>

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 border-b border-gray-800">
        <Link href="/movies" className="text-sm text-gray-400 hover:text-white">← Back to Movies</Link>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">{movie.title}</h1>
        <p className="text-gray-400 mb-4">{movie.category}</p>

        {/* Video Player: YouTube embed OR normal video */}
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-6">
          {movie.youtubeId? (
            <iframe
              src={`https://www.youtube.com/embed/${movie.youtubeId}`}
              title={movie.title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              src={movie.videoUrl}
              controls
              className="w-full h-full"
              poster={movie.imageUrl}
            />
          )}
        </div>

        {movie.description && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-300">{movie.description}</p>
          </div>
        )}

        {movie.imageUrl &&!movie.youtubeId && (
          <img src={movie.imageUrl} alt={movie.title} className="w-full rounded-lg mt-6 hidden" />
        )}
      </div>
    </div>
  )
}
