import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()
    const res = await fetch(`https://payments.relworx.com/api/mobile-money/requests/${orderId}`, {
      headers: { 'Authorization': 'Bearer 0575c73fc4e07e.C4dZ5XNPmxIXWYbaymQthA' },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}