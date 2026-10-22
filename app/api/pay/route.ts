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
        account_no: '0575c73fc4e07e',
        reference: orderId,
        msisdn: phone,
        amount: amount,
        currency: 'UGX',
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Momo failed' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}