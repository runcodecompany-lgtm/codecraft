// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { simulateWebhook } from "@/actions/payment"

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { paymentId, status } = payload

    if (!paymentId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const res = await simulateWebhook(paymentId, status)
    if (res.success) {
      return NextResponse.json({ success: true, message: "Webhook processed successfully" })
    } else {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in Payment Webhook API:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
