'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function Product() {
          const params = useParams();
          const [product, setProduct] = useState<any>(null);

          useEffect(() => {
                    const listings = JSON.parse(localStorage.getItem('sanel_listings') || '[]');
                    const found = listings.find((p: any) => p.slug === params.slug);
                    setProduct(found);
          }, [params.slug]);

          if (!product) return <main className="p-6">Loading...</main>;

          const whatsappNumber = product.whatsapp.replace(/\D/g, '');
          const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hi, I'm interested in ${product.title} on Sanel Ug`;

          return (
                    <main className="min-h-screen bg-gray-100 pb-24">
                              <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                                        <div className="px-4 py-3 flex items-center gap-4">
                                                  <Link href="/" className="text-2xl text-gray-700">←</Link>
                                                  <h1 className="text-lg font-semibold text-gray-900 truncate">Sanel Ug</h1>
                                        </div>
                              </header>

                              <div className="bg-black">
                                        <div className="relative w-full h-96">
                                                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex gap-1 p-2 bg-black overflow-x-auto">
                                                  {product.images.map((img: string, i: number) => (
                                                            <img key={i} src={img} className="h-16 w-16 object-cover rounded border-2 border-white" alt="" />
                                                  ))}
                                        </div>
                                        {product.videos?.length > 0 && (
                                                  <div className="p-2 bg-black">
                                                            <video src={product.videos[0]} controls className="w-full rounded" />
                                                  </div>
                                        )}
                              </div>

                              <div className="bg-white p-4 mt-2 border-b border-gray-200">
                                        <p className="text-3xl font-bold text-gray-900">UGX {product.price}</p>
                                        <h2 className="text-xl font-semibold text-gray-900 mt-1">{product.title}</h2>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                                  <span>📍 {product.location}</span><span>•</span><span>{product.posted}</span>
                                        </div>
                              </div>

                              <div className="bg-white p-4 mt-2 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl">👤</div>
                                                            <div>
                                                                      <p className="font-semibold text-gray-900">{product.seller}</p>
                                                                      <p className="text-xs text-gray-500">{product.whatsapp}</p>
                                                            </div>
                                                  </div>
                                                  <Link href={whatsappLink} target="_blank" className="bg-green-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-green-700">
                                                            WhatsApp
                                                  </Link>
                                        </div>
                              </div>

                              <div className="bg-white p-4 mt-2">
                                        <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                              </div>

                              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-3">
                                        <Link href={whatsappLink} target="_blank" className="flex-1 bg-gray-900 text-white py-3 rounded-md font-semibold text-center hover:bg-black">
                                                  Call / WhatsApp
                                        </Link>
                                        <button className="px-6 bg-white border-gray-300 text-gray-800 py-3 rounded-md font-semibold">Chat</button>
                              </div>
                    </main>
          );
}