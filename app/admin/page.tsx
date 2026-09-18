"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject
} from "firebase/storage";
import {
  addDoc, collection, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  duration: string;
  genre: string[];
  director: string;
  cast: string;
  videoUrl: string;
  posterUrl: string;
  youtubeUrl: string;
  videoPath?: string;
  posterPath?: string;
  createdAt?: any;
}

type ChatMsg = {
  id: string
  sellerId: string
  sellerEmail: string
  sender: 'seller' | 'admin'
  message: string
  createdAt: Timestamp
}

type SellerThread = {
  sellerId: string
  sellerEmail: string
  lastMessage: string
  lastTime: Timestamp
}

export default function AdminPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bannerFile,setBannerFile]=useState<File | null>(null)
  const [bannerLink, setBannerLink] = useState<string>('')
  const [currentBanner, setCurrentBanner] = useState<any>(null)
  const [bannerLoading, setBannerLoading] = useState(false)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [duration, setDuration] = useState("");
  const [genre, setGenre] = useState<string[]>([]);
  const [director, setDirector] = useState("");
  const [cast, setCast] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [allChats, setAllChats] = useState<ChatMsg[]>([])
  const [sellerThreads, setSellerThreads] = useState<SellerThread[]>([])
  const [activeSellerId, setActiveSellerId] = useState<string>('')
  const [adminReply, setAdminReply] = useState('')

  useEffect(() => {
    const q = query(collection(db, "movies"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const moviesData: Movie[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
      ...docSnap.data()
      } as Movie));
      setMovies(moviesData);
    });
    return () => unsubscribe();
  }, []);

  // === FIXED CHAT LISTENER - NO orderBy TO AVOID INDEX ERROR ===
  useEffect(() => {
    const q = query(collection(db, "seller_admin_chats"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id,...d.data() } as ChatMsg))
      msgs.sort((a:any,b:any)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))
      setAllChats(msgs)
      const map = new Map<string, SellerThread>()
      msgs.forEach(m => {
        if (!map.has(m.sellerId)) {
          map.set(m.sellerId, {
            sellerId: m.sellerId,
            sellerEmail: m.sellerEmail || 'No email',
            lastMessage: m.message,
            lastTime: m.createdAt
          })
        }
      })
      setSellerThreads(Array.from(map.values()))
    }, (err)=> console.error("Admin chat listen error", err))
    return () => unsub()
  }, [])

  const activeMessages = allChats.filter(c => c.sellerId === activeSellerId).sort((a,b)=> (a.createdAt?.seconds||0)-(b.createdAt?.seconds||0))

  const sendAdminReply = async () => {
    if(!adminReply.trim() ||!activeSellerId) return
    try {
      const activeSeller = sellerThreads.find(s=> s.sellerId===activeSellerId)
      await addDoc(collection(db, "seller_admin_chats"), {
        sellerId: activeSellerId,
        sellerEmail: activeSeller?.sellerEmail || '',
        sender: 'admin',
        message: adminReply.trim(),
        createdAt: serverTimestamp()
      })
      setAdminReply('')
    } catch(e:any){
      console.error(e)
      alert("Failed: "+e.message)
    }
  }

  const resetForm = () => {
    setTitle(""); setDescription(""); setReleaseDate(""); setDuration(""); setGenre([]); setDirector(""); setCast(""); setYoutubeUrl(""); setVideoFile(null); setPosterFile(null); setEditingId(null); setUploadProgress(0); setUploadStatus("");
  };
  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) { setGenre([...genre, value]); } else { setGenre(genre.filter(g => g!== value)); }
  };
  const handleBannerUpload = async () => {
    if (!bannerFile) return alert('Pick an image first')
    try {
      setBannerLoading(true)
      const storageRef = ref(storage, `banners/banner_${Date.now()}.jpg`)
      const snap = await uploadBytes(storageRef, bannerFile)
      const url = await getDownloadURL(snap.ref)
      await setDoc(doc(db, 'banners', 'activeBanner'), {
        imageUrl: url, linkUrl: bannerLink || '#', active: true, updatedAt: serverTimestamp()
      })
      alert('Banner saved ✅')
    } catch (e: any) {
      alert("Upload failed: " + e.code)
    } finally { setBannerLoading(false) }
  }
  useEffect(() => {
    getDoc(doc(db, 'banners', 'activeBanner')).then(snap => {
      if (snap.exists()) setCurrentBanner(snap.data())
    })
  }, [])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId &&!posterFile) { alert("Please select a poster image."); return; }
    if (!editingId &&!videoFile &&!youtubeUrl) { alert("please select a video file or provide a YouTube URL."); return; }
    setIsUploading(true); setUploadProgress(0); setUploadStatus("Starting...");
    try {
      let videoUrl = ""; let posterUrl = ""; let videoPath = ""; let posterPath = "";
      if (posterFile) {
        posterPath = `posters/${Date.now()}_${posterFile.name}`;
        const posterRef = ref(storage, posterPath);
        const posterSnap = await uploadBytes(posterRef, posterFile);
        posterUrl = await getDownloadURL(posterSnap.ref);
      } else if (editingId) {
        const oldMovie = movies.find(m => m.id === editingId);
        posterUrl = oldMovie?.posterUrl || ""; posterPath = oldMovie?.posterPath || "";
      }
      if (videoFile) {
        videoPath = `videos/${Date.now()}_${videoFile.name}`;
        const videoRef = ref(storage, videoPath);
        const uploadTask = uploadBytesResumable(videoRef, videoFile);
        videoUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on("state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
              setUploadStatus(`Uploading video: ${Math.round(progress)}%`);
            },
            (error) => reject(error),
            async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); resolve(url); }
          );
        });
      } else if (editingId) {
        const oldMovie = movies.find(m => m.id === editingId);
        videoUrl = oldMovie?.videoUrl || ""; videoPath = oldMovie?.videoPath || "";
      }
      const movieData = { title, description, releaseDate, duration, genre, director, cast, videoUrl, posterUrl, youtubeUrl, videoPath, posterPath, updatedAt: new Date() };
      if (editingId) { await updateDoc(doc(db, "movies", editingId), movieData); alert("Movie updated!"); }
      else { await addDoc(collection(db, "movies"), {...movieData, createdAt: new Date() }); alert("Movie added!"); }
      resetForm();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally { setIsUploading(false); }
  };
  const handleEdit = (movie: Movie) => {
    setEditingId(movie.id); setTitle(movie.title); setDescription(movie.description); setReleaseDate(movie.releaseDate); setDuration(movie.duration); setGenre(movie.genre || []); setDirector(movie.director); setCast(movie.cast); setYoutubeUrl(movie.youtubeUrl || ""); setVideoFile(null); setPosterFile(null); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDelete = async (movie: Movie) => {
    if (!confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "movies", movie.id));
      if (movie.videoPath) await deleteObject(ref(storage, movie.videoPath)).catch(() => { });
      if (movie.posterPath) await deleteObject(ref(storage, movie.posterPath)).catch(() => { });
      alert("Movie deleted");
    } catch (error: any) { alert("Failed to delete: " + error.message); }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">{editingId? "Edit Movie" : "Add Movie"}</h1>
      <form onSubmit={handleSubmit} className="bg-white text-black border-gray-200 rounded-xl p-4 shadow">
        <input className="border p-2 w-full mb-2 rounded" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea className="border p-2 w-full mb-2 rounded" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <input type="date" className="border p-2 w-full mb-2 rounded" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
        <input className="border p-2 w-full mb-2 rounded" placeholder="Duration e.g. 2h 10m" value={duration} onChange={e => setDuration(e.target.value)} />
        <input className="border p-2 w-full mb-2 rounded" placeholder="Director" value={director} onChange={e => setDirector(e.target.value)} />
        <input className="border p-2 w-full mb-2 rounded" placeholder="Cast, comma separated" value={cast} onChange={e => setCast(e.target.value)} />
        <input className="border p-2 w-full mb-2 rounded" placeholder="YouTube URL (optional)" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
        <div className="mb-2">
          <label className="font-semibold">Genre:</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
            {["Action", "Comedy", "Popular Movie", "C-Drama", "Sci-Fi", "Most Popular", "Anime", "DC Movies", "Marvel Movies", "Trending Now", "💖Romance", " Thriller", "Documentary", "Family", "Fantasy", " adventure", "Horror"].map(g => (
              <label key={g} className="flex items-center"><input type="checkbox" value={g} checked={genre.includes(g)} onChange={handleGenreChange} className="mr-2" />{g}</label>
            ))}
          </div>
        </div>
        <div className="mb-2"><label className="font-semibold">Video File {editingId && "(leave empty to keep current)"}</label><input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="border p-2 w-full rounded" /></div>
        <div className="mb-4"><label className="font-semibold">Poster Image {editingId && "(leave empty to keep current)"}</label><input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] || null)} className="border p-2 w-full rounded" /></div>
        {isUploading && (
          <div className="mt-4 w-full mb-4"><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div><p className="text-sm text-center mt-2">{uploadStatus}</p></div>
        )}
        <div className="flex gap-2">
          <button type="submit" disabled={isUploading} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50">{isUploading? "Uploading..." : editingId? "Update Movie" : "Add Movie"}</button>
          {editingId && <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>}
        </div>
      </form>

      <h2 className="text-xl font-bold mb-2 mt-6">Posted Movies</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded">
          <thead><tr className="bg-gray-100"><th className="border px-4 py-2 text-left">Poster</th><th className="border px-4 py-2 text-left">Title</th><th className="border px-4 py-2 text-left">Date</th><th className="border px-4 py-2 text-left">Actions</th></tr></thead>
          <tbody>
            {movies.map(movie => (
              <tr key={movie.id}><td className="border px-4 py-2"><img src={movie.posterUrl} alt={movie.title} className="w-16 h-24 object-cover rounded" /></td><td className="border px-4 py-2">{movie.title}</td><td className="border px-4 py-2">{movie.releaseDate}</td><td className="border px-4 py-2"><button onClick={() => handleEdit(movie)} className="bg-blue-500 text-white px-3 py-1 rounded mr-2">Edit</button><button onClick={() => handleDelete(movie)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button></td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-10 p-6 bg-gray-50 rounded-2x1 border">
          <h2 className="text-x1 font-bold mb-4">Homepage Banner</h2>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setBannerFile(e.target.files?.[0] || null)} className="mb-3" />
          <input type="text" placeholder="Banner link URL e.g. https://sanel-ug.online/promo" value={bannerLink} onChange={e => setBannerLink(e.target.value)} className="w-full border rounded p-2 mb-3" />
          <button onClick={handleBannerUpload} disabled={bannerLoading} className="p-4 py-2 bg-black text-white rounded-lg">{bannerLoading? 'Uploading....': 'Save Banner'}</button>
        </div>
      </div>

      {/* === SELLER CHAT - RED CLEAR === */}
      <div className="mt-12 bg-white border-2 border-red-600 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-red-600 text-white p-4 font-bold text-lg flex justify-between">
          <span>💬 Seller Chats ({sellerThreads.length} sellers)</span>
        </div>
        <div className="flex flex-col md:flex-row h-[500px]">
          <div className="w-full md:w-1/3 border-r overflow-y-auto bg-gray-50">
            {sellerThreads.length===0 && <p className="p-4 text-red-600 font-bold text-sm">No messages yet from sellers</p>}
            {sellerThreads.map(s => (
              <div key={s.sellerId} onClick={()=>setActiveSellerId(s.sellerId)} className={`p-3 border-b cursor-pointer hover:bg-red-50 ${activeSellerId===s.sellerId? 'bg-red-50 border-l-4 border-l-red-600' : ''}`}>
                <p className="font-bold text-sm truncate text-red-700">{s.sellerEmail}</p>
                <p className="text-sm text-black font-medium truncate">{s.lastMessage}</p>
                <p className="text-[10px] text-gray-500">ID: {s.sellerId.slice(0,8)}...</p>
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col">
            {!activeSellerId? (
              <div className="flex-1 flex items-center justify-center text-red-600 font-bold">Select a seller to start chatting</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
                  {activeMessages.map(m=>(
                    <div key={m.id} className={`flex ${m.sender==='admin'? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-lg text-[15px] font-bold border-2 shadow-sm ${m.sender==='admin'? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-600'}`}>
                        {m.message}
                        <div className={`text-[10px] mt-1 ${m.sender==='admin'? 'text-white/80' : 'text-red-400'}`}>{m.createdAt?.toDate? m.createdAt.toDate().toLocaleString() : 'just now'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t-2 border-red-600 flex gap-2 bg-gray-50">
                  <input value={adminReply} onChange={e=>setAdminReply(e.target.value)} onKeyDown={e=> e.key==='Enter' && sendAdminReply()} placeholder={`Reply to ${sellerThreads.find(s=>s.sellerId===activeSellerId)?.sellerEmail}...`} className="flex-1 border-2 border-red-600 p-2 rounded text-red-600 font-bold placeholder:text-red-400 focus:outline-none" />
                  <button onClick={sendAdminReply} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold">Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}