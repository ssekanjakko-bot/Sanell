import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderId } = await req.json()

    const res = await fetch('https://payments.relworx.com/api/mobile-money/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 0575c73fc4e07e.C4dZ5XNPmxIXWYbaymQthA',
      },
      body: JSON.stringify({
        account_no: 'REL370AF83D24',
        reference: orderId,
        msisdn: String(phone),
        amount: Number(amount),
        currency: 'UGX',
      }),
    })

    const text = await res.text()
    if (text.trim().startsWith('<')) {
      return NextResponse.json({ message: 'Relworx HTML error' }, { status: 400 })
    }

    const data = JSON.parse(text)
    return NextResponse.json(data)

  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}