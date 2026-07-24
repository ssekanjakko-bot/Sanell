

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-6">Last Updated: July 2026</p>

        <div className="space-y-4 text-gray-700">
          <p><strong>1. Seller Agreement</strong><br/>
          By using Sanel Uganda seller portal, you agree to sell only genuine products.</p>

          <p><strong>2. Account Responsibility</strong><br/>
          You are responsible for your account. Do not share your password.</p>

          <p><strong>3. Product Listings</strong><br/>
          All products must have real photos, accurate prices, and correct descriptions.</p>

          <p><strong>4. Termination</strong><br/>
          We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </div>

        <Link href="/sell" className="text-orange-600 underline mt-6 block">← Back to Seller Login</Link> 
      </div>
    </div>
  )
}