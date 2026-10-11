"use client";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { X, Plus } from "lucide-react";

const CATEGORIES = ['Phones','Vehicles','Hostels','Electronics','Home, Furniture & Appliances','Health','Fashion','Sports, Arts & Outdoor','Babies & Kids','Animals & Pets','Agriculture & Food','Commercial Equipment & Tools','Repair & Construction','Stationery','Services','Jobs']

export default function MyShopPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [banner, setBanner] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  // ADD PRODUCT STATES
  const [showAdd, setShowAdd] = useState(false);
  const [pTitle, setPTitle] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pCat, setPCat] = useState(CATEGORIES[0]);
  const [pDesc, setPDesc] = useState("");
  const [pImages, setPImages] = useState<string[]>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [adding, setAdding] = useState(false);

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
        setLogo(d.logo || d.profilePicture || "");
        setBanner(d.banner || "");
        setBio(d.bio || "");
        setWhatsapp(d.whatsapp || "");
        setLocation(d.storeLocation?.address || d.location || "");
        setLat(d.storeLocation?.lat || d.lat || "");
        setLng(d.storeLocation?.lng || d.lng || "");
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
      alert("GPS captured ✅");
    });
  };

  const uploadLogo = async (e:any)=>{
    const file = e.target.files?.[0];
    if(!file ||!uid) return;
    setUploadingLogo(true);
    try {
      const storage = getStorage();
      const r = ref(storage, `shop_logos/${uid}/logo_${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setLogo(url);
    } catch(err:any){ alert(err.message) }
    setUploadingLogo(false);
  }

  const uploadBanner = async (e:any)=>{
    const file = e.target.files?.[0];
    if(!file ||!uid) return;
    setUploadingBanner(true);
    try {
      const storage = getStorage();
      const r = ref(storage, `shop_banners/${uid}/banner_${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setBanner(url);
    } catch(err:any){ alert(err.message) }
    setUploadingBanner(false);
  }

  const uploadProductImages = async (e:any)=>{
    const files = Array.from(e.target.files || []) as File[];
    if(!files.length ||!uid) return;
    setUploadingProduct(true);
    try {
      const storage = getStorage();
      const urls: string[] = [];
      for(const file of files.slice(0,6)){
        const r = ref(storage, `products/${uid}/${Date.now()}_${file.name}`);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        urls.push(url);
      }
      setPImages(prev=>[...prev,...urls]);
    } catch(err:any){ alert(err.message) }
    setUploadingProduct(false);
  }

  const addProduct = async ()=>{
    if(!pTitle ||!pPrice ||!uid ||!shop) return alert("Fill title & price");
    if(pImages.length===0) return alert("Add at least 1 image");
    setAdding(true);
    try {
      await addDoc(collection(db, "products"), {
        title: pTitle.trim(),
        price: pPrice.trim().replace(/,/g,''),
        category: pCat,
        description: pDesc.trim(),
        images: pImages,
        imageUrl: pImages[0],
        sellerId: uid,
        shopId: shop.id,
        shopName: shop.shopName,
        whatsapp: whatsapp || shop.whatsapp,
        createdAt: serverTimestamp(),
        is_boosted: false,
      });
      setPTitle(""); setPPrice(""); setPDesc(""); setPImages([]);
      setShowAdd(false);
      alert("Product added ✅ Now live in your shop");
    } catch(e:any){ alert(e.message) }
    setAdding(false);
  }

  const save = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "shops", shop.id), {
        shopName: name.trim(),
        logo: logo.trim(),
        profilePicture: logo.trim(),
        shopLogo: logo.trim(),
        banner: banner.trim(),
        bio: bio.trim(),
        whatsapp: whatsapp.trim(),
        storeLocation: { address: location.trim(), lat: lat.trim(), lng: lng.trim() },
        location: location.trim(),
        lat: lat.trim(),
        lng: lng.trim(),
        updatedAt: serverTimestamp(),
      });
      alert("Shop saved ✅");
    } catch (e:any){ alert(e.message); }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black">Loading...</div>;
  if (!shop) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"><h1 className="font-black text-xl">No Official Shop Yet</h1><Link href="/create-shop" className="mt-4 bg-black text-white px-6 py-3 rounded-full font-black">Create for 15K</Link></div>;

  return (
    <div className="min-h-screen bg-[#FFFCF9] pb-28">
      <div className="bg-black text-white p-5 rounded-b-[28px] sticky top-0 z-10 flex justify-between">
        <div>
          <h1 className="font-black text-[20px] flex gap-2 items-center">{shop.shopName} <span className="bg-yellow-400 text-black text-[9px] px-2 py-0.5 rounded-full">OFFICIAL ✓</span></h1>
          <p className="text-[11px] text-yellow-300 font-bold mt-1">{products.length} products • {shop.categories?.join(", ")}</p>
        </div>
        <div className="text-[10px] bg-white/20 px-3 py-1 rounded-full h-fit font-black">Live 🟢</div>
      </div>

      <div className="max-w-[560px] mx-auto p-4 space-y-4 -mt-2">
        {/* SHOP DESIGN */}
        <div className="bg-white rounded-[20px] border shadow-sm p-5 space-y-5">
          <div className="bg-[#FFF8E1] border border-yellow-400 rounded-[18px] p-4">
            <label className="text-[10px] font-black uppercase text-gray-600">Profile Picture • Homepage + Blue Tick</label>
            <div className="flex items-center gap-4 mt-3">
              <div className="relative">
                {logo? <img src={logo} className="w-20 h-20 rounded-full object-cover border-2 border-black" /> : <div className="w-20 h-20 rounded-full bg-black text-yellow-400 flex items-center justify-center font-black text-2xl">{name?.[0] || "M"}</div>}
                <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1D9BF0] rounded-full border-2 border-white flex items-center justify-center text-white text-[11px]">✓</span>
              </div>
              <div className="flex flex-col gap-2">
                <label className="bg-black text-white px-5 py-2.5 rounded-full text-[12px] font-black cursor-pointer text-center">
                  {uploadingLogo? "Uploading..." : "📷 Choose from Gallery"}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                </label>
                {logo && <button onClick={()=>setLogo("")} className="text-[11px] text-red-600 font-bold">Remove Logo</button>}
              </div>
            </div>
          </div>

          <div className="border rounded-[18px] p-4">
            <label className="text-[10px] font-black uppercase text-gray-600">Shop Banner • From Gallery</label>
            {banner && <img src={banner} className="mt-3 h-36 w-full object-cover rounded-xl border" />}
            <div className="flex gap-2 mt-3">
              <label className="flex-1 bg-white border-2 border-black text-black px-4 py-2.5 rounded-full text-[12px] font-black cursor-pointer text-center">
                {uploadingBanner? "Uploading..." : "🖼️ Upload Banner"}
                <input type="file" accept="image/*" className="hidden" onChange={uploadBanner} />
              </label>
              {banner && <button onClick={()=>setBanner("")} className="bg-red-50 border text-red-600 px-4 py-2.5 rounded-full text-[12px] font-black">Remove</button>}
            </div>
          </div>

          <div><label className="text-[10px] font-black uppercase text-gray-500">Shop Name</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 bg-[#F6F6F6] border rounded-full px-4 py-3 font-bold text-black outline-none" /></div>
          <div><label className="text-[10px] font-black uppercase text-gray-500">Bio</label><textarea value={bio} onChange={e=>setBio(e.target.value)} rows={2} className="w-full mt-1 bg-[#F6F6F6] border rounded-[16px] px-4 py-3 text-sm text-black outline-none" /></div>
          <div><label className="text-[10px] font-black uppercase text-gray-500">WhatsApp</label><input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} className="w-full mt-1 bg-[#F6F6F6] border rounded-full px-4 py-3 font-bold text-black outline-none" /></div>

          <div className="border-t pt-4">
            <h3 className="font-black text-[13px]">📍 Store Location</h3>
            <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Shop B12, Mukwano Arcade" className="w-full mt-2 bg-[#F6F6F6] border rounded-full px-4 py-3 text-sm text-black outline-none" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="Latitude" className="bg-[#F6F6F6] border rounded-full px-4 py-2.5 text-xs text-black outline-none" />
              <input value={lng} onChange={e=>setLng(e.target.value)} placeholder="Longitude" className="bg-[#F6F6F6] border rounded-full px-4 py-2.5 text-xs text-black outline-none" />
            </div>
            <button onClick={useMyGPS} type="button" className="w-full mt-2 bg-white border-2 border-black text-black py-2.5 rounded-full font-black text-xs">📍 Use My Current GPS</button>
          </div>

          <button onClick={save} disabled={saving} className="w-full bg-black text-yellow-400 py-4 rounded-full font-black text-[15px]">{saving?"Saving...":"✨ Save Shop"}</button>
        </div>

        {/* PRODUCTS + ADD BUTTON */}
        <div className="bg-white rounded-[20px] border p-5">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-[14px]">Products ({products.length})</h2>
            <button onClick={()=>setShowAdd(true)} className="bg-black text-white px-4 py-2 rounded-full font-black text-[12px] flex items-center gap-1"><Plus size={14}/> Add Product</button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {products.map((p:any)=><div key={p.id} className="border rounded-xl overflow-hidden"><img src={p.images?.[0]||p.imageUrl} className="h-28 w-full object-cover" /><div className="p-2"><p className="text-xs font-bold truncate">{p.title}</p><p className="text-[11px] font-black">{p.price} UGX</p></div></div>)}
            {products.length===0 && <p className="text-[12px] text-gray-400 col-span-2 text-center py-6">No products yet. Click Add Product</p>}
          </div>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[24px] sm:rounded-[24px] w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-[18px]">Add Product to {shop.shopName}</h3>
              <button onClick={()=>setShowAdd(false)} className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center"><X size={16}/></button>
            </div>

            <div className="space-y-3">
              <div><label className="text-[10px] font-black uppercase">Images • Gallery • Max 6</label>
                <label className="w-full mt-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#FFFCF9]">
                  <span className="font-black text-[12px]">{uploadingProduct? "Uploading..." : "📷 Choose from Gallery"}</span>
                  <span className="text-[10px] text-gray-400">Tap to select</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={uploadProductImages} />
                </label>
                {pImages.length>0 && <div className="grid grid-cols-3 gap-2 mt-2">{pImages.map((img,i)=><div key={i} className="relative"><img src={img} className="h-20 w-full object-cover rounded-lg border" /><button onClick={()=>setPImages(pImages.filter((_,idx)=>idx!==i))} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px]">✕</button></div>)}</div>}
              </div>

              <input value={pTitle} onChange={e=>setPTitle(e.target.value)} placeholder="Product Title e.g. iPhone 13" className="w-full bg-[#F6F6F6] border rounded-full px-4 py-3 text-sm font-bold outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input value={pPrice} onChange={e=>setPPrice(e.target.value)} placeholder="Price e.g. 45000" type="number" className="bg-[#F6F6F6] border rounded-full px-4 py-3 text-sm font-bold outline-none" />
                <select value={pCat} onChange={e=>setPCat(e.target.value)} className="bg-[#F6F6F6] border rounded-full px-4 py-3 text-sm font-bold outline-none">
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <textarea value={pDesc} onChange={e=>setPDesc(e.target.value)} placeholder="Description" rows={3} className="w-full bg-[#F6F6F6] border rounded-[16px] px-4 py-3 text-sm outline-none" />

              <button onClick={addProduct} disabled={adding} className="w-full bg-black text-yellow-400 py-4 rounded-full font-black text-[15px]">{adding?"Adding...":"✅ Add Product to Shop"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}