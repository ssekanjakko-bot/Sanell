"use client";
import { useState, useEffect } from "react";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function NewsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("confession");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 1. CHECK LOGIN
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === "youradminemail@gmail.com") setIsAdmin(true);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. FETCH ALL POSTS FROM FIREBASE
  useEffect(() => {
    const now = Timestamp.now();
    const q = query(collection(db, "newsPosts"), where("expiresAt", ">", now), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      setPosts(data);
    });
    return () => unsub();
  }, []);

  // 3. FETCH AUTO DEALS FROM PRODUCTS
  useEffect(() => {
    const oneDayAgo = Timestamp.fromMillis(Timestamp.now().toMillis() - 24 * 60 * 60 * 1000);
    const q = query(collection(db, "products"), where("createdAt", ">", oneDayAgo), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDeals(snap.docs.map(d => ({
        id: d.id,...d.data(), type: "deal",
        postedBy: "Sanel Deals",
        userPhoto: "",
        createdAt: d.data().createdAt,
        expiresAt: Timestamp.fromMillis(d.data().createdAt.toMillis() + 24 * 60 * 60 * 1000)
      })));
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!user) return alert("You must be logged in to post");
    if (!title ||!content) return alert("Please fill Title and Details");

    setUploading(true);
    let imageUrl = "";

    if (imageFile) {
      const storageRef = ref(storage, `news/${Date.now()}_${imageFile.name}`);
      const snap = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snap.ref);
    }

    const createdAt = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(createdAt.toMillis() + 48 * 60 * 60 * 1000);

    await addDoc(collection(db, "newsPosts"), {
      title, content, type, image: imageUrl,
      createdAt, expiresAt,
      postedBy: user.displayName || user.email.split("@")[0],
      userId: user.uid,
      userPhoto: user.photoURL || "",
    });

    setTitle(""); setContent(""); setImageFile(null); setUploading(false);
  };

  // COMBINE POSTS + DEALS AND FILTER
  const allItems = [...posts,...deals].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  const filteredItems = activeTab === "all"? allItems : allItems.filter(p => p.type === activeTab);
  const getTimeLeft = (expiresAt: Timestamp) => {
    const hours = Math.floor((expiresAt.toMillis() - Date.now()) / (1000 * 60 * 60));
    return hours > 0? `${hours}h left` : "Expired";
  };

  const tabs = [
    {key: "all", label: "All"},
    {key: "buzz", label: "📢 Buzz"},
    {key: "deal", label: "⚡ Deals"},
    {key: "event", label: "🎉 Events"},
    {key: "lost", label: "🎒 Lost"},
    {key: "confession", label: "😂 Confessions"},
  ]

  if(loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      {/* HEADER */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-blue-600">Sanel Pulse</h1>
          <p className="text-xs text-gray-500">Campus news that disappears in 48hrs</p>
        </div>
        {/* TABS */}
        <div className="max-w-2xl mx-auto px-2 pb-2 flex gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 text-sm rounded-full whitespace-nowrap ${activeTab === tab.key? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">

        {/* SECTION 1: POST BOX */}
        <div className="bg-white rounded-xl shadow p-3">
          <h2 className="font-bold mb-2">Create Post</h2>
          {user? (
            <>
              <div className="flex gap-3 mb-3">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-10 h-10 rounded-full" />
                <p className="flex items-center text-sm font-semibold">Posting as {user.displayName?.split(" ")[0]}</p>
              </div>
              <input placeholder="Title: e.g Lost ID in CTF2" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-100 rounded-lg px-4 py-2 text-sm outline-none mb-3"/>
              <textarea placeholder="Details..." value={content} onChange={(e) => setContent(e.target.value)} className="w-full bg-gray-100 rounded-lg px-4 py-2 text-sm outline-none mb-3" rows={3}/>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm mb-2"/>
              {imageFile && <img src={URL.createObjectURL(imageFile)} className="w-full h-32 object-cover rounded mb-3"/>}
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm mb-3">
                {isAdmin && <option value="buzz">📢 Campus Buzz</option>}
                <option value="event">🎉 Event</option>
                <option value="confession">😂 Confession</option>
                <option value="lost">🎒 Lost & Found</option>
              </select>
              <button onClick={handlePost} disabled={uploading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold">
                {uploading? "Posting..." : "Post"}
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="mb-3 font-bold">🔒 Login to post</p>
              <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Login / Sign Up</Link>
            </div>
          )}
        </div>

        {/* SECTION 2: THE FEED - WHERE POSTED THINGS SHOW */}
        <h2 className="font-bold text-lg px-1">Latest on Campus</h2>

        {filteredItems.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">No posts yet. Be the first!</p>
          </div>
        )}

        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow">
            {/* POST HEADER */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <img src={item.userPhoto || `https://ui-avatars.com/api/?name=${item.postedBy}`} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-bold text-sm">{item.postedBy}</p>
                  <p className="text-xs text-red-500 font-semibold">⏰ {getTimeLeft(item.expiresAt)}</p>
                </div>
              </div>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{item.type}</span>
            </div>

            {/* POST CONTENT */}
            <div className="px-3 pb-3">
              <p className="font-bold text-base mb-1">{item.title}</p>
              <p className="text-sm text-gray-800 mb-2">{item.content}</p>
              {item.image && <img src={item.image} className="w-full rounded-lg mb-2" />}

              {item.type === "deal" && (
                <>
                  <p className="text-2xl font-bold text-green-600 mb-2">{item.price} UGX</p>
                  <Link href={`/product/${item.id}`} className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-bold">
                    View Listing
                  </Link>
                </>
              )}
            </div>

            {/* ACTIONS */}
            <div className="border-t px-3 py-2 flex justify-around text-gray-600 text-sm">
              <button>👍 Like</button>
              <button>💬 Comment</button>
              <button>↗️ Share</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}