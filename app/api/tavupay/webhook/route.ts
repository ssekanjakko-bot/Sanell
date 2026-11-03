import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("WEBHOOK:", body)
    const reference = body.reference || body.custom_ref || body.order_id || body?.data?.reference
    
    if (!reference) return NextResponse.json({ ok: true })

    // Only init firebase if env exists
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const admin = await import("firebase-admin")
      if (!admin.apps.length) {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        sa.private_key = sa.private_key?.replace(/\\n/g, '\n')
        admin.initializeApp({ credential: admin.credential.cert(sa) })
      }
      const db = admin.firestore()
      const snap = await db.collection('boost_requests').where('paymentRef','==', reference).get()
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
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ ok: "webhook live" })
}