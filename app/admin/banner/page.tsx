"use client"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Image as ImageIcon, Link as LinkIcon, Trash2, Upload, ExternalLink, Check } from "lucide-react"

export default function AdminBanner() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [link, setLink] = useState("")
  const [banners, setBanners] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const storage = getStorage()
  const MAX_BANNERS = 7

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map(d => ({id: d.id,...d.data()})))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if(!file){ setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return ()=> URL.revokeObjectURL(url)
  }, [file])

  const upload = async () => {
    if (!file) return alert("Select image first")
    if (banners.length >= MAX_BANNERS) return alert(`Max ${MAX_BANNERS} banners reached - delete one`)
    setUploading(true)
    try {
      const storageRef = ref(storage, `banners/${Date.now()}-${file.name}`)
      const res = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(res.ref)
      await addDoc(collection(db, 'banners'), { imageUrl: url, link: link || "#", createdAt: serverTimestamp() })
      setFile(null); setPreview(null); setLink("")
    } catch (err) { alert("Upload failed") }
    setUploading(false)
  }

  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return
    await deleteDoc(doc(db, 'banners', id))
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-black">Homepage Banners</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-black ${banners.length>=MAX_BANNERS?'bg-red-600 text-white':'bg-black text-white'}`}>{banners.length}/{MAX_BANNERS}</span>
        </div>

        <div className="bg-white border border-black rounded-[20px] p-5 shadow-sm mb-6">
          <h2 className="font-black text-black flex items-center gap-2"><Upload size={18}/> Add New Banner</h2>
          <p className="text-xs text-black/60 font-medium mt-1">Upload 1200x400 recommended. Link where banner goes when tapped.</p>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <label className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition ${preview?'border-black bg-[#FFF7ED]':'border-black/20 hover:border-black'}`}>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
              {preview? <img src={preview} className="w-full h-32 object-cover rounded-lg"/> : <>
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center"><ImageIcon className="text-white" size={18}/></div>
                <p className="text-xs font-black mt-2 text-black">Click to choose file</p>
                <p className="text-[10px] text-black/50">PNG, JPG, WEBP</p>
              </>}
            </label>

            <div>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={16}/>
                <input type="text" placeholder="Link: /category/phones or https://..." value={link} onChange={e => setLink(e.target.value)} className="w-full border-2 border-black rounded-full pl-10 pr-4 py-3 text-sm text-black font-medium placeholder:text-black/40 focus:outline-none"/>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={upload} disabled={uploading ||!file} className="flex-1 bg-black text-white py-3 rounded-full font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                  {uploading? "Adding..." : <><Check size={16}/> Add Banner</>}
                </button>
                {file && <button onClick={()=>{setFile(null);setPreview(null)}} className="px-5 border-2 border-black rounded-full font-black text-sm text-black">Clear</button>}
              </div>
              <p className="text-[11px] mt-2 text-black/60">Pay verification still to <b className="text-black">0767483636</b></p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-[20px] p-5">
          <h2 className="font-black text-black mb-4">All Banners • Live Preview</h2>
          {banners.length === 0? (
            <div className="text-center py-12 bg-[#FDF8F3] rounded-xl border border-dashed"><p className="text-sm font-bold text-black/40">No banners yet</p></div>
          ) : (
            <div className="grid gap-3">
              {banners.map((b, i) => (
                <div key={b.id} className="group flex gap-3 items-center border-2 border-black/5 hover:border-black rounded-xl p-2 bg-[#FFFEFB] transition">
                  <span className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-xs font-black">{i+1}</span>
                  <img src={b.imageUrl} className="w-32 h-16 object-cover rounded-lg border"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-black truncate flex items-center gap-1"><ExternalLink size={12}/>{b.link}</p>
                    <p className="text-[10px] text-black/50">{b.createdAt?.toDate? b.createdAt.toDate().toLocaleDateString(): 'just now'}</p>
                  </div>
                  <button onClick={() => deleteBanner(b.id)} className="w-9 h-9 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-600 hover:border-red-600 hover:text-white transition"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}