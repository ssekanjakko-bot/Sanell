import Link from 'next/link';
export default function Stores() {
          return (
                    <main className="min-h-screen bg-gray-100 p-4">
                              <Link href="/" className="text-indigo-600 font-semibold">← Back</Link>
                              <div className="bg-white rounded-lg shadow p-6 mt-4">
                                        <h1 className="text-2xl font-bold mb-4">🏪 All Stores</h1>
                                        <p className="text-gray-600">Browse verified sellers near you</p>
                              </div>
                    </main>
          );
}