import Link from 'next/link';
export default function Support() {
          return (
                    <main className="min-h-screen bg-gray-100 p-4">
                              <Link href="/" className="text-indigo-600 font-semibold">← Back</Link>
                              <div className="bg-white rounded-lg shadow p-6 mt-4">
                                        <h1 className="text-2xl font-bold mb-4">💬 Support</h1>
                                        <p className="text-gray-600 mb-4">Need help? Contact us</p>
                                        <a href="https://wa.me/256706826774" target="0706826774" className="block bg-green-500 text-white p-3 rounded text-center mb-3">WhatsApp Us</a>
                                        <a href="mailto:support@sanel.com" className="block bg-indigo-600 text-white p-3 rounded text-center">Email Support</a>
                              </div>
                    </main>
          );
}