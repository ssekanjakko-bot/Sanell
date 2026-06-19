"use client"
import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "../lib/firebase"

interface Movie {
  id: string
  title: string
  description: string
  youtubeId: string
  genre: string[]
  director: string
  cast: string
  posterUrl: string
  createdAt: any
}

const ALL_CATEGORIES = ["Action", "Adventure", "Anime", "TV shows", "Comedy", "Sex,love and crime", "Documentary", "Family", "Fantasy", "Horror"]

export default function AdminPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeId, setYoutubeId] = useState("")
  const [genre, setGenre] = useState<string[]>([])
  const [director, setDirector] = useState("")
  const [cast, setCast] = useState("")
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchMovies = async () => {
    setLoading(true)
    const q = query(collection(db, "movies"), orderBy("createdAt", "desc"))
    const snap = await getDocs(q)
    setMovies(snap.docs.map(d => ({ id: d.id,...d.data() } as Movie)))
    setLoading(false)
  }

  useEffect(() => { fetchMovies() }, [])

  const toggleGenre = (cat: string) => {
    setGenre(prev => prev.includes(cat)? prev.filter(g => g!== cat) : [...prev, cat])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() ||!youtubeId.trim() || genre.length === 0) return alert("Title, YouTube ID, and at least 1 category are required")

    setLoading(true)
    let posterUrl = editingId? movies.find(m => m.id === editingId)?.posterUrl || "" : ""

    try {
      if (posterFile) {
        const posterRef = ref(storage, `posters/${Date.now()}-${posterFile.name}`)
        const snap = await uploadBytes(posterRef, posterFile)
        posterUrl = await getDownloadURL(snap.ref)
      }

      if (!posterUrl &&!editingId) return alert("Poster image is required for new movies")

      const data = { 
        title: title.trim(), 
        description: description.trim(), 
        youtubeId: youtubeId.trim(), 
        genre, 
        director: director.trim(), 
        cast: cast.trim(), 
        posterUrl, 
        createdAt: editingId? movies.find(m => m.id === editingId)?.createdAt : serverTimestamp() 
      }

      if (editingId) {
        await updateDoc(doc(db, "movies", editingId), data)
      } else {
        await addDoc(collection(db, "movies"), {...data, createdAt: serverTimestamp()})
      }

      resetForm()
      fetchMovies()
    } catch (err) {
      console.error(err)
      alert("Error saving movie. Check Storage Rules for /posters")
    }
    setLoading(false)
  }

  const handleEdit = (movie: Movie) => {
    setEditingId(movie.id)
    setTitle(movie.title)
    setDescription(movie.description)
    setYoutubeId(movie.youtubeId)
    setGenre(movie.genre)
    setDirector(movie.director)
    setCast(movie.cast)
    setPosterFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this movie? This cannot be undone.")) return
    setLoading(true)
    await deleteDoc(doc(db, "movies", id))
    fetchMovies()
  }

  const resetForm = () => {
    setTitle(""); setDescription(""); setYoutubeId(""); setGenre([]); setDirector(""); setCast(""); setPosterFile(null); setEditingId(null)
  }

  return (
    <main className="bg-black text-white min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin - Manage Movies</h1>
        
        <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg mb-8 space-y-4">
          <h2 className="text-2xl font-bold">{editingId? "Edit Movie" : "Add New Movie"}</h2>
          
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" className="w-full p-3 bg-gray-800 rounded text-white" required/>
          
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={4} className="w-full p-3 bg-gray-800 rounded text-white"/>
          
          <input value={youtubeId} onChange={e => setYoutubeId(e.target.value)} placeholder="YouTube Video ID * Ex: dQw4w9WgXcQ" className="w-full p-3 bg-gray-800 rounded text-white" required/>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={director} onChange={e => setDirector(e.target.value)} placeholder="Director" className="w-full p-3 bg-gray-800 rounded text-white"/>
            <input value={cast} onChange={e => setCast(e.target.value)} placeholder="Cast" className="w-full p-3 bg-gray-800 rounded text-white"/>
          </div>

          <div>
            <label className="block mb-2">Poster Image {editingId && "(leave empty to keep current)"}</label>
            <input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] || null)} className="w-full p-2 bg-gray-800 rounded file:bg-red-600 file:text-white file:border-none file:rounded file:px-4 file:py-2"/>
          </div>
          
          <div>
            <p className="mb-2">Categories *</p>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => (
                <button type="button" key={cat} onClick={() => toggleGenre(cat)} className={`px-4 py-2 rounded-full text-sm ${genre.includes(cat)? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-bold disabled:opacity-50">
              {loading? "Saving..." : editingId? "Update Movie" : "Add Movie"}
            </button>
            {editingId && <button type="button" onClick={resetForm} className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded font-bold">Cancel</button>}
          </div>
        </form>

        <h2 className="text-2xl font-bold mb-4">Existing Movies</h2>
        {loading && movies.length === 0? <p>Loading...</p> : (
          <div className="space-y-3">
            {movies.map(m => (
              <div key={m.id} className="bg-gray-900 p-4 rounded-lg flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex gap-4 items-center">
                  <img src={m.posterUrl} alt={m.title} className="w-16 h-24 object-cover rounded flex-shrink-0"/>
                  <div>
                    <p className="font-bold text-lg">{m.title}</p>
                    <p className="text-sm text-gray-400">{m.genre.join(", ")}</p>
                    <p className="text-xs text-gray-500">YT: {m.youtubeId}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(m)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold">Edit</button>
                  <button onClick={() => handleDelete(m.id)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold">Delete</button>
                </div>
              </div>
            ))}
            {movies.length === 0 && <p className="text-gray-500">No movies yet. Add one above.</p>}
          </div>
        )}
      </div>
    </main>
  )
}
