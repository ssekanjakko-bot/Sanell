"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { doc, setDoc, collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from "firebase/firestore";
import Link from 'next/link';

type Notification = {
  id: string;
  title: string;
  message: string;
  created_at: any;
}

export default function AdminNotificationsPage() {
  const [safetyTip, setSafetyTip] = useState("");
  const [dealTitle, setDealTitle] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcasts, setBroadcasts] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Load last 5 broadcasts
  useEffect(() => {
    const loadBroadcasts = async () => {
      const q = query(collection(db, "notifications"), orderBy("created_at", "desc"), limit(5));
      const snap = await getDocs(q);
      setBroadcasts(snap.docs.map(d => ({id: d.id,...d.data()}) as Notification));
    }
    loadBroadcasts();
  }, []);

  // 1. Upload Safety Tip
  const uploadSafetyTip = async () => {
    if(!safetyTip) return alert("Type a safety tip first");
    setLoading(true);
    await setDoc(doc(db, "settings", "safety_tip"), {
      text: safetyTip,
      updated_at: serverTimestamp()
    });
    alert("Safety Tip Updated!");
    setSafetyTip("");
    setLoading(false);
  }

  // 2. Upload Deal of Day
  const uploadDeal = async () => {
    if(!dealTitle || !dealPrice) return alert("Fill both title and price");
    setLoading(true);
    await setDoc(doc(db, "settings", "deal_of_day"), {
      title: dealTitle,
      price: dealPrice,
      updated_at: serverTimestamp()
    });
    alert("Deal of the Day Updated!");
    setDealTitle("");
    setDealPrice("");
    setLoading(false);
  }

  // 3. Send Broadcast
  const sendBroadcast = async () => {
    if(!broadcastTitle || !broadcastMsg) return alert("Fill title and message");
    setLoading(true);
    await addDoc(collection(db, "notifications"), {
      title: broadcastTitle,
      message: broadcastMsg,
      created_at: serverTimestamp()
    });
    alert("Broadcast Sent!");
    setBroadcastTitle("");
    setBroadcastMsg("");
    setLoading(false);
    window.location.reload(); // refresh to show new broadcast
  }

  return (
    <div className="p-4 max-w-2xl mx-auto bg-[#faf7f2] min-h-screen text-black"> {/* text-black added */}
      <Link href="/admin" className="text-blue-600 text-sm underline">← Back to Admin</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 text-black">Sanel Notifications</h1>

      {/* 1. SAFETY TIP */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-3 text-black">1. Safety Tip</h2>
        <textarea 
          value={safetyTip}
          onChange={(e) => setSafetyTip(e.target.value)}
          placeholder="Always meet in public places like Garden City..."
          className="w-full p-2 border rounded-lg h-20 text-black bg-white"
        />
        <button 
          onClick={uploadSafetyTip}
          disabled={loading}
          className="mt-3 bg-green-600 text-white px-5 py-2 rounded-lg font-semibold"
        >
          Save Safety Tip
        </button>
      </div>

      {/* 2. DEAL OF THE DAY */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-3 text-black">2. Deal of the Day</h2>
        <input
          value={dealTitle}
          onChange={(e) => setDealTitle(e.target.value)}
          placeholder="Product Title: iPhone 13 128GB"
          className="w-full p-2 border rounded-lg mb-2 text-black bg-white"
        />
        <input
          value={dealPrice}
          onChange={(e) => setDealPrice(e.target.value)}
          placeholder="Price: 1,250,000 UGX"
          className="w-full p-2 border rounded-lg text-black bg-white"
        />
        <button 
          onClick={uploadDeal}
          disabled={loading}
          className="mt-3 bg-orange-500 text-white px-5 py-2 rounded-lg font-semibold"
        >
          Save Deal
        </button>
      </div>

      {/* 3. BROADCAST */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-3 text-black">3. Send Broadcast</h2>
        <input
          value={broadcastTitle}
          onChange={(e) => setBroadcastTitle(e.target.value)}
          placeholder="Title"
          className="w-full p-2 border rounded-lg mb-2 text-black bg-white"
        />
        <textarea 
          value={broadcastMsg}
          onChange={(e) => setBroadcastMsg(e.target.value)}
          placeholder="Message"
          className="w-full p-2 border rounded-lg h-20 text-black bg-white"
        />
        <button 
          onClick={sendBroadcast}
          disabled={loading}
          className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold"
        >
          Send to Everyone
        </button>
      </div>

      {/* 4. LAST 5 BROADCASTS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-3 text-black">Last 5 Broadcasts</h2>
        {broadcasts.length === 0? (
          <p className="text-gray-600">No broadcasts yet</p>
        ) : (
          broadcasts.map(b => (
            <div key={b.id} className="border-b py-2">
              <p className="font-semibold text-black">{b.title}</p>
              <p className="text-sm text-gray-700">{b.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}