"use client"
import { useState, useEffect } from "react"
import { db, storage } from "@/lib/firebase" // change this to your firebase init path
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, addDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, doc } from "firebase/firestore"

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([])
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerLink, setBannerLink] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Load all banners
  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map(d => ({id: d.id,...d.data()})))
    })
    return () => unsub()
  }, [])

  // CREATE or UPDATE
  const handleBannerSave = async () => {
    if (!editingId && banners.length >= 7) return alert("Max 7 banners reached. Delete one first.")
    if (!bannerFile &&!editingId) return alert("Pick an image")
    if (!bannerLink) return alert("Add a link")
    setUploading(true)

    let imageUrl = ""
    if (bannerFile) {
      const storageRef = ref(storage, `banners/${Date.now()}_${bannerFile.name}`)
      const snap = await uploadBytes(storageRef, bannerFile)
      imageUrl = await getDownloadURL(snap.ref)
    }

    if (editingId) {
      // EDIT
      await updateDoc(doc(db, 'banners', editingId), {
      ...(imageUrl && {imageUrl}),
        link: bannerLink
      })
      setEditingId(null)
    } else {
      // CREATE
      await addDoc(collection(db, 'banners'), {
        imageUrl,
        link: bannerLink,
        createdAt: serverTimestamp()
      })
    }

    setBannerFile(null)
    setBannerLink("")
    setUploading(false)
  }

  // DELETE
  const handleDelete = async (id: string) => {
    if(confirm("Delete this banner?")){
      await deleteDoc(doc(db, 'banners', id))
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Homepage Banners</h1>

      {/* Upload Form */}
      <div className="p-6 bg-gray-50 rounded-2xl border mb-6">
        <h2 className="text-xl font-bold mb-2">Add / Edit Banner <span className="text-sm font-normal text-gray-600">{banners.length}/7</span></h2>

        {banners.length >= 7 &&!editingId && <p className="text-red-500 text-sm mb-3">Max reached. Delete a banner to add new one.</p>}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={e => setBannerFile(e.target.files?.[0] || null)}
          className="mb-3 w-full"
        />
        <input
          type="text"
          placeholder="Link when banner is clicked e.g. https://sanel-ug.online/sale"
          value={bannerLink}
          onChange={e => setBannerLink(e.target.value)}
          className="w-full border rounded p-2 mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={handleBannerSave}
            disabled={uploading}
            className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50"
          >
            {uploading? 'Saving...' : editingId? 'Update Banner' : 'Add Banner'}
          </button>
          {editingId && (
            <button
              onClick={() => {setEditingId(null); setBannerLink(""); setBannerFile(null)}}
              className="px-4 py-2 bg-gray-300 rounded-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Banner List */}
      <div className="p-6 bg-white rounded-2xl border">
        <h3 className="font-bold mb-4">All Banners</h3>
        {banners.length === 0? (
          <p className="text-gray-500 text-sm">No banners yet. Add your first one above.</p>
        ) : (
          <div className="space-y-3">
            {banners.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
                <img src={b.imageUrl} className="w-40 h-24 object-cover rounded" />
                <div className="flex-1">
                  <p className="text-sm truncate text-gray-700">{b.link}</p>
                </div>
                <button
                  onClick={() => {setEditingId(b.id); setBannerLink(b.link)}}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm"
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