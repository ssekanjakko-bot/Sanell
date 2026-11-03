import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let { phone, amount, productId, durationDays } = body

    // FIX: Clean phone - this is what throws "string did not match pattern"
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 })
    
    let msisdn = phone.toString().replace(/\D/g, "") // remove + spaces
    if (msisdn.startsWith("0")) {
      msisdn = "256" + msisdn.slice(1) // 0706826774 -> 256706826774
    }
    if (msisdn.length === 9) {
      msisdn = "256" + msisdn // 706826774 -> 256706826774
    }
    
    // Final validation - must be 12 digits 256XXXXXXXXX
    if (!/^256\d{9}$/.test(msisdn)) {
      return NextResponse.json({ error: `Invalid number format: ${msisdn}, use 256706...` }, { status: 400 })
    }

    const reference = `boost_${productId}_${Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, "_")

    // Call Tavupay
    const res = await fetch("https://api.tavupay.com/v1/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.TAVUPAY_EP_KEY}`,
      },
      body: JSON.stringify({
        amount: Number(amount),
        msisdn: msisdn, // fixed format
        reference: reference,
        description: `Boost ${durationDays} days`,
        callback_url: `https://sanel-ug.online/api/tavupay/webhook`,
      }),
    })

    const data = await res.json()
    
    if (!res.ok) {
      console.log("TAVUPAY FAIL:", data)
      return NextResponse.json({ error: data.message || JSON.stringify(data) }, { status: 400 })
    }

    return NextResponse.json({ ok: true, reference, tavu: data })

  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}