import Link from 'next/link';
export default function Coins() {
          return (
                    <main className="min-h-screen bg-gray-100 p-4 pb-20">
                              <Link href="/" className="text-indigo-600 font-semibold">← Back</Link>
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow p-6 mt-4 text-center">
                                        <h1 className="text-3xl font-bold">0 Coins</h1>
                                        <p className="mt-2">Your reward balance</p>
                                        <button className="bg-white text-orange-600 px-6 py-2 rounded-lg mt-4 font-semibold">Buy Coins</button>
                              </div>
                    </main>
          );
}