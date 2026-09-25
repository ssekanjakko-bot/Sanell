import Link from 'next/link';

export default function About() {
  return (
    <main className="min-h-screen bg-[#FDF8F3]">
      <div className="bg-white sticky top-0 z-10 shadow-sm p-3 flex items-center gap-3">
        <Link href="/" className="bg-black text-white w-9 h-9 rounded-full flex items-center justify-center">←</Link>
        <span className="font-bold text-[16px]" style={{color: '#8B4513'}}>About Sanel</span>
      </div>

      <div className="p-3">
        {/* HERO */}
        <div className="bg-gradient-to-br from-black via-[#3A1A00] to-[#8B4513] rounded-[20px] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-[28px] font-black leading-tight">Sanel Campus Market</h1>
          <p className="text-white/70 text-[13px] mt-1 font-bold tracking-widest">BUY & SELL ON CAMPUS</p>
          <p className="text-[13px] text-white/80 mt-4 leading-6 max-w-[90%]">
            Sanel is a student-to-student marketplace made for campus life. Sell your textbooks, laptops, furniture, clothes, and hostel items. Find deals from other students near you without leaving campus.
          </p>
        </div>

        {/* WHY LOVE IT */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 mt-4">
          <h2 className="font-black text-[15px] text-black">Why Students Love It</h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-[#FFF7ED] border border-orange-100 rounded-xl p-3">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[18px] shadow-sm">💯</div>
              <p className="font-bold text-[12px] mt-2 text-black">No Commission</p>
              <p className="text-[11px] text-gray-600 leading-4 mt-1">100% of your sale money is yours</p>
            </div>
            <div className="bg-[#F0F9FF] border border-blue-100 rounded-xl p-3">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[18px] shadow-sm">📍</div>
              <p className="font-bold text-[12px] mt-2 text-black">Meet on Campus</p>
              <p className="text-[11px] text-gray-600 leading-4 mt-1">Exchange at library, hostel, or lecture rooms</p>
            </div>
            <div className="bg-[#F0FDF4] border border-green-100 rounded-xl p-3">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[18px] shadow-sm">💬</div>
              <p className="font-bold text-[12px] mt-2 text-black">WhatsApp Direct</p>
              <p className="text-[11px] text-gray-600 leading-4 mt-1">Chat with buyers/sellers instantly</p>
            </div>
            <div className="bg-[#FEF3F2] border border-red-100 rounded-xl p-3">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[18px] shadow-sm">🛡️</div>
              <p className="font-bold text-[12px] mt-2 text-black">Safe & Local</p>
              <p className="text-[11px] text-gray-600 leading-4 mt-1">Only students from your campus see your posts</p>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 mt-4">
          <h2 className="font-black text-[15px] text-black">How It Works</h2>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-black text-white p-3 rounded-xl text-center">
              <div className="text-[22px]">1️⃣</div>
              <p className="font-black text-[12px] mt-1">Post</p>
              <p className="text-[10px] text-white/70 mt-1">Tap + to sell</p>
            </div>
            <div className="bg-[#8B4513] text-white p-3 rounded-xl text-center">
              <div className="text-[22px]">2️⃣</div>
              <p className="font-black text-[12px] mt-1">Chat</p>
              <p className="text-[10px] text-white/70 mt-1">WhatsApp buyer</p>
            </div>
            <div className="bg-white border-2 border-black p-3 rounded-xl text-center">
              <div className="text-[22px]">3️⃣</div>
              <p className="font-black text-[12px] mt-1 text-black">Sell</p>
              <p className="text-[10px] text-gray-600 mt-1">Meet on campus</p>
            </div>
          </div>
        </div>

        <Link href="/sell" className="block w-full bg-black text-white py-4 rounded-full text-center font-black text-[14px] mt-5 shadow-lg active:scale-[0.98] transition">
          Start your online SHOP with us →
        </Link>

        <p className="text-center text-[10px] text-gray-400 mt-4 pb-6">All Rights Reserved © {new Date().getFullYear()} Sanel Ug • Campus Marketplace</p>
      </div>
    </main>
  );
}