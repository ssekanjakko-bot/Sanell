import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  console.log("Tavupay Callback:", body);
  
  // Tavupay sends: { transaction_id, status: "success" | "failed", amount, ... }
  const { status, transaction_id, custom_ref } = body;

  if (status === "success") {
    // custom_ref = your product boost ID
    // TODO: Update your DB - mark boost as PAID
    // Example: await db.boost.update({ where: { id: custom_ref }, data: { paid: true } })
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: "webhook live" });
}