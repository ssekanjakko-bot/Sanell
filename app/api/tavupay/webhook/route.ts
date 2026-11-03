import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("WEBHOOK RECEIVED:", JSON.stringify(body))

    // Return 200 immediately so Tavupay doesn't retry fail
    const reference = body.reference || body.custom_ref || body.order_id || body?.data?.reference
    
    if (!reference) {
      console.log("No reference in body")
      return NextResponse.json({ ok: true, msg: "no ref but ack" })
    }

    // Try Firebase - but don't crash if env missing
    try {
      const { initializeApp, cert, getApps } = await import("firebase-admin/app")
      const { getFirestore } = await import("firebase-admin/firestore")
      
      let serviceAccount
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT!
      try {
        serviceAccount = JSON.parse(raw)
      } catch {
        // If user pasted with \n, try second parse
        serviceAccount = JSON.parse(raw.replace(/\n/g, '\\n'))
      }

      if (!getApps().length) {
        initializeApp({ credential: cert(serviceAccount) })
      }
      
      const db = getFirestore()
      const snap = await db.collection('boost_requests').where('paymentRef', '==', reference).get()
      
      if (!snap.empty) {
        const doc = snap.docs[0]
        const data = doc.data()
        await doc.ref.update({ status: 'paid', paymentStatus: 'success', paidAt: new Date() })
        
        const until = new Date()
        until.setDate(until.getDate() + (data.durationDays || 3))
        
        await db.collection('products').doc(data.productId).update({
          is_boosted: true,
          boosted_at: new Date(),
          boosted_until: until,
          boost_pending: false,
        })
        console.log("BOOSTED:", data.productId)
      } else {
        console.log("No boost_request found for", reference)
      }
    } catch (firebaseError: any) {
      console.error("FIREBASE ERROR (but webhook ack):", firebaseError.message)
      // Still return OK so Tavupay stops retrying
    }

    return NextResponse.json({ ok: true })
  } catch (e:any) {
    console.error("WEBHOOK CRITICAL:", e.message)
    return NextResponse.json({ ok: true }) // Always 200
  }
}

export async function GET() {
  return NextResponse.json({ ok: "webhook live" })
}