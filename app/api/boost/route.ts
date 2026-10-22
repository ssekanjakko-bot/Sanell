import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

let cached = (global as any).mongoose
if (!cached) cached = (global as any).mongoose = { conn: null, promise: null }

async function connect() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then(m => m)
  }
  cached.conn = await cached.promise
  return cached.conn
}

export async function POST(req: NextRequest) {
  try {
    const { productId, plan } = await req.json()
    
    if (!productId) {
      return NextResponse.json({ message: 'productId required' }, { status: 400 })
    }

    await connect()
    const db = mongoose.connection.db
    if (!db) throw new Error('DB not connected')

    const days = plan === 'quick' ? 1 : plan === 'hustler' ? 14 : 3
    const now = new Date()

    const result = await db.collection('products').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(productId) },
      {
        $set: {
          isBoosted: true,
          boostedAt: now,
          boostEndsAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
          boostPlan: plan || 'standard',
          boostScore: plan === 'hustler' ? 100 : 50,
          updatedAt: now,
        }
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ message: 'Product not found in products collection' }, { status: 404 })
    }

    return NextResponse.json({ success: true, product: result })

  } catch (e: any) {
    console.error('Boost error:', e)
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}