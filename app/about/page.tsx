import Link from 'next/link';

export default function About() {
          return (
                    <main className="min-h-screen bg-gray-100 p-4 pb-20">
                              <Link href="/" className="text-indigo-600 font-semibold">← Back</Link>

                              <div className="bg-white rounded-lg shadow p-6 mt-4">
                                        <div className="text-center mb-6">
                                                  <div className="text-5xl mb-2">🎓</div>
                                                  <h1 className="text-3xl font-bold text-indigo-600">Sanel Campus Market</h1>
                                                  <p className="text-gray-600">Buy & Sell on Campus</p>
                                        </div>

                                        <div className="space-y-4 text-gray-700">
                                                  <h2 className="text-xl font-bold">What is Sanel?</h2>
                                                  <p>
                                                            Sanel is a student-to-student marketplace made for campus life.
                                                            Sell your textbooks, laptops, furniture, clothes, and hostel items.
                                                            Find deals from other students near you without leaving campus.
                                                  </p>

                                                  <h2 className="text-xl font-bold mt-6">Why Students Love It</h2>
                                                  <ul className="list-disc pl-5 space-y-2">
                                                            <li><b>No Commission:</b> 100% of your sale money is yours</li>
                                                            <li><b>Meet on Campus:</b> Exchange items at library, hostel, or lecture rooms</li>
                                                            <li><b>WhatsApp Direct:</b> Chat with buyers/sellers instantly</li>
                                                            <li><b>Safe & Local:</b> Only students from your campus can see your posts</li>
                                                  </ul>

                                                  <h2 className="text-xl font-bold mt-6">How It Works</h2>
                                                  <div className="grid grid-cols-3 gap-2 text-center">
                                                            <div className="bg-indigo-50 p-3 rounded">
                                                                      <div className="text-2xl">1️⃣</div>
                                                                      <p className="text-sm font-semibold">Post</p>
                                                                      <p className="text-xs">Tap + to sell</p>
                                                            </div>
                                                            <div className="bg-indigo-50 p-3 rounded">
                                                                      <div className="text-2xl">2️⃣</div>
                                                                      <p className="text-sm font-semibold">Chat</p>
                                                                      <p className="text-xs">WhatsApp buyer</p>
                                                            </div>
                                                            <div className="bg-indigo-50 p-3 rounded">
                                                                      <div className="text-2xl">3️⃣</div>
                                                                      <p className="text-sm font-semibold">Sell</p>
                                                                      <p className="text-xs">Meet on campus or anywhere near campus</p>
                                                            </div>
                                                  </div>

                                                  <Link href="/sell" className="block w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg text-center font-semibold mt-6">
                                                            Start your online SHOP with us
                                                  </Link>
                                        </div>
                              </div>
                    </main>
          );
}