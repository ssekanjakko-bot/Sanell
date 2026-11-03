import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let { phone, amount, productId } = body

    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 })

    // FIX: Accept 0706826774 AND 256706826774
    let msisdn = phone.toString().replace(/\D/g, "")
    if (msisdn.startsWith("0")) {
      msisdn = "256" + msisdn.slice(1)
    }
    if (msisdn.length === 9) {
      msisdn = "256" + msisdn
    }
    if (!/^256\d{9}$/.test(msisdn)) {
      return NextResponse.json({ error: "Invalid number, use 0706826774 or 256706826774" }, { status: 400 })
    }

    if (!process.env.TAVUPAY_EP_KEY) {
      return NextResponse.json({ error: "TAVUPAY_EP_KEY missing in Vercel" }, { status: 500 })
    }

    const res = await fetch("https://api.tavupay.com/v1/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.TAVUPAY_EP_KEY}`,
      },
      body: JSON.stringify({
        amount: Number(amount),
        msisdn: msisdn,
        reference: productId,
        description: `Boost ${productId}`,
        callback_url: `https://sanel-ug.online/api/tavupay/webhook`,
      }),
    })

    const data = await res.json()
    
    if (!res.ok) {
      console.log("TAVUPAY ERROR:", data)
      return NextResponse.json({ error: data.message || JSON.stringify(data) }, { status: 400 })
    }

    return NextResponse.json({ ok: true, ...data, msisdn })

  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}