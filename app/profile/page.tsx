'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Profile() {
          const [listings, setListings] = useState<any[]>([]);
          const router = useRouter();

          useEffect(() => {
                    setListings(JSON.parse(localStorage.getItem('sanel_listings') || '[]'));
          }, []);

          const handleDelete = (slug: string) => {
                    if (confirm("Delete this listing?")) {
                              const updated = listings.filter((l: any) => l.slug !== slug);
                              localStorage.setItem('sanel_listings', JSON.stringify(updated));
                              setListings(updated);
                              router.refresh();
                    }
          };

          return (
                    <main className="min-h-screen bg-gray-100 pb-20">
                              <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0">
                                        <div className="px-4 py-3 flex items-center gap-4">
                                                  <Link href="/" className="text-2xl text-gray-700">←</Link>
                                                  <h1 className="text-xl font-bold text-gray-900">My Ads</h1>
                                        </div>
                              </header>

                              <div className="max-w-2xl mx-auto p-4">
                                        {listings.length === 0 ? (
                                                  <div className="bg-white p-6 rounded-lg text-center">
                                                            <p className="text-gray-500 mb-4">You have no active listings</p>
                                                            <Link href="/sell" className="bg-gray-900 text-white px-6 py-2 rounded-md">Post Your First Ad</Link>
                                                  </div>
                                        ) : (
                                                  <div className="space-y-3">
                                                            {listings.map((item, i) => (
                                                                      <div key={`${item.slug}-${i}`} className="bg-white rounded-lg border-gray-200 p-3 flex gap-3">
                                                                                <img src={item.images[0]} className="w-24 h-24 object-cover rounded" />
                                                                                <div className="flex-1">
                                                                                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                                                                          <p className="text-sm font-bold">UGX {item.price}</p>
                                                                                          <p className="text-xs text-gray-500">{item.posted}</p>
                                                                                          <div className="flex gap-2 mt-2">
                                                                                                    <Link href={`/sell?edit=${item.slug}`} className="bg-gray-800 text-white px-3 py-1 text-sm rounded-md">Edit</Link>
                                                                                                    <button onClick={() => handleDelete(item.slug)} className="bg-red-600 text-white px-3 py-1 text-sm rounded-md">Delete</button>
                                                                                                    <Link href={`/product/${item.slug}`} className="bg-gray-100 text-gray-800 px-3 py-1 text-sm rounded-md">View</Link>
                                                                                          </div>
                                                                                </div>
                                                                      </div>
                                                            ))}
                                                  </div>
                                        )}
                              </div>

                              <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white border-t border-gray-700">
                                        <div className="flex justify-around py-2">
                                                  <Link href="/" className="flex flex-col items-center text-xs text-gray-400"><span className="text-2xl">⬆️</span>Home</Link>
                                                  <Link href="/coins" className="flex flex-col items-center text-xs text-gray-400"><span className="text-2xl">⭕</span>Coins</Link>
                                                  <Link href="/sell" className="flex flex-col items-center text-xs"><span className="text-3xl bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center -mt-3 border-2 border-gray-900">+</span>Sell</Link>
                                                  <Link href="/inbox" className="flex flex-col items-center text-xs text-gray-400"><span className="text-2xl">✉️</span>Inbox</Link>
                                                  <Link href="/profile" className="flex flex-col items-center text-xs text-white"><span className="text-2xl">👤</span>Profile</Link>
                                        </div>
                              </nav>
                    </main>
          );
}