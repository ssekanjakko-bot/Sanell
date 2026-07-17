"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; 
import { 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  getDoc, 
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";

type Notification = {
  id: string;
  title: string;
  message: string;
  created_at: any;
}

export default function AdminNotifications() {
  const [safetyTip, setSafetyTip] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<Notification[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const tipSnap = await getDoc(doc(db, "settings", "safety_tip"));
      if (tipSnap.exists()) {
        setSafetyTip(tipSnap.data().text || "");
      }

      const q = query(collection(db, "notifications"), orderBy("created_at", "desc"), limit(5));
      const historySnap = await getDocs(q);
      const historyData: Notification[] = [];
      historySnap.forEach((doc) => {
        historyData.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setHistory(historyData);
    };
    loadData();
  }, []);

  const saveSafetyTip = async () => {
    if (!safetyTip.trim()) return alert("Safety tip cannot be empty");
    setLoading(true);
    await setDoc(doc(db, "settings", "safety_tip"), {
      text: safetyTip,
      updated_at: serverTimestamp()
    });
    alert("✅ Safety Tip Updated!");
    setLoading(false);
  };

  const sendBroadcast = async () => {
    if (!title.trim() || !message.trim()) return alert("Title and Message required");
    setLoading(true);
    await addDoc(collection(db, "notifications"), {
      title, message, icon: "📢", category: "broadcast", created_at: serverTimestamp()
    });
    setTitle(""); setMessage("");
    alert("✅ Sent to everyone!");
    window.location.reload();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Sanel Notifications</h1>
          <a href="/admin" className="text-sm text-blue-600 underline">← Back to Movies Admin</a>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border mb-6">
          <h2 className="font-semibold text-lg mb-2">1. Safety Tip</h2>
          <textarea 
            value={safetyTip} 
            onChange={e => setSafetyTip(e.target.value)}
            rows={3}
            className="w-full border-gray-300 p-3 rounded-lg mb-3"
          />
          <button onClick={saveSafetyTip} disabled={loading} className="bg-green-600 text-white px-5 py-2 rounded-lg disabled:opacity-50">
            {loading ? "Saving..." : "Save Safety Tip"}
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border mb-6">
          <h2 className="font-semibold text-lg mb-2">2. Send Broadcast</h2>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full border-gray-300 p-3 rounded-lg mb-3"/>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Message" className="w-full border-gray-300 p-3 rounded-lg mb-3"/>
          <button onClick={sendBroadcast} disabled={loading} className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50">
            {loading ? "Sending..." : "Send to Everyone"}
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border">
          <h2 className="font-semibold text-lg mb-3">Last 5 Broadcasts</h2>
          {history.length === 0 ? <p className="text-gray-500 text-sm">No broadcasts yet</p> : 
            history.map((n) => (
              <div key={n.id} className="border-l-4 border-blue-500 pl-3 mb-2">
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}