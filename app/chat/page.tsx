"use client";
import { useState, useEffect } from "react";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const now = Timestamp.now();
    const q = query(collection(db, "chatPosts"), where("expiresAt", ">", now), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id,...d.data() })));
    });
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
      title, content, image: imageUrl, type: activeTab,
      name: user.displayName || user.email.split("@")[0],
      photo: user.photoURL, userId: user.uid,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000),
    });

    setTitle(""); setContent(""); setImageFile(null); setUploading(false);
  };

  const getTimeLeft = (expiresAt: Timestamp) => {
    const hours = Math.floor((expiresAt.toMillis() - Date.now()) / (1000 * 60 * 60));
    return hours > 0? `${hours}h left` : "Expired";
  };

  const filteredPosts = activeTab === "all"? posts : posts.filter(p => p.type === activeTab);

  return (
    <div>
      {/* HEADER */}
      <div className="bg-white shadow sticky top-0 z-10 p-3">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Sanel Pulse</h1>
          {user? (
            <button onClick={() => signOut(auth)} className="text-sm text-red-500">Logout</button>
          ) : (
            <Link href="/login" className="text-sm text-blue-600 font-bold">Login</Link>
          )}
        </div>

        {/* TABS */}
        <div className="max-w-lg mx-auto flex gap-2 mt-3 overflow-x-auto">
          {["all","event","lost","confession"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-sm rounded-full ${activeTab === tab? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {tab === "all"? "All" : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-3 space-y-3">
        {/* POST BOX */}
        {user? (
          <div className="bg-white p-3 rounded-lg shadow">
            <div className="flex gap-2 mb-2">
              <img src={user.photoURL} className="w-10 h-10 rounded-full"/>
              <p className="font-bold">Post as {user.displayName?.split(" ")[0]}</p>
            </div>
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded mb-2"/>
            <textarea placeholder="What's up?" value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-2 border rounded mb-2"/>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="mb-2"/>
            {imageFile && <img src={URL.createObjectURL(imageFile)} className="w-full h-32 object-cover rounded mb-2"/>}
            <button onClick={handlePost} disabled={uploading} className="w-full bg-blue-600 text-white py-2 rounded font-bold">
              {uploading? "Posting..." : "Post"}
            </button>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="mb-2 font-bold">Login to post</p>
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">Login</Link>
          </div>
        )}

        {/* FEED */}
        <h2 className="font-bold">Latest Posts</h2>
        {filteredPosts.length === 0 && <p className="text-center text-gray-500">No posts yet</p>}

        {filteredPosts.map(post => (
          <div key={post.id} className="bg-white p-3 rounded-lg shadow">
            <div className="flex gap-2 mb-2">
              <img src={post.photo} className="w-10 h-10 rounded-full"/>
              <div>
                <p className="font-bold">{post.name}</p>
                <p className="text-xs text-red-500">⏰ {getTimeLeft(post.expiresAt)}</p>
              </div>
            </div>
            <p className="font-bold">{post.title}</p>
            <p className="text-sm mb-2">{post.content}</p>
            {post.image && <img src={post.image} className="w-full rounded"/>}
          </div>
        ))}
      </div>
    </div>
  );
}