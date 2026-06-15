'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { auth, db, storage } from '@/lib/firebase'
import {
          collection, addDoc, query, where, doc, deleteDoc,
          updateDoc, onSnapshot, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged, User } from 'firebase/auth'
import Link from 'next/link'

const COFFEE_BROWN = '#6F4E37'
const COFFEE_LIGHT = '#A67B5B'

// Categories from your screenshot
const CATEGORIES = [
          'Vehicles',
          'Phones',
          'Houses & Rentals',
          'Electronics',
          'Home, Furniture & Appliances',
          'Health',
          'Fashion',
          'Sports, Arts & Outdoor',
          'Babies & Kids',
          'Animals & Pets',
          'Agriculture & Food',
          'Commercial Equipment & Tools',
          'Repair & Construction',
          'Stationery',
          'Services',
          'Jobs'
]

type Product = {
          id: string
          title: string
          description: string
          price: number
          category: string
          images: string[]
          videoUrl: string
          whatsapp: string
          sellerId: string
          sellerEmail: string
          createdAt: Timestamp
}

export default function SellPage() {
          const [user, setUser] = useState<User | null>(null)
          const [products, setProducts] = useState<Product[]>([])
          const [editing, setEditing] = useState<Product | null>(null)
          const [loading, setLoading] = useState(false)

          // Form state
          const [title, setTitle] = useState('')
          const [description, setDescription] = useState('')
          const [price, setPrice] = useState('')
          const [category, setCategory] = useState(CATEGORIES[0])
          const [whatsapp, setWhatsapp] = useState('') // Format: 2567xxxxxxx
          const [imageFiles, setImageFiles] = useState<File[]>([])
          const [videoFile, setVideoFile] = useState<File | null>(null)

          useEffect(() => {
                    const unsubAuth = onAuthStateChanged(auth, (u) => {
                              setUser(u)
                              if (u) {
                                        const q = query(collection(db, 'products'), where('sellerId', '==', u.uid))
                                        const unsubProducts = onSnapshot(q, (snap) => {
                                                  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
                                                  setProducts(items.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds))
                                        })
                                        return () => unsubProducts()
                              } else {
                                        setProducts([])
                              }
                    })
                    return () => unsubAuth()
          }, [])

          const resetForm = () => {
                    setTitle('')
                    setDescription('')
                    setPrice('')
                    setCategory(CATEGORIES[0])
                    setWhatsapp('')
                    setImageFiles([])
                    setVideoFile(null)
                    setEditing(null)
          }

          const uploadFiles = async (uid: string) => {
                    const imageUrls: string[] = []
                    const timestamp = Date.now()

                    for (let i = 0; i < imageFiles.length; i++) {
                              const file = imageFiles[i]
                              const imgRef = ref(storage, `products/${uid}/${timestamp}_img_${i}_${file.name}`)
                              const snap = await uploadBytes(imgRef, file)
                              imageUrls.push(await getDownloadURL(snap.ref))
                    }

                    let videoUrl = ''
                    if (videoFile) {
                              const vidRef = ref(storage, `products/${uid}/${timestamp}_vid_${videoFile.name}`)
                              const snap = await uploadBytes(vidRef, videoFile)
                              videoUrl = await getDownloadURL(snap.ref)
                    }

                    return { imageUrls, videoUrl }
          }

          const handleSubmit = async (e: FormEvent) => {
                    e.preventDefault()
                    if (!user) return alert('You must be logged in')
                    if (!whatsapp.match(/^256\d{9}$/)) return alert('WhatsApp format: 2567xxxxxxx no + or spaces')
                    setLoading(true)

                    try {
                              const { imageUrls, videoUrl } = await uploadFiles(user.uid)

                              if (editing) {
                                        await updateDoc(doc(db, 'products', editing.id), {
                                                  title, description, price: Number(price), category, whatsapp,
                                                  images: imageUrls.length > 0 ? imageUrls : editing.images,
                                                  videoUrl: videoUrl || editing.videoUrl,
                                        })
                              } else {
                                        if (imageUrls.length === 0) throw new Error('Upload at least 1 photo')
                                        await addDoc(collection(db, 'products'), {
                                                  title, description, price: Number(price), category, whatsapp,
                                                  images: imageUrls, videoUrl, sellerId: user.uid,
                                                  sellerEmail: user.email, createdAt: serverTimestamp()
                                        })
                              }
                              resetForm()
                    } catch (err: any) {
                              console.error(err)
                              alert('Error: ' + err.message)
                    }
                    setLoading(false)
          }

          const handleEdit = (p: Product) => {
                    setEditing(p)
                    setTitle(p.title)
                    setDescription(p.description)
                    setPrice(String(p.price))
                    setCategory(p.category)
                    setWhatsapp(p.whatsapp)
                    setImageFiles([])
                    setVideoFile(null)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
          }

          const handleDelete = async (p: Product) => {
                    if (!confirm(`Delete "${p.title}"?`)) return
                    try {
                              await deleteDoc(doc(db, 'products', p.id))
                    } catch (err) {
                              console.error(err)
                              alert('Failed to delete')
                    }
          }

          if (!user) {
                    return (
                              <div className="p-8 text-center min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
                                        <h1 className="text-2xl font-bold mb-4" style={{ color: COFFEE_BROWN }}>Seller Login Required</h1>
                                        <Link
                                                  href="/admin"
                                                  className="text-white px-6 py-2 rounded font-medium inline-block"
                                                  style={{ backgroundColor: COFFEE_BROWN }}
                                        >
                                                  Go to Login
                                        </Link>
                              </div>
                    )
          }

          return (
                    <div className="p-6 max-w-5xl mx-auto min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
                              <h1 className="text-3xl font-bold mb-6" style={{ color: COFFEE_BROWN }}>
                                        {editing ? 'Edit Product' : 'Post New Product'}
                              </h1>

                              {/* Form */}
                              <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-lg mb-10 border-t-4" style={{ borderColor: COFFEE_BROWN }}>
                                        <input
                                                  className="w-full p-3 border rounded focus:ring-2"
                                                  style={{ borderColor: COFFEE_LIGHT }}
                                                  placeholder="Product Title"
                                                  value={title}
                                                  onChange={e => setTitle(e.target.value)}
                                                  required
                                        />
                                        <textarea
                                                  className="w-full p-3 border rounded focus:ring-2"
                                                  style={{ borderColor: COFFEE_LIGHT }}
                                                  placeholder="Description"
                                                  value={description}
                                                  onChange={e => setDescription(e.target.value)}
                                                  rows={3}
                                                  required
                                        />

                                        <div className="grid md:grid-cols-3 gap-4">
                                                  <input
                                                            className="w-full p-3 border rounded focus:ring-2"
                                                            style={{ borderColor: COFFEE_LIGHT }}
                                                            type="number"
                                                            placeholder="Price UGX"
                                                            value={price}
                                                            onChange={e => setPrice(e.target.value)}
                                                            required
                                                            min="0"
                                                  />
                                                  <select
                                                            className="w-full p-3 border rounded focus:ring-2 bg-white"
                                                            style={{ borderColor: COFFEE_LIGHT, color: COFFEE_BROWN }}
                                                            value={category}
                                                            onChange={e => setCategory(e.target.value)}
                                                            required
                                                  >
                                                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                  </select>
                                                  <input
                                                            className="w-full p-3 border rounded focus:ring-2"
                                                            style={{ borderColor: COFFEE_LIGHT }}
                                                            placeholder="WhatsApp: 2567xxxxxxx"
                                                            value={whatsapp}
                                                            onChange={e => setWhatsapp(e.target.value)}
                                                            required
                                                  />
                                        </div>

                                        <div>
                                                  <label className="block mb-1 font-medium" style={{ color: COFFEE_BROWN }}>
                                                            Photos: {editing && '(Leave empty to keep current)'}
                                                  </label>
                                                  <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setImageFiles(Array.from(e.target.files || []))}
                                                            required={!editing}
                                                            className="w-full"
                                                  />
                                        </div>
                                        <div>
                                                  <label className="block mb-1 font-medium" style={{ color: COFFEE_BROWN }}>
                                                            Video: {editing && '(Leave empty to keep current)'}
                                                  </label>
                                                  <input
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setVideoFile(e.target.files?.[0] || null)}
                                                            className="w-full"
                                                  />
                                        </div>

                                        <div className="flex gap-2">
                                                  <button
                                                            disabled={loading}
                                                            className="text-white px-6 py-2 rounded font-medium disabled:opacity-50"
                                                            style={{ backgroundColor: COFFEE_BROWN }}
                                                  >
                                                            {loading ? 'Saving...' : editing ? 'Update Product' : 'Post Product'}
                                                  </button>
                                                  {editing && (
                                                            <button
                                                                      type="button"
                                                                      onClick={resetForm}
                                                                      className="px-6 py-2 border rounded font-medium"
                                                                      style={{ borderColor: COFFEE_BROWN, color: COFFEE_BROWN }}
                                                            >
                                                                      Cancel
                                                            </button>
                                                  )}
                                        </div>
                              </form>

                              {/* My Products List */}
                              <h2 className="text-2xl font-bold mb-4" style={{ color: COFFEE_BROWN }}>
                                        My Products ({products.length})
                              </h2>

                              {products.length === 0 ? (
                                        <p className="text-gray-500">You haven't posted any products yet.</p>
                              ) : (
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                  {products.map(p => (
                                                            <div key={p.id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
                                                                      {p.images[0] && (
                                                                                <img src={p.images[0]} className="w-full h-48 object-cover" alt={p.title} />
                                                                      )}
                                                                      {p.videoUrl && (
                                                                                <video src={p.videoUrl} controls className="w-full h-48 bg-black" />
                                                                      )}

                                                                      <div className="p-4">
                                                                                <span
                                                                                          className="text-xs px-2 py-1 rounded-full text-white mb-2 inline-block"
                                                                                          style={{ backgroundColor: COFFEE_LIGHT }}
                                                                                >
                                                                                          {p.category}
                                                                                </span>
                                                                                <h3 className="font-bold text-lg mb-1" style={{ color: COFFEE_BROWN }}>{p.title}</h3>
                                                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{p.description}</p>
                                                                                <p className="font-bold text-xl mb-3" style={{ color: COFFEE_BROWN }}>
                                                                                          {p.price.toLocaleString()} UGX
                                                                                </p>

                                                                                <a
                                                                                          href={`https://wa.me/${p.whatsapp}?text=Hi, I'm interested in your product: ${encodeURIComponent(p.title)}`}
                                                                                          target="_blank"
                                                                                          rel="noopener noreferrer"
                                                                                          className="block w-full text-white text-center py-2 rounded font-medium mb-2"
                                                                                          style={{ backgroundColor: '#25D366' }}
                                                                                >
                                                                                          Contact on WhatsApp
                                                                                </a>

                                                                                <div className="flex gap-2">
                                                                                          <button
                                                                                                    onClick={() => handleEdit(p)}
                                                                                                    className="flex-1 text-white py-2 rounded font-medium"
                                                                                                    style={{ backgroundColor: COFFEE_LIGHT }}
                                                                                          >
                                                                                                    Edit
                                                                                          </button>
                                                                                          <button
                                                                                                    onClick={() => handleDelete(p)}
                                                                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded font-medium"
                                                                                          >
                                                                                                    Delete
                                                                                          </button>
                                                                                </div>
                                                                      </div>
                                                            </div>
                                                  ))}
                                        </div>
                              )}
                    </div>
          )
}