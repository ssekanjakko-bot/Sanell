'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // fetch products from Firebase where title contains query
    // setProducts(results)
  }, [query])

  if(products.length === 0) {
    return <p>No results for "{query}"</p> // instead of Post First Item
  }

  return products.map(p => <ProductCard key={p.id} {...p} />)
} client';
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
                                                  <p className="text-gray-500 mt-4">Check back soon for new items!</p>
                                        </div>
                              </div>
                    </main>
          );
}