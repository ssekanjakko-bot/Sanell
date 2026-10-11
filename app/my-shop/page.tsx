"use client";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function MyShopPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [banner, setBanner] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Get real logged in user
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) setUid(u.uid);
      else { setUid(null); setLoading(false); }
    });
  }, []);

  // Fetch shop - try ownerId first, then sellerId (for old shops)
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const fetchShop = async () => {
      try {
        // Try ownerId
        let q = query(collection(db, "shops"), where("ownerId", "==", uid));
        let snap = await getDocs(q);
        if (snap.empty) {
          // fallback sellerId for shops created before fix
          q = query(collection(db, "shops"), where("sellerId", "==", uid));
          snap = await getDocs(q);
        }
        if (!snap.empty) {
          const d = { id: snap.docs[0].id,...snap.docs[0].data() } as any;
          setShop(d);
          setName(d.shopName || "");
          setBanner(d.banner || "");
          setBio(d.bio || "");
          setWhatsapp(d.whatsapp || "");
        }
      } catch (e:any) {
        setError(e.message);
        console.error(e);
      }
      setLoading(false);
    };
    fetchShop();
  }, [uid]);

  // Live products
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "products"), where("sellerId", "==", uid));
    return onSnapshot(q, (s) => setProducts(s.docs.map(d=>({id:d.id,...d.data()}))));
  }, [uid]);

  const save = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "shops", shop.id), {
        shopName: name.trim(),
        banner: banner.trim(),
        bio: bio.trim(),
        whatsapp: whatsapp.trim(),
        updatedAt: serverTimestamp(),
      });
      alert("Shop saved ✅");
    } catch (e:any) { alert(e.message); }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-[#FFFCF9] flex items-center justify-center font-black text-black">Loading your shop...</div>;

  if (error) return <div className="min-h-screen bg-red-50 p-6 text-center"><p className="font-black text-red-600">Error: {error}</p><p className="text-xs mt-2">Make sure Firestore rules allow read shops where ownerId==uid or sellerId==uid</p></div>

  if (!uid) return (
    <div className="min-h-screen bg-[#FFFCF9] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="font-black text-xl text-black">Please login first</h1>
      <Link href="/login" className="mt-4 bg-black text-white px-6 py-3 rounded-full font-black">Login</Link>
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-[#FFFCF9] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-3xl">🏪</div>
      <h1 className="font-black text-xl mt-4 text-black">No Official Shop Yet</h1>
      <p className="text-sm text-gray-500 mt-1 max-w-[280px]">UID: {uid.slice(0,10)} - No shop found with ownerId or sellerId = this UID. Go to Firestore and fix it.</p>
      <Link href="/create-shop" className="mt-5 bg-black text-white px-6 py-3 rounded-full font-black text-sm">Create Official Shop - 15K</Link>
    </div>
  );

  const paidDate = shop.paid_until?.toDate? shop.paid_until.toDate() : shop.paid_until? new Date(shop.paid_until.seconds*1000) : new Date();
  const daysLeft = Math.ceil((paidDate.getTime() - Date.now())/(24*3600*1000));

  return (
    <div className="min-h-screen bg-[#FFFCF9] pb-24">
      <div className="bg-black text-white p-5 rounded-b-[28px] sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-black text-[22px] tracking-tight flex items-center gap-2">{shop.shopName} <span className="bg-yellow-400 text-black text-[10px] px-2 py-0.5 rounded-full">OFFICIAL ✓</span></h1>
            <p className="text-[11px] text-yellow-300 mt-1 font-bold">📌 Pinned in {shop.categories?.join(", ")} • Active till: {paidDate.toLocaleDateString()}</p>
          </div>
          <div className={`text-[10px] font-black px-3 py-1 rounded-full ${daysLeft>7?'bg-green-500':'bg-red-500'} text-white`}>{daysLeft} DAYS</div>
        </div>
      </div>

      <div className="max-w-[560px] mx-auto p-4 space-y-4 -mt-2">
        <div className="bg-white rounded-[20px] border shadow-sm p-5 space-y-5">
          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase">Shop Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1.5 bg-[#F6F6F6] border border-black/10 focus:border-black rounded-full px-4 py-3 text-[15px] font-bold text-black outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase">Banner Image URL</label>
            <input value={banner} onChange={e=>setBanner(e.target.value)} className="w-full mt-1.5 bg-[#F6F6F6] border border-black/10 rounded-full px-4 py-3 text-[13px] text-black outline-none" placeholder="https://..." />
            {banner && <img src={banner} className="mt-3 w-full h-36 object-cover rounded-xl border" />}
          </div>
          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase">Bio</label>
            <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} className="w-full mt-1.5 bg-[#F6F6F6] border rounded-[18px] px-4 py-3 text-[13px] text-black outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase">WhatsApp</label>
            <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} className="w-full mt-1.5 bg-[#F6F6F6] border rounded-full px-4 py-3 font-bold text-black outline-none" />
          </div>
          <button onClick={save} disabled={saving} className="w-full bg-black text-white py-4 rounded-full font-black text-[15px]">{saving? "Saving..." : "Save My Shop Design"}</button>
          <p className="text-center text-[10px] font-bold text-gray-400">🌐 sanel-ug.online/shop/{shop.id.slice(0,6)} • {products.length} products • UID: {uid.slice(0,6)}</p>
        </div>

        <div className="bg-white rounded-[20px] border p-5">
          <h2 className="font-black text-[15px] text-black">Products Inside This Shop ({products.length})</h2>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {products.map((p:any)=>(
              <Link key={p.id} href={`/product/${p.id}`} className="border rounded-xl overflow-hidden">
                <img src={p.images?.[0] || p.image} className="h-28 w-full object-cover bg-gray-100" />
                <div className="p-2"><p className="text-xs font-bold truncate text-black">{p.title}</p><p className="text-[11px] text-black">{p.price} UGX</p></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}