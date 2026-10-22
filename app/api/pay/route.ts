import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { phone, amount, orderId } = await req.json()
  
  const auth = 'Bearer 0575c73fc4e07e.C4dZ5XNPmxIXWYbaymQthA'
  const body = {
    account_no: 'REL370AF83D24',
    reference: String(orderId),
    msisdn: String(phone),
    amount: Number(amount),
    currency: 'UGX',
  }

  const urls = [
    'https://payments.relworx.com/api/mobile-money/request',
    'https://payments.relworx.com/api/request-payment',
    'https://payments.relworx.com/api/v1/payments/mobile-money',
  ]

  for (const url of urls) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': auth },
      body: JSON.stringify(body),
    })
    const text = await r.text()
    if (!text.trim().startsWith('<')) {
      // Got JSON! Success
      return NextResponse.json(JSON.parse(text))
    }
    // If HTML, try next URL
  }

  // If all returned HTML, it's IP block
  return NextResponse.json({ 
    message: `Relworx blocked Vercel IP. Your Business Account -> API Authorized IPs is empty or not saving. Add 0.0.0.0 and save, then wait 5 min. Relworx returns login HTML when IP blocked.` 
  }, { status: 400 })
}