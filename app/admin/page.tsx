"use client"
import { useState, FormEvent, ChangeEvent } from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db, storage, auth } from "../../lib/firebase"

interface MovieForm {
  title: string
  description: string
  youtubeId:
  genre?: string[]
  director?: string
  ca
  posterUrl: string
  createdBy: string
  createdAt: any
}

export default function AdminPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeId, setYoutubeId] = useState("")
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!posterFile) return alert("Select a poster image first")

    setLoading(true)
    try {
      const fileRef = ref(storage, `posters/${Date.now()}-${posterFile.name}`)
      const snap = await uploadBytes(fileRef, posterFile)
      const posterUrl = await getDownloadURL(snap.ref)

      const movieData: MovieForm = {
        title,
        description,
        youtubeId,
        posterUrl,
        createdBy: auth.currentUser?.uid || "admin",
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, "movies"), movieData)
      alert("Movie added successfully")
      setTitle("")
      setDescription("")
      setYoutubeId("")
      setPosterFile(null)
    } catch (error) {
      console.error(error)
      alert("Error: " + String(error))
    }
    setLoading(false)
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Add Movie</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="YouTube ID, ex: dQw4w9WgXcQ"
          value={youtubeId}
          onChange={(e) => setYoutubeId(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
          required
          className="w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading? "Uploading..." : "Add Movie"}
        </button>
      </form>
    </main>
  )
}
