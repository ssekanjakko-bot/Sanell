"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false); // MOVED HERE

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {children}
      {/* We pass setShowModal down with context later */}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto h-16">
          <Link href="/" className={`flex flex-col items-center ${pathname === "/"? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="text-2xl">🏠</span>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/chat" className={`flex flex-col items-center ${pathname === "/chat"? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-bold">Pulse</span>
          </Link>
          <button onClick={() => setShowModal(true)} className="flex flex-col items-center text-gray-400"> {/* WORKS NOW */}
            <span className="text-2xl">🤣</span>
            <span className="text-xs">Post</span>
          </button>
          <Link href="/profile" className={`flex flex-col items-center ${pathname === "/profile"? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="text-2xl">👤</span>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>

      {/* POST MODAL - NOW LIVES IN LAYOUT */}
      <PostModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}


// MODAL COMPONENT INSIDE SAME FILE
import { useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

function PostModal({ show, onClose }: { show: boolean, onClose: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("general");
  const [whatsapp, setWhatsapp] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useState(() => onAuthStateChanged(auth, setUser));

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
      createdAt, expiresAt: Timestamp.fromMillis(createdAt.toMillis() + 48 * 60 * 60 * 1000), // 48HRS
    });

    setTitle(""); setContent(""); setWhatsapp(""); setImageFile(null); setUploading(false); onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
        {!user? (
          <div className="text-center py-10">
            <p className="font-bold text-lg mb-2">Login to Post</p>
            <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-xl">Login</Link>
            <button onClick={onClose} className="block w-full mt-3 text-gray-500">Cancel</button>
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-3">
              <h2 className="font-bold text-lg">Create Post</h2>
              <button onClick={onClose}>X</button>
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
  )
}