import Link from 'next/link';
export default function GetApp() {
          return (
                    <main className="min-h-screen bg-gray-100 p-4">
                              <Link href="/" className="text-indigo-600 font-semibold">← Back</Link>
                              <div className="bg-white rounded-lg shadow p-6 mt-4 text-center">
                                        <h1 className="text-2xl font-bold mb-4">📱 Get the Sanel App</h1>
                                        <p className="text-gray-600 mb-6">Download for faster buying & selling</p>
                                        <button className="bg-black text-white px-6 py-3 rounded-lg w-full mb-3">Download on Play Store</button>
                                        <button className="bg-black text-white px-6 py-3 rounded-lg w-full">Download on App Store</button>
                              </div>
                    </main>
          );
}