import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Init Firebase Admin (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: 'sanel-ug.firebasestorage.app',
  })
}

const db = getFirestore()

export async function POST(req: NextRequest) {
  try {
    const { productId, plan } = await req.json()
    
    if (!productId) {
      return NextResponse.json({ message: 'productId required' }, { status: 400 })
    }

    const days = plan === 'quick' ? 1 : plan === 'hustler' ? 14 : 3
    const now = new Date()
    const boostEndsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    // Update product in Firestore - products collection
    await db.collection('products').doc(productId).update({
      isBoosted: true,
      boostedAt: now,
      boostEndsAt: boostEndsAt,
      boostPlan: plan || 'standard',
      boostScore: plan === 'hustler' ? 100 : 50,
      updatedAt: now,
    })

    return NextResponse.json({ 
      success: true, 
      message: `Boosted for ${days} days, now in Trending`
    })

  } catch (e: any) {
    console.error('Firebase boost error:', e)
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}