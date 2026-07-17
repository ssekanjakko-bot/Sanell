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

  // Load current safety tip + last 5 broadcasts
  useEffect(() => {
    const loadData = async () => {
      // Load Safety Tip
      const tipSnap = await getDoc(doc(db, "settings", "safety_tip"));
      if (tipSnap.exists()) {
        setSafetyTip(tipSnap.data().text || "");
      }

      // Load History
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
    try {
      await setDoc(doc(db, "settings", "safety_tip"), {
        text: safetyTip,
        updated_at: serverTimestamp()
      });
      alert("✅ Safety Tip Updated!");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  const sendBroadcast = async () => {
    if (!title.trim() || !message.trim()) return alert("Title and Message required");
    setLoading(true);
    try {
      await addDoc(collection(db, "notifications"), {
        title: title,
        message: message,
        icon: "📢",
        category: "broadcast",
        created_at: serverTimestamp()
      });
      setTitle("");
      setMessage("");
      alert("✅ Sent to everyone!");
      // Refresh history
      window.location.reload();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-6">
          <h1 className="