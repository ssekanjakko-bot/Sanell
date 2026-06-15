'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const formatUGX = (amount: number) => `UGX ${amount.toLocaleString('en-UG')}`;

const ALL_PRODUCTS = [
          { id: 1, title: 'iPhone 14 Pro', price: 4200000, image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400', location: 'Kampala', category: 'phones' },
          { id: 2, title: 'Toyota RAV4', price: 85000000, image: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=400', location: 'Entebbe', category: 'vehicles' },
          { id: 3, title: 'Single Room', price: 350000, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b9d8?w=400', location: 'Makerere', category: 'property' },
          { id: 4, title: 'Samsung TV 55"', price: 1800000, image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400', location: 'Ntinda', category: 'electronics' },
          { id: 5, title: 'Sofa Set', price: 1200000, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', location: 'Nakawa', category: 'home' },
          { id: 6, title: 'Vitamin C', price: 25000, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2e3?w=400', location: 'Mulago', category: 'health' },
          { id: 7, title: 'Denim Jacket', price: 80000, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', location: 'Kampala', category: 'fashion' },
          { id: 8, title: 'Football', price: 45000, image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400', location: 'Makerere', category: 'sports' },
];

const CATEGORY_NAMES: Record<string, string> = {
          vehicles: 'Vehicles',
          phones: 'Phones',
          property: 'Property',
          electronics: 'Electronics',
          home: 'Home, Furniture & Appliances',
          health: 'Health',
          fashion: 'Fashion',
          sports: 'Sports, Arts & Outdoor',
          babies: 'Babies & Kids',
          pets: 'Animals & Pets',
          agriculture: 'Agriculture & Food',
          commercial: 'Commercial Equipment & Tools',
          repair: 'Repair & Construction',
          stationery: 'Stationery',
          services: 'Services',
          jobs: 'Jobs',
};

export default function CategoryPage() {
          const params = useParams();
          const slug = params.slug as string;

          const categoryName = CATEGORY_NAMES[slug] || 'Category';
          const products = ALL_PRODUCTS.filter(p => p.category === slug);

          return (
                    <main className="min-h-screen bg-gray-100 pb-20">
                              <header className="bg-white sticky top-0 z-20 shadow-sm p-3">
                                        <div className="flex items-center gap-3">
                                                  <Link href="/" className="text-2xl">←</Link>
                                                  <h1 className="text-xl font-bold">{categoryName}</h1>
                                        </div>
                              </header>

                              <section className="p-3">
                                        {products.length > 0 ? (
                                                  <div className="grid grid-cols-2 gap-3">
                                                            {products.map(product => (
                                                                      <Link href={`/product/${product.id}`} key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                                                                <img src={product.image} alt={product.title} className="w-full h-32 object-cover" />
                                                                                <div className="p-2">
                                                                                          <h3 className="text-sm font-semibold truncate">{product.title}</h3>
                                                                                          <p className="text-indigo-600 font-bold text-sm">{formatUGX(product.price)}</p>
                                                                                          <p className="text-xs text-gray-500">{product.location}</p>
                                                                                </div>
                                                                      </Link>
                                                            ))}
                                                  </div>
                                        ) : (
                                                  <div className="bg-white rounded-lg shadow p-8 text-center mt-4">
                                                            <div className="text-5xl mb-3">📦</div>
                                                            <h2 className="text-lg font-bold">No items in {categoryName} yet</h2>
                                                            <p className="text-gray-500 text-sm mt-2">Be the first to sell!</p>
                                                            <Link href="/sell" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg mt-4 font-semibold">
                                                                      Post in {categoryName}
                                                            </Link>
                                                  </div>
                                        )}
                              </section>

                              {/* Bottom Nav - same as homepage */}
                              <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
                                        <div className="grid grid-cols-5 h-16">
                                                  <Link href="/" className="flex flex-col items-center justify-center text-gray-500">
                                                            <span className="text-2xl">↑</span>
                                                            <span className="text-xs">Home</span>
                                                  </Link>
                                                  <Link href="/coins" className="flex flex-col items-center justify-center text-gray-500">
                                                            <span className="text-2xl">○</span>
                                                            <span className="text-xs">Coins</span>
                                                  </Link>
                                                  <Link href="/sell" className="flex flex-col items-center justify-center -mt-4">
                                                            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">+</div>
                                                            <span className="text-xs text-gray-500 mt-1">Sell</span>
                                                  </Link>
                                                  <Link href="/inbox" className="flex flex-col items-center justify-center text-gray-500">
                                                            <span className="text-2xl">✉️</span>
                                                            <span className="text-xs">Inbox</span>
                                                  </Link>
                                                  <Link href="/profile" className="flex flex-col items-center justify-center text-gray-500">
                                                            <span className="text-2xl">👤</span>
                                                            <span className="text-xs">Profile</span>
                                                  </Link>
                                        </div>
                              </nav>
                    </main>
          );
}