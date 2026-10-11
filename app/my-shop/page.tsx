"use client";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function MyShopPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // editable fields
  const [name, setName] = useState("");
  const [banner, setBanner] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "shops"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = { id: snap.docs[0].id,...snap.docs[0].data() } as any;
        setShop(data);
        setName(data.shopName || "");
        setBanner(data.banner || "");
        setBio(data.bio || "");
        setWhatsapp(data.whatsapp || "");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "products"), where("sellerId", "==", user.uid));
    const unsub = onSnapshot(q, (s) => setProducts(s.docs.map(d=>({id:d.id,...d.data()}))));
    return () => unsub();
  }, [user]);

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

  if (loading) return <div className="min-h-screen bg-[#FFFCF9] flex items-center justify-center font-black">Loading shop...</div>;
  if (!shop) return (
    <div className="min-h-screen bg-[#FFFCF9] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-3xl">🏪</div>
      <h1 className="font-black text-xl mt-4">No Official Shop Yet</h1>
      <p className="text-sm text-gray-500 mt-1 max-w-[280px]">Pay 15K to 0767483636 to unlock your pinned official shop for 60 days.</p>
      <Link href="/create-shop" className="mt-5 bg-black text-white px-6 py-3 rounded-full font-black text-sm">Create Official Shop - 15K</Link>
    </div>
  );

  const daysLeft = shop.paid_until?.toDate? Math.ceil((shop.paid_until.toDate().getTime() - Date.now())/(24*3600*1000)) : 0;

  return (
    <div className="min-h-screen bg-[#FFFCF9] pb-24">
      {/* Header */}
      <div className="bg-black text-white p-5 rounded-b-[28px] sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-black text-[22px] tracking-tight flex items-center gap-2">{shop.shopName} <span className="bg-yellow-400 text-black text-[10px] px-2 py-0.5 rounded-full">OFFICIAL ✓</span></h1>
            <p className="text-[11px] text-yellow-300 mt-1 font-bold">📌 Pinned in {shop.categories?.join(", ")} • Active till: {shop.paid_until?.toDate().toLocaleDateString()}</p>
          </div>
          <div className={`text-[10px] font-black px-3 py-1 rounded-full ${daysLeft>7?'bg-green-500 text-white':'bg-red-500 text-white'}`}>{daysLeft} DAYS LEFT</div>
        </div>
      </div>

      <div className="max-w-[560px] mx-auto p-4 space-y-4 -mt-2">
        {/* Card */}
        <div className="bg-white rounded-[20px] border shadow-sm p-5 space-y-5">
          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Shop Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1.5 bg-[#F6F6F6] border border-black/10 focus:border-black focus:bg-white rounded-full px-4 py-3 text-[15px] font-bold text-black outline-none transition" placeholder="Mellyarts" />
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Banner Image URL</label>
            <input value={banner} onChange={e=>setBanner(e.target.value)} className="w-full mt-1.5 bg-[#F6F6F6] border border-black/10 focus:border-black rounded-full px-4 py-3 text-[13px] text-black outline-none" placeholder="https://..." />
            {banner && <img src={banner} className="mt-3 w-full h-36 object-cover rounded-xl border" alt="banner preview" />}
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Bio / Slogan</label>
            <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} className="w-full mt-1.5 bg-[#F6F6F6] border border-black/10 focus:border-black focus:bg-white rounded-[18px] px-4 py-3 text-[13px] text-black outline-none resize-none" placeholder="Welcome to Mellyarts official store" />
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">WhatsApp Number</label>
            <div className="flex items-center gap-2 mt-1.5 bg-[#F6F6F6] border border-black/10 rounded-full px-4 py-3 focus-within:border-black focus-within:bg-white transition">
              <span className="text-green-600">🟢</span>
              <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} className="flex-1 bg-transparent text-[15px] font-bold text-black outline-none" placeholder="2567778983703" />
            </div>
          </div>

          <button onClick={save} disabled={saving} className="w-full bg-black text-white py-4 rounded-full font-black text-[15px] shadow-lg active:scale-[0.98] transition disabled:opacity-50">
            {saving? "Saving..." : "Save My Shop Design"}
          </button>

          <div className="flex gap-2 text-[10px] font-bold text-gray-400 justify-center">
            <span>🌐 sanel-ug.online/shop/{shop.id.slice(0,6)}</span><span>•</span><span>{products.length} products</span>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-[20px] border shadow-sm p-5">
          <h2 className="font-black text-black text-[15px]">Products Inside This Shop ({products.length})</h2>
          {products.length===0? <p className="text-sm text-gray-400 mt-3 text-center py-6">No products yet. Add products with your seller account — they auto-show here.</p> : (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {products.map((p:any)=>(
                <Link key={p.id} href={`/product/${p.id}`} className="border rounded-xl overflow-hidden">
                  <img src={p.images?.[0]} className="h-28 w-full object-cover" />
                  <div className="p-2"><p className="text-xs font-bold truncate text-black">{p.title}</p><p className="text-[11px] text-black">{p.price} UGX</p></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}