'use client';
import { useParams, useRouter } from "next/navigation";

export default function CategoryPage() {
          const params = useParams();
          const router = useRouter();
          const category = params.category as string;

          // Make it look nice: "hostels-&-rentals" -> "Hostels & Rentals"
          const title = category
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                    .replace(' & ', ' & ');

          return (
                    <main className="min-h-screen bg-gray-100">
                              <header className="bg-white shadow-sm p-4 flex items-center gap-3">
                                        <button onClick={() => router.push('/')} className="text-2xl">←</button>
                                        <h1 className="text-xl font-bold">{title}</h1>
                              </header>

                              <div className="p-6">
                                        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                                                  <div className="text-6xl mb-4">📦</div>
                                                  <h2 className="text-2xl font-bold mb-2">{title}</h2>
                                                  <p className="text-gray-600">No listings in {title} yet.</p>
                                                  <button
                                                            onClick={() => router.push('/sell')}
                                                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                  >
                                                            Post First Item
                                                  </button>
                                        </div>
                              </div>
                    </main>
          );
}