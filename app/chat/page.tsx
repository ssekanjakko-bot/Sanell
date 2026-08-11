"use client";
import { useState, useEffect } from "react";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function NewsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // to wait for auth
  const [posts, setPosts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("confession");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 1. CHECK LOGIN FIRST
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === "youradminemail@gmail.com") setIsAdmin(true);
      setLoading(false);
    });
    return () => unsub();
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
    const q = query(collection(db, "products"), where("createdAt", ">", oneDayAgo), orderBy("createdAt", "desc"));
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
    if (!user) return alert("You must be logged in to post"); // DOUBLE CHECK
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
      postedBy: user.displayName || user.email.split("@")[0], // SHOW REAL NAME
      userId: user.uid, // LINK POST TO ACCOUNT
      userPhoto: user.photoURL || "",
    });

    setTitle(""); setContent(""); setImageFile(null); setUploading(false);
    alert("Posted! It will delete in 48hrs")
  };

  const allItems = [...posts,...deals].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  const filteredItems = activeTab === "all"? allItems : allItems.filter(p => p.type === activeTab);
  const getTimeLeft = (expiresAt: Timestamp) => {
    const hours = Math.floor((expiresAt.toMillis() - Date.now()) / (1000 * 60 * 60));
    return hours > 0? `${hours}h left` : "Expired";
  };

  if(loading) return <div className="text-center py-10">Loading...</div> // wait for auth

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-blue-600">Sanel Pulse</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">

        {/* POST BOX: ONLY SHOWS IF LOGGED IN */}
        <div className="bg-white rounded-xl shadow p-3">
          {user? ( // IF LOGGED IN
            <>
              <div className="flex gap-3 mb-3">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-10 h-10 rounded-full" />
                <p className="flex items-center text-sm font-semibold">Posting as {user.displayName?.split(" ")[0]}</p>
              </div>
              <input
                placeholder="What's the news? e.g: Lost ID in CTF2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-100 rounded-lg px-4 py-2 text-sm outline-none mb-3"
              />
              <textarea
                placeholder="Add details + contact..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-gray-100 rounded-lg px-4 py-2 text-sm outline-none mb-3"
                rows={3}
              />

              <label className="block text-sm font-semibold mb-1">Add Photo - Optional</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-sm mb-3"
              />
              {imageFile && <img src={URL.createObjectURL(imageFile)} className="w-full h-32 object-cover rounded mb-3"/>}

              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm mb-3">
                {isAdmin && <option value="buzz">📢 Campus Buzz</option>}
                <option value="event">🎉 Event</option>
                <option value="confession">😂 Confession</option>
                <option value="lost">🎒 Lost & Found</option>
              </select>
              <button onClick={handlePost} disabled={uploading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold disabled:bg-gray-400">
                {uploading? "Posting..." : "Post"}
              </button>
            </>
          ) : ( // IF NOT LOGGED IN
            <div className="text-center py-6">
              <p className="mb-3 font-bold">🔒 You must be logged in to post</p>
              <p className="text-sm text-gray-500 mb-3">1 account works for Market + News + Profile</p>
              <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Login / Sign Up</Link>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 text-center">⏰ All posts auto-delete in 48 hours</p>
        </div>

        {/* POSTS FEED */}
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <img src={item.userPhoto || `https://ui-avatars.com/api/?name=${item.postedBy}`} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-bold text-sm">{item.postedBy}</p>
                  <p className="text-xs text-gray-500">⏰ {getTimeLeft(item.expiresAt)}</p>
                </div>
              </div>
            </div>

            <div className="px-3 pb-3">
              <p className="font-bold text-base mb-1">{item.title}</p>
              <p className="text-sm text-gray-800 mb-2">{item.content}</p>
              {item.image && <img src={item.image} className="w-full rounded-lg" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}