"use client";
import { useState, useEffect } from "react";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";

function timeAgo(timestamp: Timestamp) {
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
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("general");
  const [whatsapp, setWhatsapp] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    const now = Timestamp.now();
    const q = query(collection(db, "chatPosts"), where("expiresAt", ">", now), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({ id: d.id,...d.data() }))));
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!user) return alert("Login to post");
    if (!title) return alert("Add a title");

    setUploading(true);
    let imageUrl = "";
    if (imageFile) {
      const storageRef = ref(storage, `chat/${Date.now()}_${imageFile.name}`);
      const snap = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snap.ref);
    }

    await addDoc(collection(db, "chatPosts"), {
      title, content, image: imageUrl, type, whatsapp,
      name: user.displayName || user.email.split("@")[0], photo: user.photoURL, userId: user.uid,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000),
    });

    setTitle(""); setContent(""); setWhatsapp(""); setImageFile(null); setUploading(false); setShowModal(false);
  };

  const getTimeLeft = (expiresAt: Timestamp) => {
    const hours = Math.floor((expiresAt.toMillis() - Date.now()) / (1000 * 60 * 60));
    return hours > 0? `${hours}h` : "0h";
  };

  const filteredPosts = activeTab === "all"? posts : posts.filter(p => p.type === activeTab);

  return (
    <div>
      {/* HEADER */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Sanel Pulse</h1>
          {user? <button onClick={() => signOut(auth)} className="text-sm text-red-500">Logout</button> : <Link href="/login" className="text-sm text-blue-600 font-bold">Login</Link>}
        </div>
        <div className="max-w-lg mx-auto px-2 pb-2 flex gap-2 overflow-x-auto">
          {["all","event","lost","confession","general"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm rounded-full font-semibold ${activeTab === tab? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-3 space-y-4">
        {/* FEED */}
        {filteredPosts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3 flex items-center justify-between">
              <div className="flex gap-3 items-center">
                <img src={post.photo} className="w-11 h-11 rounded-full"/>
                <div>
                  <p className="font-bold">{post.name}</p>
                  <p className="text-xs text-gray-500">{timeAgo(post.createdAt)} · ⏰ {getTimeLeft(post.expiresAt)} left</p>
                </div>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{post.type}</span>
            </div>
            <div className="px-3 pb-2">
              <p className="font-bold">{post.title}</p>
              <p className="text-sm">{post.content}</p>
            </div>
            {post.image && <img src={post.image} className="w-full"/>}

            {/* WHATSAPP BUTTON FOR LOST/ADS */}
            {(post.type === "lost" || post.type === "general") && post.whatsapp && (
              <div className="p-3">
                <a
                  href={`https://wa.me/${post.whatsapp}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-xl font-bold"
                >
                  💬 Contact on WhatsApp
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* POST MODAL - OPENS WITH 🤣 BUTTON */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-4">
            {!user? (
              <div className="text-center py-10">
                <p className="font-bold text-lg mb-2">Login to Post</p>
                <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-xl">Login</Link>
                <button onClick={() => setShowModal(false)} className="block w-full mt-3 text-gray-500">Cancel</button>
              </div>
            ) : (
              <>
                <div className="flex justify-between mb-3">
                  <h2 className="font-bold text-lg">Create Post</h2>
                  <button onClick={() => setShowModal(false)}>X</button>
                </div>
                <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-100 rounded-xl px-4 py-2 mb-2"/>
                <textarea placeholder="Details..." value={content} onChange={(e) => setContent(e.target.value)} className="w-full bg-gray-100 rounded-xl px-4 py-2 mb-2"/>
                <input placeholder="Your WhatsApp: 2567XXXXXXXX" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-gray-100 rounded-xl px-4 py-2 mb-2"/>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-100 rounded-xl px-3 py-2 mb-2">
                  <option value="general">General</option>
                  <option value="event">Event</option>
                  <option value="lost">Lost & Found</option>
                  <option value="confession">Confession</option>
                </select>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="mb-3"/>
                <button onClick={handlePost} disabled={uploading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
                  {uploading? "Posting..." : "Post"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}