import { NextRequest, NextResponse } from "next/server"
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

function getDb() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)
    initializeApp({ credential: cert(serviceAccount) })
  }
  return getFirestore()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("TAVUPAY WEBHOOK:", body)
    
    const reference = body.reference || body.custom_ref || body.order_id || body.meta?.reference
    const isSuccess = body.status === 'success' || body.payment_status === 'success' || body.event === 'payment.success'
    
    if (!reference) return NextResponse.json({ ok: false, msg: "no ref" })

    if (isSuccess) {
      const db = getDb()
      const snap = await db.collection('boost_requests').where('paymentRef', '==', reference).get()
      
      if (!snap.empty) {
        const doc = snap.docs[0]
        const data = doc.data()
        
        await doc.ref.update({ status: 'paid', paymentStatus: 'success', paidAt: new Date() })
        
        const duration = data.durationDays || 3
        const until = new Date()
        until.setDate(until.getDate() + duration)
        
        await db.collection('products').doc(data.productId).update({
          is_boosted: true,
          boosted_at: new Date(),
          boosted_until: until,
          boost_pending: false,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: "webhook live" })
}