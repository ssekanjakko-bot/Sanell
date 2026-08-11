"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

type NewsType = "buzz" | "event" | "confession" | "lost" | "deal";

export default function NewsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<NewsType | "all">("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [newPost, setNewPost] = useState({ type: "confession" as NewsType, title: "", content: "" });

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user && user.email === "youradminemail@gmail.com") setIsAdmin(true);
    });
  }, []);

  // Fetch posts
  useEffect(() => {
    const now = Timestamp.now();
    const q = query(collection(db, "newsPosts"), where("expiresAt", ">", now), orderBy("expiresAt", "asc"));
    const unsub = onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  // Auto Deals
  useEffect(() => {
    const oneDayAgo = Timestamp.fromMillis(Timestamp.now().toMillis() - 24 * 60 * 60 * 1000);
    const q = query(collection(db, "products"), where("createdAt", ">", oneDayAgo), orderBy("createdAt", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setDeals(snap.docs.map(d => ({ 
        id: d.id, ...d.data(), type: "deal", 
        postedBy: "Sanel Deals",
        expiresAt: Timestamp.fromMillis(d.data().createdAt.toMillis() + 24 * 60 * 60 * 1000)
      })));
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!newPost.title || !newPost.content) return alert("Fill all fields");
    const createdAt = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(createdAt.toMillis() + 48 * 60 * 60 * 1000);
    await addDoc(collection(db, "newsPosts"), {
      ...newPost, createdAt, expiresAt,
      postedBy: isAdmin ? "Sanel Admin" : "Anonymous",
      likes: 0, comments: []
    });
    setNewPost({ type: "confession", title: "", content: "" });
  };

  const allItems = [...posts, ...deals].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  const filteredItems = activeTab === "all" ? allItems : allItems.filter(p => p.type === activeTab);
  const getTimeLeft = (expiresAt: Timestamp) => {
    const hours = Math.floor((expiresAt.toMillis() - Date.now()) / (1000 * 60 * 60));
    return `${hours}h`;
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* FB HEADER */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Sanel Pulse</h1>
          <div className="flex gap-1">
            {["all", "buzz", "deal", "event", "lost", "confession"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-1 text-xs rounded-full ${activeTab === tab ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-600'}`}>
                {tab === "deal" ? "⚡ Deals" : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-2 py-4 space-y-4">
        
        {/* CREATE POST BOX - LIKE FB */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">S</div>
            <input 
              placeholder={isAdmin ? "What's happening on campus?" : "Post anonymously..."}
              value={newPost.title}
              onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm"
            />
          </div>
          <textarea 
            placeholder="Write something..."
            value={newPost.content}
            onChange={(e) => setNewPost({...newPost, content: e.target.value})}
            className="w-full bg-gray-100 rounded-lg px-4 py-2 text-sm mb-2"
            rows={2}
          />
          <div className="flex gap-2 mb-2">
            <select value={newPost.type} onChange={(e) => setNewPost({...newPost, type: e.target.value as NewsType})}
              className="flex-1 bg-gray-100 rounded px-2 py-1 text-sm">
              {isAdmin && <option value="buzz">📢 Buzz</option>}
              {isAdmin && <option value="event">🎉 Event</option>}
              <option value="confession">😂 Confession</option>
              <option value="lost">🎒 Lost & Found</option>
            </select>
          </div>
          <button onClick={handlePost} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">
            Post
          </button>
          <p className="text-xs text-gray-500 mt-1 text-center">Posts auto-delete in 48 hours</p>
        </div>

        {/* POSTS FEED - FB CARDS */}
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow">
            {/* Post Header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${item.type === 'deal' ? 'bg-green-500' : 'bg-gray-500'}`}>
                  {item.postedBy[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{item.postedBy}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    {getTimeLeft(item.expiresAt)} • 🔥 Expires soon
                  </p>
                </div>
              </div>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                {getTimeLeft(item.expiresAt)} left
              </span>
            </div>

            {/* Post Content */}
            <div className="px-3 pb-2">
              {item.type === "deal" ? (
                <>
                  <p className="font-bold">⚡ {item.title}</p>
                  <p className="text-xl font-bold text-green-600">{item.price} UGX</p>
                  {item.image && <img src={item.image} className="w-full rounded-lg mt-2" />}
                  <Link href={`/product/${item.id}`} className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg mt-2">
                    View Listing
                  </Link>
                </>
              ) : (
                <>
                  <p className="font-bold mb-1">{item.title}</p>
                  <p className="text-sm">{item.content}</p>
                </>
              )}
            </div>

            {/* FB ACTIONS */}
            <div className="border-t px-3 py-2 flex justify-between text-gray-600 text-sm">
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