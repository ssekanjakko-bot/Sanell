export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-100 min-h-screen pb-20"> {/* pb-20 for bottom nav */}
      {children}

      {/* BOTTOM NAV - ONLY FOR CHAT PAGES */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          <a href="/" className="flex flex-col items-center py-2 px-4 text-gray-500">
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-semibold">Home</span>
          </a>
          <a href="/products" className="flex flex-col items-center py-2 px-4 text-gray-500">
            <span className="text-2xl">🛍️</span>
            <span className="text-xs font-semibold">Market</span>
          </a>
          <a href="/chat" className="flex flex-col items-center py-2 px-4 text-blue-600">
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-semibold">Pulse</span>
          </a>
          <a href="/profile" className="flex flex-col items-center py-2 px-4 text-gray-500">
            <span className="text-2xl">👤</span>
            <span className="text-xs font-semibold">Profile</span>
          </a>
        </div>
      </div>
    </div>
  );
}