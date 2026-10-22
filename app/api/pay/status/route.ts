import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { orderId } = await req.json()
  // Real Relworx status endpoint
  const res = await fetch(`https://payments.relworx.com/api/mobile-money/requests/${orderId}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer 0575c73fc4e07e.C4dZ5XNPmxIXWYbaymQthA',
    },
  })
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = { raw: text, status: 'UNKNOWN' } }
  return NextResponse.json(data)
}