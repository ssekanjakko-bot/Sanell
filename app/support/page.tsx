import Link from 'next/link';

export default function Support() {
  const MY_EMAIL = "melvinsseka01@gmail.com"; // <-- PUT YOUR REAL GMAIL HERE
  const MY_WHATSAPP = "256706826774";
  return (
    <main className="min-h-screen bg-[#FDF8F3]">
      <div className="bg-white sticky top-0 z-10 shadow-sm p-3 flex items-center gap-3">
        <Link href="/" className="bg-black text-white w-9 h-9 rounded-full flex items-center justify-center">←</Link>
        <span className="font-bold text-[16px]" style={{color: '#8B4513'}}>Support</span>
      </div>
      <div className="p-3">
        <div className="bg-gradient-to-br from-black to-[#8B4513] rounded-[20px] p-6 text-white">
          <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center text-[24px]">💬</div>
          <h1 className="text-[24px] font-black mt-3">Need help?</h1>
          <p className="text-white/70 text-[13px] mt-1">We reply in less than 10 mins</p>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-4 mt-4 space-y-3">
          <a href={`https://wa.me/${MY_WHATSAPP}`} target="_blank" className="flex items-center gap-3 bg-[#F0FDF4] border border-green-100 rounded-xl p-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-[22px]">💬</div>
            <div className="flex-1">
              <p className="font-bold text-[13px] text-black">WhatsApp Us</p>
              <p className="text-[11px] text-gray-600">{MY_WHATSAPP}</p>
            </div>
            <span className="bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full">CHAT</span>
          </a>
          <a href={`mailto:${MY_EMAIL}`} className="flex items-center gap-3 bg-[#FFF7ED] border border-orange-100 rounded-xl p-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">✉️</div>
            <div className="flex-1">
              <p className="font-bold text-[13px] text-black">Email Us</p>
              <p className="text-[11px] text-gray-600">{MY_EMAIL}</p>
            </div>
            <span className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-full">SEND</span>
          </a>
        </div>
      </div>
    </main>
  );
}