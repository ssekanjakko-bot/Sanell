import Link from 'next/link' // <-- ADD THIS LINE 1

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-4">Contact Sanel Uganda</h1>
        
        <div className="space-y-4 text-gray-700">
          <p>We are here to help you with your seller account.</p>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <p><strong>Email:</strong> support@sanel-ug.online</p>
            <p><strong>Phone:</strong> +256 7XXXXXXXX</p>
            <p><strong>Location:</strong> Kampala, Uganda</p>
            <p><strong>Business Hours:</strong> Mon - Sat, 8AM - 6PM</p>
          </div>
          
          <p><strong>For Sellers:</strong> Questions about listings, payments, or account issues.</p>
          <p><strong>For Buyers:</strong> Contact the seller directly through the product page on sanel-ug.online</p>
        </div>

        <Link href="/sell" className="text-orange-600 underline mt-6 block">← Back to Seller Login</Link> // <-- ADD THIS LAST LINE
      </div>
    </div>
  )
}