export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-6">Last Updated: July 2026</p>
        
        <div className="space-y-4 text-gray-700">
          <p><strong>1. Seller Agreement</strong><br/>
          By using Sanel Uganda seller portal, you agree to list only genuine products. No fake, illegal, or stolen items allowed.</p>
          
          <p><strong>2. Account Responsibility</strong><br/>
          You are responsible for your account. Keep your password safe. Sanel Uganda is not liable for account misuse.</p>
          
          <p><strong>3. Product Listings</strong><br/>
          All products must have real photos, correct prices in UGX, and accurate descriptions. We reserve the right to remove any listing.</p>
          
          <p><strong>4. Termination</strong><br/>
          We reserve the right to suspend or terminate accounts that violate these terms without notice.</p>
        </div>
      </div>
    </div>
  )
}