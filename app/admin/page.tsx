"use client"
import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "../lib/firebase"
import Link from "next/link"

const CATS = ["Action", "Adventure"Anime", "TV shows", "Comedy", "Sex,love and crime", "Documentary", "Family", "Fantasy", "Horror"]

type Movie = {id: string, title: string, desc: string, youtubeId: string, posterUrl: string, director: string, cast: string, genre: string[]}

export default function Admin() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [form, setForm] = useState({title:"", desc:"", youtubeId:"", director:"", cast:"", genre:[] as string[]})
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadMovies = async () => {
    const snap = await getDocs(query(collection(db, "movies"), orderBy("createdAt", "desc")))
    setMovies(snap.docs.map(d => ({id: d.id,...d.data()} as Movie)))
  }
  useEffect(() => { loadMovies() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!form.title ||!form.youtubeId || form.genre.length === 0)
      return alert("Title, YouTube ID, and 1+ Category are required")
    if(!posterFile &&!editId) return alert("Poster image is required for new movies")

    setLoading(true)
    let posterUrl = editId? movies.find(m => m.id === editId)!.posterUrl : ""

    if(posterFile) {
      const posterRef = ref(storage, `posters/${Date.now()}-${posterFile.name}`)
      const snap = await uploadBytes(posterRef, posterFile)
      posterUrl = await getDownloadURL(snap.ref)
    }

    const data = {...form, posterUrl, createdAt: editId? movies.find(m => m.id === editId)!.createdAt : serverTimestamp()}

    if(editId) {
      await updateDoc(doc(db, "movies", editId), data)
      setEditId(null)
    } else {
      await addDoc(collection(db, "movies"), data)
    }

    setForm({title:"", desc:"", youtubeId:"", director:"", cast:"", genre:[]})
    setPosterFile(null)
    setLoading(false)
    loadMovies()
  }

  const handleEdit = (movie: Movie) => {
    setEditId(movie.id)
    setForm({title: movie.title, desc: movie.desc, youtubeId: movie.youtubeId, director: movie.director, cast: movie.cast, genre: movie.genre})
    setPosterFile(null)
    window.scrollTo({top: 0, behavior: 'smooth'})
  }

  const handleDelete = async (id: string) => {
    if(confirm("Delete this movie?")) {
      await deleteDoc(doc(db, "movies", id))
      loadMovies()
    }
  }

  const toggleGenre = (cat: string) => {
    setForm(prev => ({...prev, genre: prev.genre.includes(cat)? prev.genre.filter(g => g!== cat) : [...prev.genre, cat]}))
  }

  return (
    <main className="bg-black text-white min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Link href="/" className="bg-gray-700 px-4 py-2 rounded">View Site</Link>
        </div>

        <form onSubmit={handleSave} className="bg-gray-900 p-6 rounded-lg mb-8 space-y-4">
          <h2 className="text-2xl font-bold">{editId? "Edit Movie" : "Add New Movie"}</h2>

          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Movie Title *" className="w-full p-3 bg-gray-800 rounded"/>
          <textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="Description" rows={3} className="w-full p-3 bg-gray-800 rounded"/>
          <input value={form.youtubeId} onChange={e => setForm({...form, youtubeId: e.target.value})} placeholder="YouTube Video ID * Ex: dQw4w9WgXcQ" className="w-full p-3 bg-gray-800 rounded"/>

          <div>
            <label className="block mb-1">Poster Image {editId && "- leave empty to keep current"}</label>
            <input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] || null)} className="w-full p-2 bg-gray-800 rounded file:bg-red-600 file:text-white file:border-none file:rounded file:px-4 file:py-2"/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.director} onChange={e => setForm({...form, director: e.target.value})} placeholder="Director" className="w-full p-3 bg-gray-800 rounded"/>
            <input value={form.cast} onChange={e => setForm({...form, cast: e.target.value})} placeholder="Cast" className="w-full p-3 bg-gray-800 rounded"/>
          </div>

          <div>
            <p className="mb-2">Categories *</p>
            <div className="flex flex-wrap gap-2">
              {CATS.map(cat => (
                <button type="button" key={cat} onClick={() => toggleGenre(cat)} className={`px-4 py-2 rounded-full text-sm ${form.genre.includes(cat)? "bg-red-600" : "bg-gray-700"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-bold disabled:opacity-50">
              {loading? "Saving..." : editId? "Update Movie" : "Add Movie"}
            </button>
            {editId && <button type="button" onClick={() => {setEditId(null); setForm({title:"", desc:"", youtubeId:"", director:"", cast:"", genre:[]}); setPosterFile(null)}} className="bg-gray-600 px-6 py-2 rounded font-bold">Cancel</button>}
          </div>
        </form>

        <h2 className="text-2xl font-bold mb-4">All Movies</h2>
        <div className="space-y-3">
          {movies.map(m => (
            <div key={m.id} className="bg-gray-900 p-4 rounded-lg flex items-center justify-between gap-4">
              <div className="flex gap-4 items-center overflow-hidden">
                <img src={m.posterUrl} alt={m.title} className="w-16 h-24 object-cover rounded flex-shrink-0"/>
                <div className="overflow-hidden">
                  <p className="font-bold truncate">{m.title}</p>
                  <p className="text-sm text-gray-400 truncate">{m.genre.join(", ")}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(m)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold">Edit</button>
                <button onClick={() => handleDelete(m.id)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
