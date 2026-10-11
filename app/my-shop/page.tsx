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

  const [name, setName] = useState("");
  const [banner, setBanner] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUid(u?.uid || null));
  }, []);

  useEffect(() => {
    if (!uid) return;
    const fetchShop = async () => {
      setLoading(true);
      let snap = await getDocs(query(collection(db, "shops"), where("ownerId", "==", uid)));
      if (snap.empty) snap = await getDocs(query(collection(db, "shops"), where("sellerId", "==", uid)));
      if (!snap.empty) {
        const d = { id: snap.docs[0].id,...snap.docs[0].data() } as any;
        setShop(d);
        setName(d.shopName || "");
        setBanner(d.banner || "");
        setBio(d.bio || "");
        setWhatsapp(d.whatsapp || "");
        setLocation(d.storeLocation?.address || d.location || "");
        setLat(d.storeLocation?.lat || "");
        setLng(d.storeLocation?.lng || "");
      }
      setLoading(false);
    };
    fetchShop();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(query(collection(db, "products"), where("sellerId", "==", uid)), (s) =>
      setProducts(s.docs.map(d=>({id:d.id,...d.data()})))
    );
  }, [uid]);

  const useMyGPS = () => {
    if (!navigator.geolocation) return alert("GPS not supported");
    navigator.geolocation.getCurrentPosition((pos)=>{
      setLat(pos.coords.latitude.toString());
      setLng(pos.coords.longitude.toString());
      alert("Location captured ✅ Now type address and Save");
    });
  };

  const save = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "shops", shop.id), {
        shopName: name.trim(),
        banner: banner.trim(),
        bio: bio.trim(),
        whatsapp: whatsapp.trim(),
        storeLocation: {
          address: location.trim(),
          lat: lat.trim(),
          lng: lng.trim(),
        },
        location: location.trim(), // keep old field for public page
        lat: lat.trim(),
        lng: lng.trim(),
        updatedAt: serverTimestamp(),
      });
      alert("Shop saved with location ✅");
    } catch (e:any){ alert(e.message); }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black">Loading...</div>;
  if (!shop) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"><h1 className="font-black text-xl">No Official Shop Yet</h1><Link href="/create-shop" className="mt-4 bg-black text-white px-6 py-3 rounded-full font-black">Create for 15K</Link></div>;

  const daysLeft = shop.paid_until?.toDate? Math.ceil((shop.paid_until.toDate().getTime()-Date.now())/86400000) : 0;

  return (
    <div className="min-h-screen bg-[#FFFCF9] pb-24">
      <div className="bg-black text-white p-5 rounded-b-[28px] sticky top-0 z-10 flex justify-between">
        <div>
          <h1 className="font-black text-[20px] flex gap-2 items-center">{shop.shopName} <span className="bg-yellow-400 text-black text-[9px] px-2 py-0.5 rounded-full">OFFICIAL ✓</span></h1>
          <p className="text-[11px] text-yellow-300 font-bold mt-1">{shop.categories?.join(", ")} • {daysLeft} days left</p>
        </div>
        <div className="text-[10px] bg-white/20 px-3 py-1 rounded-full h-fit font-black">Live • Synced 🟢</div>
      </div>

      <div className="max-w-[560px] mx-auto p-4 space-y-4 -mt-2">
        <div className="bg-white rounded-[20px] border shadow-sm p-5 space-y-4">
          <div><label className="text-[10px] font-black uppercase text-gray-500">Shop Name</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 bg-[#F6F6F6] border rounded-full px-4 py-3 font-bold text-black outline-none" /></div>
          <div><label className="text-[10px] font-black uppercase text-gray-500">Banner URL</label><input value={banner} onChange={e=>setBanner(e.target.value)} className="w-full mt-1 bg-[#F6F6F6] border rounded-full px-4 py-3 text-sm text-black outline-none" placeholder="https://..." />{banner && <img src={banner} className="mt-2 h-32 w-full object-cover rounded-xl border" />}</div>
          <div><label className="text-[10px] font-black uppercase text-gray-500">Bio</label><textarea value={bio} onChange={e=>setBio(e.target.value)} rows={2} className="w-full mt-1 bg-[#F6F6F6] border rounded-[16px] px-4 py-3 text-sm text-black outline-none" /></div>
          <div><label className="text-[10px] font-black uppercase text-gray-500">WhatsApp</label><input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} className="w-full mt-1 bg-[#F6F6F6] border rounded-full px-4 py-3 font-bold text-black outline-none" /></div>

          {/* LOCATION - NEW */}
          <div className="border-t pt-4">
            <h3 className="font-black text-[13px] flex items-center gap-2">📍 Store Location</h3>
            <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Shop B12, Mukwano Arcade, Kampala" className="w-full mt-2 bg-[#F6F6F6] border rounded-full px-4 py-3 text-sm text-black outline-none" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="Latitude" className="bg-[#F6F6F6] border rounded-full px-4 py-2.5 text-xs text-black outline-none" />
              <input value={lng} onChange={e=>setLng(e.target.value)} placeholder="Longitude" className="bg-[#F6F6F6] border rounded-full px-4 py-2.5 text-xs text-black outline-none" />
            </div>
            <button onClick={useMyGPS} type="button" className="w-full mt-2 bg-white border-2 border-black text-black py-2.5 rounded-full font-black text-xs">📍 Use My Current GPS Location</button>

            {lat && lng && (
              <div className="mt-3 rounded-xl overflow-hidden border h-[160px]">
                <iframe width="100%" height="100%" frameBorder="0" src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`} />
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-1">This will show on public shop: sanel-ug.online/shop/{shop.id.slice(0,6)}</p>
          </div>

          <button onClick={save} disabled={saving} className="w-full bg-black text-yellow-400 py-4 rounded-full font-black text-[15px] shadow-lg">{saving?"Saving...":"✨ Save My Shop Design"}</button>
        </div>

        <div className="bg-white rounded-[20px] border p-5">
          <h2 className="font-black text-[14px]">Products Inside This Shop ({products.length})</h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {products.map((p:any)=><div key={p.id} className="border rounded-xl overflow-hidden"><img src={p.images?.[0]||p.imageUrl} className="h-24 w-full object-cover" /><div className="p-2"><p className="text-xs font-bold truncate">{p.title}</p><p className="text-[11px]">{p.price} UGX</p></div></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}