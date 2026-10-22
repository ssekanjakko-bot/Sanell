import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

// --- DB Connection ---
let isConnected = false
async function connectDB() {
  if (isConnected) return
  await mongoose.connect(process.env.MONGODB_URI!)
  isConnected = true
}

// --- Models (adjust to match your schema) ---
const ProductSchema = new mongoose.Schema({
  isBoosted: { type: Boolean, default: false },
  boostEndsAt: Date,
  boostedAt: Date,
  boostPlan: String,
}, { strict: false })

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

// --- Boost Plans ---
const BOOST_PLANS: any = {
  quick: { name: 'Quick Boost', days: 1, amount: 1000 },
  standard: { name: 'Standard Boost', days: 3, amount: 2000, popular: true },
  hustler: { name: 'Hustler King', days: 14, amount: 10000, top3: true },
}

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderId, productId, plan } = await req.json()

    if (!phone || !productId) {
      return NextResponse.json({ message: 'Phone and Product ID required' }, { status: 400 })
    }

    const planKey = (plan || 'standard').toLowerCase()
    const selectedPlan = BOOST_PLANS[planKey] || BOOST_PLANS.standard
    const finalAmount = amount || selectedPlan.amount

    // 1. Request Momo from Relworx
    const relworxRes = await fetch('https://payments.relworx.com/api/mobile-money/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 0575c73fc4e07e.C4dZ5XNPmxIXWYbaymQthA',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        account_no: 'REL370AF83D24',
        reference: orderId || `BOOST-${productId.slice(-5).toUpperCase()}-${Date.now()}`,
        msisdn: String(phone).replace('+', ''),
        amount: Number(finalAmount),
        currency: 'UGX',
      }),
    })

    const text = await relworxRes.text()
    
    // If Relworx still returns HTML, handle it
    if (text.trim().startsWith('<')) {
      console.error('Relworx HTML:', text.slice(0, 300))
      return NextResponse.json({ 
        message: 'Relworx returned HTML. Endpoint may have changed. Contact support.' 
      }, { status: 400 })
    }

    const relworxData = JSON.parse(text)
    
    // Check if Relworx says failed
    if (relworxData.status === false || relworxData.success === false) {
      return NextResponse.json({ 
        message: relworxData.message || 'Momo request failed' 
      }, { status: 400 })
    }

    // 2. Mark Product as Boosted IMMEDIATELY - goes to Trending
    await connectDB()

    const now = new Date()
    const boostEndsAt = new Date(now.getTime() + selectedPlan.days * 24 * 60 * 60 * 1000)

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          isBoosted: true,
          boostedAt: now,
          boostEndsAt: boostEndsAt,
          boostPlan: planKey,
          boostReference: orderId,
          boostAmount: finalAmount,
          // For trending sorting - higher score
          boostScore: selectedPlan.top3 ? 100 : selectedPlan.popular ? 50 : 10,
        }
      },
      { new: true }
    )

    if (!updatedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    // 3. Return success - frontend shows "Momo sent"
    return NextResponse.json({
      success: true,
      message: `Momo request sent to ${phone}! Enter PIN on your phone to pay ${finalAmount} UGX`,
      reference: orderId,
      product: {
        _id: updatedProduct._id,
        isBoosted: true,
        boostEndsAt,
      },
      relworx: relworxData
    })

  } catch (error: any) {
    console.error('Pay API Error:', error)
    return NextResponse.json({ 
      message: error.message || 'Payment failed' 
    }, { status: 500 })
  }
}