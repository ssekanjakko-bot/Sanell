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
  const [link, setLink] = useState("")
  const [banners, setBanners] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const storage = getStorage()
  const MAX_BANNERS = 7

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
    if (banners.length >= MAX_BANNERS) return alert(`Max ${MAX_BANNERS} banners reached`)
    
    setUploading(true)
    try {
      const storageRef = ref(storage, `banners/${Date.now()}-${file.name}`)
      const res = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(res.ref)
      await addDoc(collection(db, 'banners'), { 
        imageUrl: url, 
        link: link || "#",
        createdAt: serverTimestamp() 
      })
      setFile(null)
      setLink("")
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
    <div className="p-4 max-w-3xl mx-auto bg-[#faf7f2] min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-[#3d2f1f]">Manage Homepage Banners</h1>
      
      {/* Add/Edit Banner Card */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border">
        <h2 className="font-semibold text-lg mb-1 text-gray-700">
          Add / Edit Banner <span className="text-sm font-normal text-gray-500">{banners.length}/{MAX_BANNERS}</span>
        </h2>
        <p className="text-sm text-gray-500 mb-4">Choose File</p>
        
        <input 
          type="file" 
          accept="image/*"
          onChange={e => setFile(e.target.files?.[0] || null)} 
          className="mb-3 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
        
        <input
          type="text"
          placeholder="Link: When banner is clicked it opens e.g. /category/phones"
          value={link}
          onChange={e => setLink(e.target.value)}
          className="w-full border rounded-md p-2 mb-4 text-sm"
        />
        
        <button 
          onClick={upload} 
          disabled={uploading}
          className="bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 font-medium"
        >
          {uploading? "Adding..." : "Add Banner"}
        </button>
      </div>

      {/* All Banners Card */}
      <div className="bg-white rounded-xl shadow-sm p-5 border">
        <h2 className="font-semibold text-lg mb-4 text-gray-700">All Banners</h2>
        
        {banners.length === 0? (
          <p className="text-gray-500">No banners yet. Add your first one above.</p>
        ) : (
          <div className="space-y-3">
            {banners.map((b, i) => (
              <div key={b.id} className="flex gap-3 items-center border-b pb-3 last:border-0">
                <span className="text-sm font-bold text-gray-400">{i+1}</span>
                <img src={b.imageUrl} className="w-24 h-16 object-cover rounded-md"/>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 truncate">{b.link}</p>
                </div>
                <button 
                  onClick={() => deleteBanner(b.id)} 
                  className="text-red-500 text-sm font-medium hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}