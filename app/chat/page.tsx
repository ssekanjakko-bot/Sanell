"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function NewsPage() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("confession");

  // 1. Check login
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === "youradminemail@gmail.com") setIsAdmin(true);
    });
  }, []);

  // 2. Fetch posts
  useEffect(() => {
    const now = Timestamp.now();
    const q = query(collection(db, "newsPosts"), where("expiresAt", ">", now), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({ id: d.id,...d.data() }))));
    return () => unsub();
  }, []);

  // 3. Auto Deals
  useEffect(() => {
    const oneDayAgo = Timestamp.fromMillis(Timestamp.now().toMillis() - 24 * 60 * 60 * 1000);
    const q = query(collection(db, "products"), where("createdAt", ">", oneDayAgo), orderBy("createdAt", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setDeals(snap.docs.map(d => ({ 
        id: d.id,...d.data(), type: "deal", 
        postedBy: "Sanel Deals",
        userPhoto: "",
        expiresAt: Timestamp.fromMillis(d.data().createdAt.toMillis() + 24 * 60 * 60 * 1000)
      })));
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!user) return alert("Please login first");
    if (!title ||!content) return alert("Please fill Title and Details");

    const createdAt = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(createdAt.toMillis() + 48 * 60 * 60 * 1000);

    await addDoc(collection(db, "newsPosts"), {
      title, content, type,
      createdAt, expiresAt,
      postedBy: user.displayName || user.email.split("@")[0],
      userId: user.uid,
      userPhoto: user.photoURL || "",
    });
    setTitle(""); setContent("");
  };

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
    {key: "event", label: "🎉 Event"},
    {key: "lost", label: "🎒 Lost"},
    {key: "confession", label: "😂 Confession"},
  ]

  return (
    <div className="bg-gray-100 min-h-screen">
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
        
        {/* CREATE POST BOX - NOW CLEAR */}
        <div className="bg-white rounded-xl shadow p-3">
          {user? (
            <>
              <div className="flex gap-3 mb-3">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-10 h-10 rounded-full" />
                <input 
                  placeholder="What's the news? e.g: Lost ID in CTF2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
                />
              </div>
              <textarea 
                placeholder="Add details... e.g: Found near library. Call 0700xxxxxx"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-gray-100 rounded-lg px-4 py-2 text-sm outline-none mb-3"
                rows={3}
              />
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm mb-3">
                {isAdmin && <option value="buzz">📢 Campus Buzz - Admin only</option>}
                <option value="event">🎉 Event - Concert, Party, Meeting</option>
                <option value="confession">😂 Confession - Anonymous post</option>
                <option value="lost">🎒 Lost & Found - Lost item</option>
              </select>
              <button onClick={handlePost} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold">
                Post
              </button>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="mb-3 font-semibold">Login to post news</p>
              <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Login / Sign Up</Link>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 text-center">⏰ Posts auto-delete in 48 hours</p>
        </div>

        {/* EMPTY STATE */}
        {filteredItems.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">No posts yet in "{activeTab}". Be the first to post!</p>
          </div>
        )}

        {/* POSTS FEED */}
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow">
            {/* Post Header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <img src={item.userPhoto || `https://ui-avatars.com/api/?name=${item.postedBy}`} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-bold text-sm">{item.postedBy}</p>
                  <p className="text-xs text-gray-500">⏰ {getTimeLeft(item.expiresAt)}</p>
                </div>
              </div>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                {item.type}
              </span>
            </div>

            {/* Post Content */}
            <div className="px-3 pb-3">
              {item.type === "deal"? (
                <>
                  <p className="font-bold text-lg mb-1">⚡ {item.title}</p>
                  <p className="text-2xl font-bold text-green-600 mb-2">{item.price} UGX</p>
                  {item.image && <img src={item.image} className="w-full rounded-lg mb-2" />}
                  <Link href={`/product/${item.id}`} className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-bold">
                    View Listing
                  </Link>
                </>
              ) : (
                <>
                  <p className="font-bold text-base mb-1">{item.title}</p>
                  <p className="text-sm text-gray-800">{item.content}</p>
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