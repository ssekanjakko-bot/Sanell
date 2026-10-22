import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

let cached = (global as any).mongoose
if (!cached) cached = (global as any).mongoose = { conn: null }

async function connect() {
  if (cached.conn) return cached.conn
  cached.conn = await mongoose.connect(MONGODB_URI)
  return cached.conn
}

export async function POST(req: NextRequest) {
  try {
    const { productId, plan } = await req.json()
    await connect()

    const Product = mongoose.models.Product
    if (!Product) return NextResponse.json({ message: 'Product model not found' }, { status: 500 })

    const days = plan === 'quick' ? 1 : plan === 'hustler' ? 14 : 3
    const now = new Date()

    const updated = await Product.findByIdAndUpdate(productId, {
      isBoosted: true,
      boostedAt: now,
      boostEndsAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
      boostPlan: plan,
      boostScore: plan === 'hustler' ? 100 : 50,
    }, { new: true })

    return NextResponse.json({ success: true, product: updated })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}