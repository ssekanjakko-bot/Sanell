"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject
} from "firebase/storage";
import {
  addDoc, collection, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where, getDoc
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

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

type BoostRequest = {
  id: string
  productId: string
  productTitle: string
  productImage: string
  sellerId: string
  sellerEmail: string
  sellerPhone: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  packageId?: string
  packageName?: string
  durationDays?: number
  createdAt: Timestamp
}

type MovieSubRequest = {
  id: string
  userId: string
  email: string
  packageId: string
  packageName: string
  amount: number
  days: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Timestamp
}

const BOOST_LABELS: any = {
  quick: { label: '24H', color: 'bg-gray-200 text-black' },
  standard: { label: '3D POPULAR', color: 'bg-yellow-300 text-black' },
  seller: { label: '7D SELLER', color: 'bg-orange-400 text-white' },
  king: { label: '14D KING 👑', color: 'bg-black text-yellow-400' },
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'dashboard'|'boosts'|'flixsubs'|'movies'|'chats'|'banners'|'blackmarket'>('dashboard')
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
  const [boostRequests, setBoostRequests] = useState<BoostRequest[]>([])
  const [boostFilter, setBoostFilter] = useState<'pending'|'approved'|'rejected'>('pending')
  const [flixRequests, setFlixRequests] = useState<MovieSubRequest[]>([])
  const [flixFilter, setFlixFilter] = useState<'pending'|'approved'|'rejected'>('pending')
  const [blackMarketSettings, setBlackMarketSettings] = useState<any>({ showBlackMarket: true, blackMarketTitle: "BLACK MARKET - Everything ≤ 45K", blackMarketMaxPrice: 45000, blackMarketLimit: 10 })
  const [blackMarketSaving, setBlackMarketSaving] = useState(false)

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

  useEffect(() => {
    const q = query(collection(db, "boost_requests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id,...d.data() } as BoostRequest))
      setBoostRequests(data)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const q = query(collection(db, "movie_boost_requests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id,...d.data() } as MovieSubRequest))
      setFlixRequests(data)
    })
    return () => unsub()
  }, [])

  useEffect(()=>{
    const unsub = onSnapshot(doc(db, "admin_settings", "homepage"), (snap)=>{
      if(snap.exists()){
        setBlackMarketSettings((prev:any)=>({...prev,...snap.data()}))
      }
    })
    return ()=>unsub()
  }, [])

  const saveBlackMarket = async () => {
    setBlackMarketSaving(true)
    try{
      await setDoc(doc(db, "admin_settings", "homepage"), {
        showBlackMarket: blackMarketSettings.showBlackMarket,
        blackMarketTitle: blackMarketSettings.blackMarketTitle,
        blackMarketMaxPrice: Number(blackMarketSettings.blackMarketMaxPrice),
        blackMarketLimit: Number(blackMarketSettings.blackMarketLimit),
        updatedAt: serverTimestamp()
      }, { merge: true })
      alert("Black Market settings saved ✅ - homepage will update live")
    }catch(e:any){ alert(e.message)} finally{ setBlackMarketSaving(false)}
  }

  const approveBoost = async (req: BoostRequest) => {
    const days = req.durationDays || 1
    if (!confirm(`Approve ${req.packageName || ''} - ${days} days for "${req.productTitle}"?`)) return
    try {
      const now = new Date()
      const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      await updateDoc(doc(db, "products", req.productId), {
        is_boosted: true,
        boosted_at: Timestamp.fromDate(now),
        boosted_until: Timestamp.fromDate(until),
        boostDurationDays: days,
        boostPackageId: req.packageId || 'standard',
        boostPackageName: req.packageName || '',
        boost_pending: false,
        boost_pending_packageId: null,
        boost_pending_packageName: null,
      })
      await updateDoc(doc(db, "boost_requests", req.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedDurationDays: days
      })
      alert(`Approved ${days} days!`)
    } catch (e:any) { alert("Failed: " + e.message) }
  }

  const rejectBoost = async (req: BoostRequest) => {
    if (!confirm(`Reject boost for "${req.productTitle}"?`)) return
    try {
      await updateDoc(doc(db, "products", req.productId), { boost_pending: false, is_boosted: false })
      await updateDoc(doc(db, "boost_requests", req.id), { status: 'rejected', rejectedAt: serverTimestamp() })
    } catch (e:any) { alert("Failed: " + e.message) }
  }

  const approveFlix = async (req: MovieSubRequest) => {
    if (!confirm(`Approve ${req.packageName} (${req.days} days) for ${req.email}? Amount ${req.amount} UGX to 0767483636 verified?`)) return
    try {
      const until = new Date(Date.now() + req.days * 24 * 60 * 60 * 1000)
      await setDoc(doc(db, 'movie_subscriptions', req.userId), {
        userId: req.userId,
        email: req.email,
        packageId: req.packageId,
        packageName: req.packageName,
        amount: req.amount,
        days: req.days,
        validUntil: Timestamp.fromDate(until),
        startedAt: serverTimestamp(),
        lastApprovedAt: serverTimestamp(),
      }, { merge: true })
      await updateDoc(doc(db, 'movie_boost_requests', req.id), { status: 'approved', approvedAt: serverTimestamp(), validUntil: Timestamp.fromDate(until) })
      alert(`Approved ${req.days} days until ${until.toLocaleDateString()}`)
    } catch(e:any){ alert("Failed: "+e.message) }
  }

  const rejectFlix = async (req: MovieSubRequest) => {
    if(!confirm(`Reject ${req.packageName} for ${req.email}?`)) return
    await updateDoc(doc(db, 'movie_boost_requests', req.id), { status:'rejected', rejectedAt: serverTimestamp() })
  }

  useEffect(() => {
    const q = query(collection(db, "seller_admin_chats"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id,...d.data() } as ChatMsg))
      msgs.sort((a:any,b:any)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))
      setAllChats(msgs)
      const map = new Map<string, SellerThread>()
      msgs.forEach(m => {
        if (!map.has(m.sellerId)) {
          map.set(m.sellerId, { sellerId: m.sellerId, sellerEmail: m.sellerEmail || 'No email', lastMessage: m.message, lastTime: m.createdAt })
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
    } catch(e:any){ alert("Failed: "+e.message) }
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
    } catch (e: any) { alert("Upload failed: " + e.code) } finally { setBannerLoading(false) }
  }
  useEffect(() => {
    getDoc(doc(db, 'banners', 'activeBanner')).then(snap => { if (snap.exists()) setCurrentBanner(snap.data()) })
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
    } catch (error: any) { alert(`Failed: ${error.message}`); } finally { setIsUploading(false); }
  };
  const handleEdit = (movie: Movie) => {
    setEditingId(movie.id); setTitle(movie.title); setDescription(movie.description); setReleaseDate(movie.releaseDate); setDuration(movie.duration); setGenre(movie.genre || []); setDirector(movie.director); setCast(movie.cast); setYoutubeUrl(movie.youtubeUrl || ""); setVideoFile(null); setPosterFile(null); window.scrollTo({ top: 0, behavior: "smooth" }); setTab('movies')
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

  const filteredBoosts = boostRequests.filter(b => b.status === boostFilter)
  const pendingCount = boostRequests.filter(b => b.status === 'pending').length
  const filteredFlix = flixRequests.filter(b => b.status === flixFilter)
  const flixPendingCount = flixRequests.filter(b => b.status === 'pending').length

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <div className="bg-black text-white p-4 sticky top-0 z-20">
        <h1 className="font-black text-lg">SANEL ADMIN</h1>
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {[
            {id:'dashboard', label:'Dashboard'},
            {id:'blackmarket', label:'Black Market 45K'},
            {id:'boosts', label:`Boosts ${pendingCount>0?`(${pendingCount})`:''}`},
            {id:'flixsubs', label:`SanelFlix ${flixPendingCount>0?`(${flixPendingCount})`:''}`},
            {id:'chats', label:`Chats (${sellerThreads.length})`},
            {id:'movies', label:'Movies'},
            {id:'banners', label:'Banners'},
          ].map((t:any)=>(
            <button key={t.id} onClick={()=>setTab(t.id as any)} className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap ${tab===t.id?'bg-white text-black':'bg-[#333] text-white border border-[#555]'}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-5xl">

      {tab==='dashboard' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border rounded-xl p-4 shadow"><p className="text-xs text-gray-500 font-bold">PENDING BOOSTS</p><p className="text-2xl font-black text-black">{pendingCount}</p><p className="text-xs text-black font-bold">0767483636</p></div>
          <div className="bg-white border rounded-xl p-4 shadow"><p className="text-xs text-gray-500 font-bold">FLIX SUBS PENDING</p><p className="text-2xl font-black text-black">{flixPendingCount}</p><p className="text-xs text-black">1 Min Free Mode</p></div>
          <div className="bg-white border rounded-xl p-4 shadow"><p className="text-xs text-gray-500 font-bold">SELLERS CHATTING</p><p className="text-2xl font-black text-black">{sellerThreads.length}</p></div>
          <div className="bg-white border rounded-xl p-4 shadow"><p className="text-xs text-gray-500 font-bold">TOTAL MOVIES</p><p className="text-2xl font-black text-black">{movies.length}</p></div>
          <div className="bg-black border rounded-xl p-4 shadow col-span-2">
            <p className="text-xs text-yellow-400 font-bold">BLACK MARKET 45K</p>
            <p className="text-sm font-black text-white mt-1">{blackMarketSettings.showBlackMarket? 'ON ✅ - showing after 2 categories' : 'OFF ❌ - hidden'}</p>
            <button onClick={()=>{setBlackMarketSettings({...blackMarketSettings, showBlackMarket:!blackMarketSettings.showBlackMarket}); setTimeout(saveBlackMarket,100)}} className={`mt-2 px-4 py-1.5 rounded-full text-xs font-black ${blackMarketSettings.showBlackMarket? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}>
              Turn {blackMarketSettings.showBlackMarket? 'OFF' : 'ON'}
            </button>
          </div>
        </div>
      )}

      {tab==='blackmarket' && (
        <div className="bg-white border rounded-xl p-5 shadow max-w-[600px]">
          <h2 className="font-black text-lg text-black">🔥 Black Market - Under 45K Control</h2>
          <p className="text-xs text-gray-500 mt-1">This banner appears AFTER 2 categories on homepage. Jumia-style cards.</p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between bg-black text-white p-4 rounded-xl">
              <div><p className="font-bold text-sm">Show Banner on Homepage</p><p className="text-[10px] text-gray-400">Turn ON/OFF without deploy</p></div>
              <button onClick={()=>setBlackMarketSettings({...blackMarketSettings, showBlackMarket:!blackMarketSettings.showBlackMarket})} className={`w-14 h-7 rounded-full p-1 transition flex ${blackMarketSettings.showBlackMarket? 'bg-green-500 justify-end' : 'bg-gray-600 justify-start'}`}><div className="w-5 h-5 bg-white rounded-full"></div></button>
            </div>
            <div><label className="font-bold text-xs text-black">Banner Title</label><input value={blackMarketSettings.blackMarketTitle} onChange={e=>setBlackMarketSettings({...blackMarketSettings, blackMarketTitle: e.target.value})} className="w-full border p-3 rounded-xl text-black mt-1" placeholder="BLACK MARKET - Everything ≤ 45K" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="font-bold text-xs text-black">Max Price (UGX)</label><input type="number" value={blackMarketSettings.blackMarketMaxPrice} onChange={e=>setBlackMarketSettings({...blackMarketSettings, blackMarketMaxPrice: e.target.value})} className="w-full border p-3 rounded-xl text-black mt-1" /><p className="text-[10px] text-gray-500 mt-1">All products ≤ this price will show. Use 45000</p></div>
              <div><label className="font-bold text-xs text-black">Cards to Show</label><input type="number" value={blackMarketSettings.blackMarketLimit} onChange={e=>setBlackMarketSettings({...blackMarketSettings, blackMarketLimit: e.target.value})} className="w-full border p-3 rounded-xl text-black mt-1" /></div>
            </div>
            <button onClick={saveBlackMarket} disabled={blackMarketSaving} className="w-full bg-black text-white py-3.5 rounded-full font-black text-sm mt-2">{blackMarketSaving? 'Saving...' : 'Save Changes - Updates Live ✅'}</button>
          </div>
        </div>
      )}

      {tab==='boosts' && (
        <div className="bg-white border rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center"><h2 className="font-black text-black">🚀 Boost Requests</h2><div className="flex gap-1">{['pending','approved','rejected'].map((f:any)=>(<button key={f} onClick={()=>setBoostFilter(f)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${boostFilter===f?'bg-black text-white':'bg-gray-100 text-black border'}`}>{f}</button>))}</div></div>
          <div className="p-3">{filteredBoosts.length===0? <p className="text-center text-gray-400 py-10 text-sm">No {boostFilter} boosts</p> : <div className="grid gap-3">{filteredBoosts.map(req=>{const meta = BOOST_LABELS[req.packageId || ''] || {label: `${req.durationDays||1}D`, color: 'bg-gray-100 text-black'}; return (<div key={req.id} className="border rounded-xl p-3 flex gap-3 bg-[#FFFEFB]"><img src={req.productImage} className="w-16 h-16 rounded-lg object-cover border" /><div className="flex-1 min-w-0"><div className="flex gap-2 items-center flex-wrap"><p className="font-bold text-sm truncate text-black">{req.productTitle}</p><span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${meta.color}`}>{req.packageName || meta.label} • {req.durationDays||1}D • {req.amount} UGX</span></div><p className="text-[11px] text-black font-medium mt-1">Seller: {req.sellerEmail} • {req.sellerPhone}</p><p className="text-[10px] text-gray-500">ID: {req.productId.slice(0,8)} • {req.createdAt?.toDate? req.createdAt.toDate().toLocaleString():''} • Pay to 0767483636 checked?</p></div><div className="flex flex-col gap-1 shrink-0">{req.status==='pending'? <><button onClick={()=>approveBoost(req)} className="bg-black text-white px-4 py-2 rounded-full text-xs font-black">Approve {req.durationDays}d</button><button onClick={()=>rejectBoost(req)} className="bg-white border border-black text-black px-4 py-1.5 rounded-full text-xs font-black">Reject</button></> : <span className={`px-3 py-1 rounded-full text-[10px] font-black text-center ${req.status==='approved'?'bg-green-600 text-white':'bg-red-600 text-white'}`}>{req.status.toUpperCase()}</span>}</div></div>)})}</div>}</div>
        </div>
      )}

      {tab==='flixsubs' && (
        <div className="bg-white border rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-black text-white"><h2 className="font-black">🎬 SanelFlix - 1 Min Free Preview Mode</h2><div className="flex gap-1">{['pending','approved','rejected'].map((f:any)=>(<button key={f} onClick={()=>setFlixFilter(f)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${flixFilter===f?'bg-white text-black':'bg-[#333] text-white border border-[#555]'}`}>{f}</button>))}</div></div>
          <div className="p-3"><p className="text-xs text-black font-bold mb-3 bg-yellow-100 border border-yellow-300 p-2 rounded">Packages: Daily 1k, 3days 2.5k, 7days 5k, 15days 8k, 30days 12k, 60days 20k, 180days 50k, 365days 90k • All pay to <b>0767483636</b> Reason: MOVIE + ID - 1 MIN FREE then paywall</p>{filteredFlix.length===0? <p className="text-center text-gray-400 py-10 text-sm">No {flixFilter} flix requests - Requests from 1 min paywall will appear here</p> : <div className="grid gap-3">{filteredFlix.map(req=>(<div key={req.id} className="border-2 rounded-xl p-3 flex gap-3 bg-white"><div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black text-xs">{req.days}D</div><div className="flex-1 min-w-0"><p className="font-black text-sm text-black">{req.packageName} • {req.amount.toLocaleString()} UGX • {req.days} Days</p><p className="text-[11px] text-black font-medium mt-1">User: {req.email}</p><p className="text-[10px] text-gray-500">UID: {req.userId.slice(0,8)} • {req.createdAt?.toDate? req.createdAt.toDate().toLocaleString():''}</p></div><div className="flex flex-col gap-1 shrink-0">{req.status==='pending'? <><button onClick={()=>approveFlix(req)} className="bg-black text-white px-4 py-2 rounded-full text-xs font-black">Approve {req.days}D</button><button onClick={()=>rejectFlix(req)} className="bg-white border border-black text-black px-4 py-1.5 rounded-full text-xs font-black">Reject</button></> : <span className={`px-3 py-1 rounded-full text-[10px] font-black text-center ${req.status==='approved'?'bg-green-600 text-white':'bg-red-600 text-white'}`}>{req.status.toUpperCase()}</span>}</div></div>))}</div>}</div>
        </div>
      )}

      {tab==='movies' && (
        <>
          <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 shadow mb-6">
            <h2 className="font-black mb-3 text-black">{editingId? "Edit Movie" : "Add Movie"}</h2>
            <div className="grid md:grid-cols-2 gap-2">
              <input className="border p-2 w-full rounded text-black" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
              <input type="date" className="border p-2 w-full rounded text-black" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
              <input className="border p-2 w-full rounded text-black" placeholder="Duration e.g. 2h 10m" value={duration} onChange={e => setDuration(e.target.value)} />
              <input className="border p-2 w-full rounded text-black" placeholder="Director" value={director} onChange={e => setDirector(e.target.value)} />
              <input className="border p-2 w-full rounded text-black col-span-2" placeholder="Cast, comma separated" value={cast} onChange={e => setCast(e.target.value)} />
              <input className="border p-2 w-full rounded text-black col-span-2" placeholder="YouTube URL (optional)" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
            </div>
            <textarea className="border p-2 w-full rounded text-black mt-2" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
            <div className="mt-3"><label className="font-bold text-xs text-black">Genre:</label><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">{["Action", "Comedy", "Popular Movie", "C-Drama", "Sci-Fi", "Most Popular", "Anime", "DC Movies", "Marvel Movies", "Trending Now", "💖Romance", " Thriller", "Documentary", "Family", "Fantasy", " adventure", "Horror"].map(g => (<label key={g} className="flex items-center text-xs text-black"><input type="checkbox" value={g} checked={genre.includes(g)} onChange={handleGenreChange} className="mr-2" />{g}</label>))}</div></div>
            <div className="grid md:grid-cols-2 gap-3 mt-3"><div><label className="font-bold text-xs text-black">Video File {editingId && "(leave empty to keep current)"}</label><input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="border p-2 w-full rounded text-sm" /></div><div><label className="font-bold text-xs text-black">Poster Image {editingId && "(leave empty to keep current)"}</label><input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] || null)} className="border p-2 w-full rounded text-sm" /></div></div>
            {isUploading && (<div className="mt-4 w-full"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-black h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div><p className="text-xs text-center mt-1 text-black">{uploadStatus}</p></div>)}
            <div className="flex gap-2 mt-4"><button type="submit" disabled={isUploading} className="bg-black text-white px-6 py-2 rounded-full text-sm font-black disabled:opacity-50">{isUploading? "Uploading..." : editingId? "Update Movie" : "Add Movie"}</button>{editingId && <button type="button" onClick={resetForm} className="bg-white border border-black text-black px-6 py-2 rounded-full text-sm font-black">Cancel</button>}</div>
          </form>
          <div className="bg-white border rounded-xl p-3"><h2 className="font-black mb-2 text-black">Posted Movies ({movies.length})</h2><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs"><th className="border px-3 py-2">Poster</th><th className="border px-3 py-2">Title</th><th className="border px-3 py-2">Date</th><th className="border px-3 py-2">Actions</th></tr></thead><tbody>{movies.map(movie => (<tr key={movie.id} className="text-black"><td className="border px-3 py-2"><img src={movie.posterUrl} alt={movie.title} className="w-12 h-16 object-cover rounded" /></td><td className="border px-3 py-2 font-bold">{movie.title}</td><td className="border px-3 py-2 text-xs">{movie.releaseDate}</td><td className="border px-3 py-2"><button onClick={() => handleEdit(movie)} className="bg-black text-white px-3 py-1 rounded-full text-xs mr-1">Edit</button><button onClick={() => handleDelete(movie)} className="bg-red-600 text-white px-3 py-1 rounded-full text-xs">Del</button></td></tr>))}</tbody></table></div></div>
        </>
      )}

      {tab==='banners' && (
        <div className="bg-white border rounded-xl p-5"><h2 className="font-black mb-4 text-black">Homepage Banner</h2>{currentBanner && <img src={currentBanner.imageUrl} className="w-full h-40 object-cover rounded-xl mb-3 border" />}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setBannerFile(e.target.files?.[0] || null)} className="mb-3 text-sm text-black" /><input type="text" placeholder="Banner link URL e.g. https://sanel-ug.online/promo" value={bannerLink} onChange={e => setBannerLink(e.target.value)} className="w-full border rounded-lg p-2.5 mb-3 text-black" /><button onClick={handleBannerUpload} disabled={bannerLoading} className="px-6 py-2.5 bg-black text-white rounded-full font-black text-sm">{bannerLoading? 'Uploading....': 'Save Banner'}</button></div>
      )}

      {tab==='chats' && (
        <div className="bg-white border rounded-xl shadow overflow-hidden"><div className="p-4 border-b font-black text-black">💬 Seller Chats ({sellerThreads.length})</div><div className="flex flex-col md:flex-row h-[550px]"><div className="w-full md:w-1/3 border-r overflow-y-auto bg-gray-50">{sellerThreads.length===0 && <p className="p-6 text-gray-400 text-sm text-center">No messages yet</p>}{sellerThreads.map(s => (<div key={s.sellerId} onClick={()=>setActiveSellerId(s.sellerId)} className={`p-3 border-b cursor-pointer ${activeSellerId===s.sellerId? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}><p className="font-bold text-xs truncate">{s.sellerEmail}</p><p className="text-xs truncate opacity-80">{s.lastMessage}</p><p className="text-[9px] opacity-60">ID: {s.sellerId.slice(0,8)}</p></div>))}</div><div className="flex-1 flex flex-col">{!activeSellerId? <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a seller</div> : (<><div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#FDF8F3]">{activeMessages.map(m=>(<div key={m.id} className={`flex ${m.sender==='admin'? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm font-medium ${m.sender==='admin'? 'bg-black text-white' : 'bg-white border text-black'}`}>{m.message}<div className="text-[9px] mt-1 opacity-60">{m.createdAt?.toDate? m.createdAt.toDate().toLocaleString() : 'just now'}</div></div></div>))}</div><div className="p-3 border-t flex gap-2 bg-white"><input value={adminReply} onChange={e=>setAdminReply(e.target.value)} onKeyDown={e=> e.key==='Enter' && sendAdminReply()} placeholder={`Reply to ${sellerThreads.find(s=>s.sellerId===activeSellerId)?.sellerEmail}...`} className="flex-1 border-2 border-black p-2.5 rounded-full text-black text-sm focus:outline-none" /><button onClick={sendAdminReply} className="bg-black text-white px-6 py-2 rounded-full font-black text-sm">Send</button></div></>)}</div></div></div>
      )}

      </div>
    </div>
  );
}