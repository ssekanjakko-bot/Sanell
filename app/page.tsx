"use client"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

export default function AdminBanner() {
  const [file, setFile] = useState<File | null>(null)
  const [banners, setBanners] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const storage = getStorage()

  // Fetch all banners live
  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map(d => ({id: d.id,...d.data()})))
    })
    return () => unsub()
  }, [])

  const upload = async () => {
    if (!file) return alert("Please select an image first")
    setUploading(true)
    try {
      const storageRef = ref(storage, `banners/${Date.now()}-${file.name}`)
      const res = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(res.ref)
      await addDoc(collection(db, 'banners'), { 
        imageUrl: url, 
        createdAt: serverTimestamp() 
      })
      setFile(null)
      alert("Banner uploaded!")
    } catch (err) {
      alert("Upload failed")
      console.error(err)
    }
    setUploading(false)
  }

  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return
    await deleteDoc(doc(db, 'banners', id))
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Banner Management</h1>
      
      {/* Upload Section */}
      <div className="border rounded-lg p-4 mb-6 bg-white">
        <label className="block text-sm font-medium mb-2">Upload New Banner</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={e => setFile(e.target.files?.[0] || null)} 
          className="mb-3 block w-full text-sm"
        />
        <button 
          onClick={upload} 
          disabled={uploading}
          className="bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          {uploading? "Uploading..." : "Upload Banner"}
        </button>
        <p className="text-xs text-gray-500 mt-2">Recommended size: 1200x400px. Max 7 banners.</p>
      </div>

      {/* Banners List */}
      <h2 className="text-lg font-semibold mb-3">Active Banners: {banners.length}</h2>
      
      {banners.length === 0? (
        <p className="text-gray-500">No banners yet. Upload one above.</p>
      ) : (
        <div className="grid gap-4">
          {banners.map(b => (
            <div key={b.id} className="flex gap-4 items-center border p-3 rounded-lg bg-white shadow-sm">
              <img src={b.imageUrl} className="w-32 h-20 object-cover rounded"/>
              <div className="flex-1">
                <p className="text-xs text-gray-500 truncate">{b.imageUrl}</p>
              </div>
              <button 
                onClick={() => deleteBanner(b.id)} 
                className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}