import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('REAL WEBHOOK FROM RELWORX:', body)

    // Relworx sends: { reference, status, msisdn, amount }
    const reference = body.reference || body.request_reference
    const status = body.status

    // ONLY boost if PIN entered and status SUCCESS
    if ((status === 'SUCCESS' || status === 'COMPLETED') && reference?.startsWith('BOOST-')) {
      // reference format: BOOST-productId-timestamp
      const parts = reference.split('-')
      const productId = parts[1]
      
      if (productId) {
        const now = new Date()
        // Get days from Firestore? For now assume 1 day, you can store it
        const until = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
        
        // Update product to trending - REAL BOOST AFTER PIN
        await updateDoc(doc(db, 'products', productId), {
          is_boosted: true,
          boosted_at: Timestamp.fromDate(now),
          boosted_until: Timestamp.fromDate(until),
          boostDurationDays: 1,
          boostPaymentRef: reference
        })
        console.log(`Product ${productId} boosted to Trending after real payment`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('Webhook error:', e)
    return NextResponse.json({ received: true }) // Always return 200 so Relworx doesn't retry forever
  }
}