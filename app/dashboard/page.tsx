'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const PAYMENT_NUMBER = '+256712345678';
const SUBSCRIPTION_FEE = 7000; // UGX
const TRIAL_DAYS = 5;

type MediaType = 'image' | 'video';

type Product = {
          id: number;
          title: string;
          price: number; // UGX
          description: string;
          category: string;
          whatsappNumber: string; // New: freelancer's whatsapp
          mediaType: MediaType;
          mediaUrl: string;
          status: 'active' | 'hidden';
          createdAt: string;
};

const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Services'];

const formatUGX = (amount: number) => {
          return `UGX ${amount.toLocaleString('en-UG')}`;
};

export default function DashboardPage() {
          const [trialStart, setTrialStart] = useState<string | null>(null);
          const [lastPayment, setLastPayment] = useState<string | null>(null);
          const [transactionId, setTransactionId] = useState('');
          const [products, setProducts] = useState<Product[]>([]);
          const [showPostForm, setShowPostForm] = useState(false);
          const [mediaFile, setMediaFile] = useState<File | null>(null);
          const [mediaPreview, setMediaPreview] = useState<string | null>(null);
          const [mediaType, setMediaType] = useState<MediaType>('image');
          const fileInputRef = useRef<HTMLInputElement>(null);

          useEffect(() => {
                    const storedTrial = localStorage.getItem('trialStart');
                    const storedPayment = localStorage.getItem('lastPayment');
                    const storedProducts = JSON.parse(localStorage.getItem('myProducts') || '[]');

                    if (!storedTrial) {
                              const now = new Date().toISOString();
                              localStorage.setItem('trialStart', now);
                              setTrialStart(now);
                    } else {
                              setTrialStart(storedTrial);
                    }
                    setLastPayment(storedPayment);
                    setProducts(storedProducts);
          }, []);

          const daysSinceTrial = trialStart ? Math.floor((Date.now() - new Date(trialStart).getTime()) / (1000 * 60 * 60 * 24)) : 0;
          const daysLeft = TRIAL_DAYS - daysSinceTrial;

          const isTrialActive = daysLeft > 0 && !lastPayment;
          const isSubscribed = lastPayment !== null;
          const canPost = isTrialActive || isSubscribed;

          const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setMediaFile(file);
                    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
                    const reader = new FileReader();
                    reader.onload = (event) => setMediaPreview(event.target?.result as string);
                    reader.readAsDataURL(file);
          };

          const handleSubscribe = () => {
                    if (!transactionId.trim()) {
                              alert('Enter your transaction ID first');
                              return;
                    }
                    const now = new Date().toISOString();
                    localStorage.setItem('lastPayment', now);
                    localStorage.setItem('transactionId', transactionId);
                    setLastPayment(now);
                    alert(`Payment confirmed! TXN: ${transactionId}. You can now post products.`);
          };

          const handlePostProduct = (e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    if (!canPost) {
                              alert('Subscribe first to post products');
                              return;
                    }
                    if (!mediaPreview) {
                              alert('Upload a photo or video first');
                              return;
                    }

                    const form = e.currentTarget;
                    const rawNumber = (form.elements.namedItem('whatsapp') as HTMLInputElement).value;
                    // Strip + and spaces for wa.me link. Ex: +256701234567 -> 256701234567
                    const cleanNumber = rawNumber.replace(/\D/g, '');

                    if (cleanNumber.length < 10) {
                              alert('Enter a valid WhatsApp number with country code, ex: 256701234567');
                              return;
                    }

                    const newProduct: Product = {
                              id: Date.now(),
                              title: (form.elements.namedItem('title') as HTMLInputElement).value,
                              price: Number((form.elements.namedItem('price') as HTMLInputElement).value),
                              description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
                              category: (form.elements.namedItem('category') as HTMLSelectElement).value,
                              whatsappNumber: cleanNumber,
                              mediaType,
                              mediaUrl: mediaPreview,
                              status: isSubscribed ? 'active' : 'active',
                              createdAt: new Date().toISOString()
                    };

                    const updated = [newProduct, ...products];
                    setProducts(updated);
                    localStorage.setItem('myProducts', JSON.stringify(updated));

                    form.reset();
                    setMediaFile(null);
                    setMediaPreview(null);
                    setShowPostForm(false);
          };

          const visibleProducts = isSubscribed || isTrialActive ? products : products.map(p => ({ ...p, status: 'hidden' as const }));

          return (
                    <main className="min-h-screen bg-gray-100 p-6">
                              <div className="max-w-6xl mx-auto">
                                        <div className="flex justify-between items-center mb-6">
                                                  <h1 className="text-3xl font-bold">Freelancer Dashboard</h1>
                                                  <Link href="/" className="text-indigo-600">← Back to Market</Link>
                                        </div>

                                        <div className="bg-white p-6 rounded-lg shadow mb-6">
                                                  <h2 className="text-xl font-bold mb-4">Subscription</h2>
                                                  {isSubscribed ? (
                                                            <p className="text-green-600 font-semibold">✓ Active Subscription</p>
                                                  ) : isTrialActive ? (
                                                            <p className="text-orange-600 font-semibold">Trial: {daysLeft} days left</p>
                                                  ) : (
                                                            <p className="text-red-600 font-semibold">Subscription Expired - Products Hidden</p>
                                                  )}
                                                  <div className="mt-4 border-t pt-4">
                                                            <p className="mb-2">Send <span className="font-bold">{formatUGX(SUBSCRIPTION_FEE)}</span> to:</p>
                                                            <p className="text-lg font-mono bg-gray-100 p-2 rounded">{PAYMENT_NUMBER}</p>
                                                            <div className="flex gap-2 mt-3">
                                                                      <input
                                                                                type="text"
                                                                                placeholder="Enter Transaction ID"
                                                                                value={transactionId}
                                                                                onChange={e => setTransactionId(e.target.value)}
                                                                                className="flex-1 p-2 border rounded"
                                                                                disabled={isSubscribed}
                                                                      />
                                                                      <button
                                                                                onClick={handleSubscribe}
                                                                                disabled={isSubscribed}
                                                                                className="bg-indigo-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
                                                                      >
                                                                                {isSubscribed ? 'Paid' : 'Confirm Payment'}
                                                                      </button>
                                                            </div>
                                                  </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-lg shadow">
                                                  <div className="flex justify-between items-center mb-6">
                                                            <h2 className="text-xl font-bold">My Listings {products.length > 0 && `(${products.length})`}</h2>
                                                            <button
                                                                      onClick={() => setShowPostForm(!showPostForm)}
                                                                      disabled={!canPost}
                                                                      className="bg-indigo-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
                                                            >
                                                                      {canPost ? '+ Post New Item' : 'Subscribe to Post'}
                                                            </button>
                                                  </div>

                                                  {showPostForm && canPost && (
                                                            <form onSubmit={handlePostProduct} className="mb-8 p-4 border rounded-lg bg-gray-50">
                                                                      <h3 className="font-bold mb-4">Add New Product</h3>

                                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <input name="title" placeholder="Product Title" className="p-2 border rounded" required />
                                                                                <input name="price" type="number" placeholder="Price in UGX" className="p-2 border rounded" required />
                                                                                <select name="category" className="p-2 border rounded">
                                                                                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                                                                </select>
                                                                                <input
                                                                                          name="whatsapp"
                                                                                          placeholder="WhatsApp: 2567XXXXXXXX"
                                                                                          className="p-2 border rounded"
                                                                                          required
                                                                                />
                                                                      </div>

                                                                      <textarea name="description" placeholder="Description" rows={3} className="w-full p-2 border rounded mt-4" required />

                                                                      <div className="mt-4">
                                                                                <label className="block mb-2 font-semibold">Upload Photo or Video</label>
                                                                                <input
                                                                                          ref={fileInputRef}
                                                                                          type="file"
                                                                                          accept="image/*,video/*"
                                                                                          onChange={handleFileChange}
                                                                                          className="w-full"
                                                                                          required
                                                                                />
                                                                                {mediaPreview && (
                                                                                          <div className="mt-3">
                                                                                                    {mediaType === 'image' ? (
                                                                                                              <img src={mediaPreview} className="w-48 h-48 object-cover rounded border" alt="preview" />
                                                                                                    ) : (
                                                                                                              <video src={mediaPreview} controls className="w-64 h-48 rounded border" />
                                                                                                    )}
                                                                                          </div>
                                                                                )}
                                                                      </div>

                                                                      <button className="bg-green-600 text-white px-6 py-2 rounded mt-4">Post Item</button>
                                                            </form>
                                                  )}

                                                  {visibleProducts.length === 0 ? (
                                                            <p className="text-gray-500 text-center py-8">No products yet. Post your first item!</p>
                                                  ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                      {visibleProducts.map(p => (
                                                                                <div key={p.id} className={`border rounded-lg overflow-hidden ${p.status === 'hidden' ? 'opacity-40' : 'bg-white shadow'}`}>
                                                                                          {p.mediaType === 'image' ? (
                                                                                                    <img src={p.mediaUrl} className="w-full h-48 object-cover" alt={p.title} />
                                                                                          ) : (
                                                                                                    <video src={p.mediaUrl} controls className="w-full h-48 bg-black" />
                                                                                          )}
                                                                                          <div className="p-4">
                                                                                                    <div className="flex justify-between items-start mb-2">
                                                                                                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{p.category}</span>
                                                                                                              <span className={`text-xs px-2 py-1 rounded ${p.status === 'hidden' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                                                                                        {p.status === 'hidden' ? 'Hidden' : 'Active'}
                                                                                                              </span>
                                                                                                    </div>
                                                                                                    <h3 className="font-bold text-lg">{p.title}</h3>
                                                                                                    <p className="text-gray-600 text-sm line-clamp-2">{p.description}</p>
                                                                                                    <p className="text-2xl font-bold text-indigo-600 mt-2">{formatUGX(p.price)}</p>
                                                                                                    <p className="text-xs text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                                                          </div>
                                                                                </div>
                                                                      ))}
                                                            </div>
                                                  )}
                                        </div>
                              </div>
                    </main>
          );
}