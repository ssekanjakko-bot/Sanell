import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderId } = await req.json()

    let msisdn = String(phone).replace(/\D/g,'')
    if (msisdn.startsWith('0')) msisdn = '256' + msisdn.slice(1)
    if (!msisdn.startsWith('256')) msisdn = '256' + msisdn

    const payload = {
      account_no: 'REL370AF83D24',
      reference: orderId,
      msisdn: msisdn,
      amount: Number(amount),
      currency: 'UGX',
    }

    console.log('Sending to Relworx:', payload)

    const res = await fetch('https://payments.relworx.com/api/mobile-money/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer 0575c73fc4e07e.C4dZ5XNPmxIXWYbaymQthA',
      },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    console.log('Relworx raw response:', text.slice(0,500))

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      // Relworx returned HTML - show it
      return NextResponse.json({ 
        message: `Relworx HTML error - Status ${res.status}. Your API key is invalid or expired. Go to Relworx dashboard and generate new key. Raw: ${text.slice(0,200)}`,
        html: text.slice(0,500),
        status: res.status
      }, { status: 400 })
    }

    if (!res.ok) {
      return NextResponse.json({ message: data.message || JSON.stringify(data) }, { status: res.status })
    }

    return NextResponse.json(data)

  } catch (e: any) {
    console.error('Pay error:', e)
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}