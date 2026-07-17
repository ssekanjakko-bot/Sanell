"use client";

import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase"; // 4 dots up because /app/chat/page.tsx
import { 
  collection, 
  getDoc, 
  getDocs, 
  doc, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";

type Notification = {
  id: string;
  title: string;
  message: string;
  icon: string;
  created_at: any;
}

export default function ChatPage() {
  const [safetyTip, setSafetyTip] = useState<string>("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInbox = async () => {
      // 1. Load Safety Tip
      const tipSnap = await getDoc(doc(db, "settings", "safety_tip"));
      if (tipSnap.exists()) {
        setSafetyTip(tipSnap.data().text);
      }

      // 2. Load Broadcasts
      const q = query(collection(db, "notifications"), orderBy("created_at", "desc"), limit(20));
      const snap = await getDocs(q);
      const data: Notification[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as Notification));
      setNotifications(data);
      setLoading(false);
    };
    loadInbox();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading inbox...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        
        <h1 className="text-2xl font-bold mb-4">Inbox 💬</h1>

        {/* SAFETY TIP - Always on top */}
        {safetyTip && (
          <div className="bg-yellow-50 border-yellow-300 p-4 rounded-xl mb-4">
            <div className="flex gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-sm">Safety Tip</p>
                <p className="text-sm text-gray-700">{safetyTip}</p>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS LIST */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white p-10 rounded-xl text-center">
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex gap-3">
                  <span className="text-2xl">{n.icon || "📢"}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n.created_at?.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}