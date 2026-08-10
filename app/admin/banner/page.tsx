"use client"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

export default function AdminBanner() {
  const [file, setFile] = useState<File | null>(null)
  const [banners, setBanners] = useState<any[]>([])
  const storage = getStorage()

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map(d => ({id: d.id,...d.data()})))
    })
    return () => unsub()
  }, [])

  const upload = async () => {
    if (!file) return
    const storageRef = ref(storage, `banners/${Date.now()}-${file.name}`)
    const res = await uploadBytes(storageRef, file)
    const url = await getDownloadURL(res.ref)
    await addDoc(collection(db, 'banners'), { imageUrl: url, createdAt: serverTimestamp() })
    setFile(null)
  }

  const deleteBanner = async (id: string) => {
    await deleteDoc(doc(db, 'banners', id))
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Banner Admin</h1>
      
      <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="mb-3"/>
      <button onClick={upload} className="bg-black text-white px-4 py-2 rounded">Upload Banner</button>

      <div className="mt-6 space-y-3">
        {banners.map(b => (
          <div key={b.id} className="flex gap-3 items-center border p-2 rounded">
            <img src={b.imageUrl} className="w-24 h-16 object-cover rounded"/>
            <button onClick={() => deleteBanner(b.id)} className="text-red-500 ml-auto">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}