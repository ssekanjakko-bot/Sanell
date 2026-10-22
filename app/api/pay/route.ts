import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderId } = await req.json()

    const res = await fetch('https://payments.relworx.com/api/mobile-money/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer 0575c73fc4e07e.C4dZ5XNPmxIXWYbaymQthA`,
      },
      body: JSON.stringify({
        account_no: 'REL370AF83D24', // <-- CORRECT ACCOUNT FROM YOUR SCREENSHOT
        reference: orderId,
        msisdn: phone.startsWith('256') ? phone : `256${phone.slice(-9)}`,
        amount: Number(amount),
        currency: 'UGX',
      }),
    })

    const text = await res.text()
    if (text.trim().startsWith('<')) {
      return NextResponse.json({ message: `Relworx still blocked. Did you save Authorized Business Account + API IPs? Raw: ${text.slice(0,150)}` }, { status: 400 })
    }

    const data = JSON.parse(text)
    if (!res.ok) return NextResponse.json({ message: data.message || 'Momo failed' }, { status: 400 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}