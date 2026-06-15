import Link from 'next/link';
export default function Tools() {
          return (
                    <main className="min-h-screen bg-gray-100 p-4">
                              <Link href="/" className="text-indigo-600 font-semibold">← Back</Link>
                              <div className="bg-white rounded-lg shadow p-6 mt-4">
                                        <h1 className="text-2xl font-bold mb-4">🛠️ Tools</h1>
                                        <div className="space-y-3">
                                                  <button className="w-full bg-gray-100 p-3 rounded text-left">Price Checker</button>
                                                  <button className="w-full bg-gray-100 p-3 rounded text-left">Loan Calculator</button>
                                                  <button className="w-full bg-gray-100 p-3 rounded text-left">Shipping Rates</button>
                                        </div>
                              </div>
                    </main>
          );
}