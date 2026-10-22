import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderId } = await req.json()

    // NEW working endpoint
    const res = await fetch('https://payments.relworx.com/api/mobile-money/request-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer 0575c73fc4e07e.C4dZ5XNPmxIXWYbaymQthA`,
      },
      body: JSON.stringify({
        account_no: 'REL370AF83D24',
        reference: orderId,
        msisdn: phone,
        amount: Number(amount),
        currency: 'UGX',
      }),
    })

    const text = await res.text()
    if (text.trim().startsWith('<')) {
      // If still HTML, try fallback v2
      const res2 = await fetch('https://payments.relworx.com/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 0575c73fc4e07e.C4dZ5XNPmxIXWYbaymQthA`,
        },
        body: JSON.stringify({
          account_no: 'REL370AF83D24',
          reference: orderId,
          msisdn: phone,
          amount: Number(amount),
          currency: 'UGX',
        }),
      })
      const text2 = await res2.text()
      if (text2.trim().startsWith('<')) {
        return NextResponse.json({ message: 'Relworx endpoint changed. Contact support for new URL.' }, { status: 400 })
      }
      return NextResponse.json(JSON.parse(text2))
    }

    return NextResponse.json(JSON.parse(text))
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}