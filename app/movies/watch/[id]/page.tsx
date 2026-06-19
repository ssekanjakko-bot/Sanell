"use client"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../../lib/firebase"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function WatchPage() {
  const { id } = useParams()
  const [movie, setMovie] = useState<an
  useEffect(() => {
    if(!id) return
    getDoc(doc(db, "movies", id as string)).then(snap => {
      if(snap.exists()) setMovie(snap.data())
    })
  }, [id])

  if(!movie) return <div className="bg-black text-white h-screen grid place-items-center">Loading...</div>

  return (
    <main className="bg-black text-white min-h-screen">
      <Link href="/" className="p-4 block underline hover:text-red-500">← Back to Home</Link>
      <div className="aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${movie.youtubeId}?autoplay=1&rel=0`}
          title={movie.title}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold">{movie.title}</h1>
        <p className="text-gray-400 my-2">{movie.genre?.join(", ")}</p>
        <p className="mt-4 text-gray-200">{movie.desc}</p>
        {movie.director && <p className="mt-4"><b>Director:</b> {movie.director}</p>}
        {movie.cast && <p><b>Cast:</b> {movie.cast}</p>}
      </div>
    </main>
  )
}
