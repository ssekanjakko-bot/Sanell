import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Tavupay sends: { reference, status: 'success', transaction_id }
  
  if(body.status === 'success' || body.status === 'completed') {
    const ref = body.reference // BOOST-XXXX-123456
    const productId = ref.split('-')[1] // extract if you need
    
    // Find product by paymentRef and activate boost
    // We store boost_pending_paymentRef = reference
    // You will need to query boost_requests then update products
    // Simplified: client will handle activation after status check
  }

  return NextResponse.json({ received: true })
}