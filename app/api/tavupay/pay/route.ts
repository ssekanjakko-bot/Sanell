import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { phone, amount, reference } = await req.json()
  
  const res = await fetch('https://tavupay.lat/api/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TAVUPAY_SECRET_KEY}`,
      'X-Public-Key': process.env.TAVUPAY_PUBLIC_KEY!
    },
    body: JSON.stringify({
      amount,
      currency: 'UGX',
      phone,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/tavupay/webhook`,
      description: `Sanel Boost ${reference}`
    })
  })

  const data = await res.json()
  if(!res.ok) return NextResponse.json({ error: data.message }, { status: 400 })
  return NextResponse.json(data)
}