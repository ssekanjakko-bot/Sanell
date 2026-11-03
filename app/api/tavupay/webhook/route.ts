import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("WEBHOOK:", JSON.stringify(body))

    const reference = body.reference || body.custom_ref || body.order_id || body.meta?.reference || body.data?.reference
    
    if (!reference) {
      return NextResponse.json({ ok: true, msg: "no ref" })
    }

    try {
      const { initializeApp, cert, getApps } = await import("firebase-admin/app")
      const { getFirestore } = await import("firebase-admin/firestore")
      
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT
      if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT missing")

      const serviceAccount = JSON.parse(raw)
      
      // FIX private_key \n issue - this is the main bug
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
      }

      if (!getApps().length) {
        initializeApp({ credential: cert(serviceAccount) })
      }
      
      const db = getFirestore()
      const snap = await db.collection('boost_requests').where('paymentRef', '==', reference).get()
      
      if (!snap.empty) {
        const docRef = snap.docs[0]
        const data = docRef.data()
        await docRef.ref.update({ 
          status: 'paid', 
          paymentStatus: 'success', 
          paidAt: new Date(),
          webhookBody: body
        })
        
        const until = new Date()
        until.setDate(until.getDate() + (data.durationDays || 3))
        
        await db.collection('products').doc(data.productId).update({
          is_boosted: true,
          boosted_at: new Date(),
          boosted_until: until,
          boost_pending: false,
        })
        console.log("BOOSTED OK:", data.productId)
      } else {
        console.log("No boost_request for:", reference)
      }
    } catch (firebaseError: any) {
      console.error("FIREBASE FAIL:", firebaseError.message)
    }

    return NextResponse.json({ ok: true })
  } catch (e:any) {
    console.error("WEBHOOK FAIL:", e.message)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ ok: "webhook live" })
}