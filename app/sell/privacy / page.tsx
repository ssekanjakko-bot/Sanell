export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-4">Privacy Policy - Sanel Uganda</h1>
        <p className="text-sm text-gray-500 mb-6">Last Updated: July 2026</p>
        
        <div className="space-y-4 text-gray-700">
          <p><strong>1. Information We Collect</strong><br/>
          We collect: Name, Email, Phone Number, and Product details when you sign up as a seller on sanel-ug.online. This data is stored securely in Firebase.</p>
          
          <p><strong>2. How We Use Your Data</strong><br/>
          Your data is used only to manage your seller account, process listings, and contact you about your products. We do not sell your data to third parties.</p>
          
          <p><strong>3. Data Security</strong><br/>
          All data is encrypted and protected. We use Firebase Authentication and Firestore with strict security rules.</p>
          
          <p><strong>4. Contact Us</strong><br/>
          For privacy questions: support@sanel-ug.online | Kampala, Uganda</p>
        </div>
      </div>
    </div>
  )
}