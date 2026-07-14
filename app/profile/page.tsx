"use client"; // IMPORTANT: Next.js needs this for hooks

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation"; // <-- CHANGED THIS
import { app } from "./lib/firebase"; // <-- make sure you have firebase init here

const db = getFirestore(app);
const auth = getAuth(app);

type UserData = {
  name: string;
  photo: string;
  location: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [adCount, setAdCount] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter(); // <-- CHANGED THIS

  // 1. Check login + load profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load user profile
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
        // Load ads count
        const q = query(collection(db, "products"), where("userId", "==", currentUser.uid));
        const snap = await getDocs(q);
        setAdCount(snap.size);
      } else {
        setShowLogin(true);
      }
    });
    return () => unsub();
  }, []);

  // 2. Post Ad button logic
  const handlePostAd = () => {
    if (user) {
      router.push("/post-product"); // <-- CHANGED THIS
    } else {
      setShowLogin(true);
    }
  };

  // 3. Go Live - Coming Soon
  const handleGoLive = () => {
    alert("Coming Soon! Use 'Post New Ad' for now");
  };

  if (showLogin && !user) {
    return <LoginPopup onClose={() => setShowLogin(false)} />;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <img 
          src={userData?.photo || "/default-avatar.png"} 
          className="w-20 h-20 rounded-full object-cover border"
          alt="profile"
        />
        <div>
          <h2 className="text-xl font-bold">{userData?.name || "Seller"}</h2>
          <p className="text-gray-500">{userData?.location || "Kampala, UG"}</p>
          <button className="text-sm text-blue-500 mt-1">Edit Profile</button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-around text-center mb-6">
        <div><b className="text-lg">{adCount}</b><br/>Active</div>
        <div><b className="text-lg">0</b><br/>Views</div>
        <div><b className="text-lg">0</b><br/>Leads</div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button 
          onClick={handlePostAd}
          className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold"
        >
          📄 Post New Ad
        </button>
        <button 
          onClick={handleGoLive}
          className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold"
        >
          🔴 Go Live
        </button>
      </div>

      {/* My Ads */}
      <h3 className="font-bold mb-2">My Ads</h3>
      {adCount === 0 ? (
        <div className="text-center border rounded-lg p-6">
          <p className="mb-3">You have no active listings</p>
          <button 
            onClick={handlePostAd}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg"
          >
            Post Your First Ad
          </button>
        </div>
      ) : (
        <div>{/* Map your ads here */}</div>
      )}
    </div>
  );
}

// Simple Login Popup Component
function LoginPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-80">
        <h3 className="font-bold text-lg mb-4">Login to Continue</h3>
        <button className="w-full bg-blue-500 text-white py-2 rounded mb-2">Continue with Google</button>
        <button className="w-full bg-green-500 text-white py-2 rounded mb-2">Login with Phone</button>
        <button onClick={onClose} className="w-full text-gray-500">Cancel</button>
      </div>
    </div>
  );
}