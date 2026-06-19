"use client"
import { useState, FormEvent, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { storage, db, auth } from "/lib/firebase" // <- your firebase init

interface MovieForm {
  title: string
  description: string
  youtubeId: string
  genre?:string[]
  director?:string
  cast?:string 
  posterUrl?:string
}

export default function AdminPage(): JSX.Element {
  const [form, setForm] = useState<MovieForm>({
    title: "",
    description: "",
    youtubeId: ""
  })
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({...prev, [name]: value }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPosterFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!posterFile ||!form.title ||!form.youtubeId) {
      alert("Title, YouTube ID, and Poster are required")
      return
    }

    const user = auth.currentUser
    if (!user) {
      alert("You must be logged in as admin")
      return
    }

    setLoading(true)
    try {
      // 1. Upload poster to Storage
      const posterRef = ref(storage, `posters/${Date.now()}_${posterFile.name}`)
      const uploadSnap = await uploadBytes(posterRef, posterFile)

      // 2. Get HTTPS download URL automatically
      const posterUrl: string = await getDownloadURL(uploadSnap.ref)

      // 3. Save to Firestore - no manual link copy needed
      await addDoc(collection(db, "movies"), {
        title: form.title,
        description: form.description,
        youtubeId: form.youtubeId, // just the ID: dQw4w9WgXcQ
        posterUrl: posterUrl, // full https link
        createdAt: serverTimestamp() as Timestamp,
        adminId: user.uid // r76GyBE2EduiosQsdSFCity42
      })

      alert("Movie added successfully!")
      setForm({ title: "", description: "", youtubeId: "" })
      setPosterFile(null)
      router.push("/movies")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error? err.message : "Unknown error"
      console.error(err)
      alert("Error: " + errorMessage)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Movie</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Movie Title: CLEANER"
          value={form.title}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="youtubeId"
          placeholder="YouTube ID only: dQw4w9WgXcQ"
          value={form.youtubeId}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          rows={3}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded disabled:opacity-50"
        >
          {loading? "Adding..." : "Add Movie"}
        </button>
      </form>
    </div>
  )
}
