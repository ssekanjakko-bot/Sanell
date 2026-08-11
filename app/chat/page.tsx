"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, Timestamp, limit } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";

function timeAgo(timestamp: Timestamp) {
  if (!timestamp) return "now";
  const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true); // LOADING STATE

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    setLoading(true);
    const now = Timestamp.now();
    const q = query(
      collection(db, "chatPosts"), 
      where("expiresAt", ">", now), 
      orderBy("expiresAt"), // NEEDED FOR INDEX
      orderBy("createdAt", "desc"),
      limit(30) // ONLY GET 30 POSTS = FAST
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id,...d.data() })))
      setLoading(false);
    })
    return () => unsub();
  }, []);

  const getTimeLeft = (expiresAt: Timestamp) => {
    if (!expiresAt) return "";
    const hours = Math.floor((expiresAt.toMillis() - Date.now()) / (1000 * 60 * 60));
    return hours > 0? `${hours}h` : "Expired";
  };

  const filteredPosts = activeTab === "all"? posts : posts.filter(p => p.type === activeTab);

  return (
    <div>
      {/* HEADER - COFFEE BROWN */}
      <div className="bg-[#6F4E37] shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Sanel Pulse</h1>
          {user? <button onClick={() => signOut(auth)} className="text-sm text-[#F5F1ED] font-semibold">Logout</button> : <Link href="/login" className="text-sm text-white font-bold">Login</Link>}
        </div>
        {/* TABS */}
        <div className="max-w-lg mx-auto px-2 pb-3 flex gap-2 overflow-x-auto">
          {["all","event","lost","confession","general"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm rounded-full font-semibold whitespace-nowrap ${activeTab === tab? 'bg-white text-[#6F4E37]' : 'bg-[#A67B5B] text-white'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-3 space-y-4">
        {loading && <p className="text-center text-[#6F4E37] py-10 font-semibold">Loading Pulse...</p>}
        
        {!loading && filteredPosts.length === 0 && (
          <div className="text-center text-gray-400 py-20">
            <p className="text-4xl mb-2">📢</p>
            <p>No posts yet. Be the first to post!</p>
          </div>
        )}

        {filteredPosts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border-[#D2B48C]">
            <div className="p-3 flex items-center justify-between">
              <div className="flex gap-3 items-center">
                <img src={post.photo || "/default-avatar.png"} className="w-11 h-11 rounded-full border-2 border-[#A67B5B]"/>
                <div>
                  <p className="font-bold text-[#6F4E37]">{post.name}</p>
                  <p className="text-xs text-gray-500">{timeAgo(post.createdAt)} · <span className="text-red-500 font-semibold">⏰ {getTimeLeft(post.expiresAt)} left</span></p>
                </div>
              </div>
              <span className="text-xs bg-[#F5F1ED] text-[#6F4E37] px-2 py-1 rounded-full font-semibold">{post.type}</span>
            </div>
            <div className="px-3 pb-2">
              <p className="font-bold text-[#6F4E37]">{post.title}</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
            </div>
            {post.image && <img src={post.image} className="w-full"/>}
            {(post.type === "lost" || post.type === "general") && post.whatsapp && (
              <div className="p-3">
                <a href={`https://wa.me/${post.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-xl font-bold">
                  💬 Contact on WhatsApp
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}