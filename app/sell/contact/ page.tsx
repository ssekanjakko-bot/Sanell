import link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-4">Contact Sanel Uganda</h1>
        <div className="bg-amber-50 p-4 rounded-lg space-y-2 text-gray-700">
          <p><strong>Email:</strong> support@sanel-ug.online</p>
          <p><strong>Phone:</strong> +256 7XXXXXXXX</p>
          <p><strong>Location:</strong> Kampala, Uganda</p>
          <p><strong>Hours:</strong> Mon - Sat, 8AM - 6PM</p>
        </div>
        <Link href="/contact" className="text-orange-600 underline mt-6 block">← Back to Seller Login</Link>
      </div>
    </div>
  )
}