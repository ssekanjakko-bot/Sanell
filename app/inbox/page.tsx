import Link from 'next/link';
export default function Inbox() {
          return (
                    <main className="min-h-screen bg-gray-100 p-4 pb-20">
                              <Link href="/" className="text-indigo-600 font-semibold">← Back</Link>
                              <div className="bg-white rounded-lg shadow p-6 mt-4 text-center">
                                        <h1 className="text-2xl font-bold mb-4">✉️ Inbox</h1>
                                        <p className="text-gray-500">No messages yet</p>
                              </div>
                    </main>
          );
}