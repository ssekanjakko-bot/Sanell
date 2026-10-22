import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderId } = await req.json()

    let msisdn = String(phone).replace(/\D/g, '')
    if (msisdn.startsWith('0')) msisdn = '256' + msisdn.slice(1)
    if (!msisdn.startsWith('256')) msisdn = '256' + msisdn
    msisdn = '+' + msisdn // Relworx wants +256...

    const payload = {
      account_no: 'REL370AF83D24', // GO TO DASHBOARD AND COPY REAL LIVE ACCOUNT_NO HERE
      reference: orderId,
      msisdn: msisdn,
      amount: Number(amount),
      currency: 'UGX',
      description: `Sanel Boost ${orderId}`
    }

    const res = await fetch('https://payments.relworx.com/api/mobile-money/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer 0575c73fc4e07e.C4dZ5XNPmxIXWYbaymQthA`,
      },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { 
      return NextResponse.json({ message: `Relworx error ${res.status}: ${text.slice(0,300)} - Check your account_no in dashboard` }, { status: 400 })
    }

    if (!res.ok) {
      return NextResponse.json({ message: data.message || data.error || JSON.stringify(data) }, { status: 400 })
    }

    // Real success - returns { id, reference, status: 'pending' }
    return NextResponse.json({ success: true, reference: data.reference || orderId, data })

  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}