"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-[#F5F1ED] min-h-screen pb-20">
      {children}

      {/* BOTTOM NAV - COFFEE BROWN */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D2B48C] shadow-[0_-2px_10px_rgba(111,78,55,0.1)] z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto h-16">
          <Link href="/" className={`flex flex-col items-center ${pathname === "/"? 'text-[#6F4E37]' : 'text-gray-400'}`}>
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-semibold">Home</span>
          </Link>
          <Link href="/chat" className={`flex flex-col items-center ${pathname === "/chat"? 'text-[#6F4E37]' : 'text-gray-400'}`}>
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-bold">Pulse</span>
          </Link>
          <button onClick={() => setShowModal(true)} className="flex flex-col items-center text-gray-400 active:text-[#6F4E37]">
            <span className="text-2xl">🤣</span>
            <span className="text-xs font-semibold">Post</span>
          </button>
          <Link href="/profile" className={`flex flex-col items-center ${pathname === "/profile"? 'text-[#6F4E37]' : 'text-gray-400'}`}>
            <span className="text-2xl">👤</span>
            <span className="text-xs font-semibold">Profile</span>
          </Link>
        </div>
      </div>

      <PostModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

function PostModal({ show, onClose }: { show: boolean, onClose: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("general");
  const [whatsapp, setWhatsapp] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

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

    const createdAt = Timestamp.now();
    await addDoc(collection(db, "chatPosts"), {
      title, content, image: imageUrl, type, whatsapp,
      name: user.displayName || user.email.split("@")[0], photo: user.photoURL, userId: user.uid,
      createdAt: serverTimestamp(), // FASTER
      expiresAt: Timestamp.fromMillis(createdAt.toMillis() + 48 * 60 * 60 * 1000), // 48HRS
    });

    setTitle(""); setContent(""); setWhatsapp(""); setImageFile(null); setUploading(false); onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {!user? (
          <div className="text-center py-10">
            <p className="font-bold text-lg mb-2 text-[#6F4E37]">Login to Post</p>
            <Link href="/login" className="bg-[#6F4E37] text-white px-6 py-2.5 rounded-xl font-bold">Login</Link>
            <button onClick={onClose} className="block w-full mt-3 text-gray-500">Cancel</button>
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-xl text-[#6F4E37]">Create Post</h2>
              <button onClick={onClose} className="text-2xl text-gray-400">X</button>
            </div>
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#F5F1ED] rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-[#A67B5B]"/>
            <textarea placeholder="Details..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full bg-[#F5F1ED] rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-[#A67B5B]"/>
            <input placeholder="Your WhatsApp: 2567XXXXXXXX" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-[#F5F1ED] rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-[#A67B5B]"/>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-[#F5F1ED] rounded-xl px-3 py-3 mb-3 outline-none focus:ring-2 focus:ring-[#A67B5B]">
              <option value="general">General</option>
              <option value="event">Event</option>
              <option value="lost">Lost & Found</option>
              <option value="confession">Confession</option>
            </select>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="mb-4 text-sm"/>
            <button onClick={handlePost} disabled={uploading} className="w-full bg-[#6F4E37] hover:bg-[#5a3e2e] text-white py-3.5 rounded-xl font-bold disabled:bg-gray-300">
              {uploading? "Posting..." : "Post"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}