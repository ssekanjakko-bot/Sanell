"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase"; // make sure this path is correct
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import Link from 'next/link';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'broadcast' | 'seller_stat';
  created_at: any;
}

export default function ChatPage() {
  const [userType, setUserType] = useState<"buyer" | "seller">("buyer");
  const [streak, setStreak] = useState(1);
  const [stats, setStats] = useState({views: 0, sales: 0, productViews: [] as any[]});
  const [deal, setDeal] = useState({title: "Loading...", price: ""});
  const [safetyTip, setSafetyTip] = useState("");
  const [broadcasts, setBroadcasts] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Detect if user is seller
    // TEMP: we check localStorage. Later change to check Firebase for products
    const postedProducts = localStorage.getItem('my_products');
    const isSeller = postedProducts && JSON.parse(postedProducts).length > 0;
    setUserType(isSeller? 'seller' : 'buyer');

    // 2. Streak logic for buyers
    if(!isSeller){
      const lastVisit = localStorage.getItem('sanel_lastVisit');
      const today = new Date().toDateString();
      if (lastVisit!== today) {
        const newStreak = (parseInt(localStorage.getItem('sanel_streak') || '0')) + 1;
        setStreak(newStreak);
        localStorage.setItem('sanel_streak', newStreak.toString());
        localStorage.setItem('sanel_lastVisit', today);
      } else {
        setStreak(parseInt(localStorage.getItem('sanel_streak') || '1'));
      }
    }

    // 3. Load data from Firebase
    const loadData = async () => {
      try {
        // Load Deal of Day
        const dealSnap = await getDoc(doc(db, "settings", "deal_of_day"));
        if(dealSnap.exists()) setDeal(dealSnap.data() as any);

        // Load Safety Tip
        const tipSnap = await getDoc(doc(db, "settings", "safety_tip"));
        if(tipSnap.exists()) setSafetyTip(tipSnap.data().text);

        // Load Broadcasts
        const q = query(collection(db, "notifications"), orderBy("created_at", "desc"), limit(15));
        const snap = await getDocs(q);
        setBroadcasts(snap.docs.map(d => ({id: d.id,...d.data()}) as Notification));

        // Load Seller Stats - TEMP data. Later connect to real views
        if(isSeller){
          setStats({views: 12, sales: 3, productViews: [
            {product: "iPhone 13", views: 4},
            {product: "Samsung S23", views: 2}
          ]});
        }
      } catch (error) {
        console.error("Error loading inbox", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const greeting = new Date().getHours() < 12? 'Good morning' : 'Good evening';

  if(loading){
    return <div className="p-4 text-center">Loading Inbox...</div>
  }

  return (
    <div className="p-4 space-y-4 pb-24 bg-gray-50 min-h-screen">

      {/* LAYER 1: SMART HEADER */}
      {userType === 'seller'? (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-2xl shadow">
          <p className="font-bold text-lg">[📈 Sanel Business] {greeting}!</p>
          <div className="flex justify-between mt-3">
            <div>
              <p className="text-2xl font-bold">{stats.views}</p>
              <p className="text-xs">Views Today</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sales}</p>
              <p className="text-xs">Sold This Week</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-2xl shadow">
          <p className="font-bold text-lg">[🤖 Sanel] {greeting}! Ready to hunt deals?</p>
          <div className="bg-white text-black p-3 rounded-xl mt-3">
            <p className="text-xs font-semibold text-green-600">🔥 DEAL OF THE DAY</p>
            <p className="font-bold">{deal.title}</p>
            <p className="text-green-600">{deal.price}</p>
          </div>
          <p className="text-sm mt-3">🏆 Sanel Streak: {streak} days! Keep going</p>
        </div>
      )}

      {/* LAYER 2: NOTIFICATION CENTER */}
      <div>
        <h2 className="font-bold text-xl mb-3">Inbox</h2>

        {/* Safety Tip - Always on top */}
        {safetyTip && (
          <div className="flex gap-3 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-xl mb-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-semibold text-sm text-yellow-800">Safety Tip</p>
              <p className="text-sm text-yellow-900">{safetyTip}</p>
            </div>
          </div>
        )}

        {/* Seller Specific Stats */}
        {userType === 'seller' && stats.productViews.map((p, i) => (
          <div key={i} className="flex gap-3 p-3 bg-white rounded-xl mb-2 shadow-sm">
            <span className="text-2xl">👀</span>
            <div className="flex-1">
              <p className="font-semibold">{p.views} people viewed your {p.product}</p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </div>
        ))}

        {/* Broadcasts from Admin */}
        {broadcasts.map((n) => (
          <div key={n.id} className="flex gap-3 p-3 bg-white rounded-xl mb-2 shadow-sm">
            <span className="text-2xl">📢</span>
            <div className="flex-1">
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-gray-700">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {n.created_at?.toDate? n.created_at.toDate().toLocaleDateString() : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* LAYER 3: ENGAGEMENT */}
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        {userType === 'seller'? (
          <>
            <p className="font-semibold mb-2">💡 Seller Tip</p>
            <p className="text-sm text-gray-700">Products with 4+ photos and clear prices sell 3x faster on Sanel</p>
          </>
        ) : (
          <>
            <p className="font-semibold mb-2">📊 Quick Poll</p>
            <p className="text-sm text-gray-700 mb-3">What do you buy most on Sanel?</p>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 bg-gray-100 rounded-full text-sm active:bg-green-200">Fashion</button>
              <button className="px-4 py-2 bg-gray-100 rounded-full text-sm active:bg-green-200">Electronics</button>
              <button className="px-4 py-2 bg-gray-100 rounded-full text-sm active:bg-green-200">Home</button>
            </div>
          </>
        )}
      </div>

      {/* Bottom Nav Spacer */}
      <div className="h-16"></div>
    </div>
  );
}