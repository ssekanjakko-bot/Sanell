import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  const res = await fetch(`https://tavupay.lat/api/v1/payments/${ref}/status`, {
    headers: { 'Authorization': `Bearer ${process.env.TAVUPAY_SECRET_KEY}` }
  })
  const data = await res.json()
  return NextResponse.json(data)
}