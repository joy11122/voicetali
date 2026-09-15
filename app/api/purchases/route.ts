import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPurchase } from "@/services/businessService";
import { connectDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import { Types } from "mongoose";
import { z } from "zod";

const PurchaseSchema = z.object({
  partyId: z.string().nullable().optional(),
  productId: z.string().min(1),
  quantity: z.coerce.number().finite().positive(),
  unitPrice: z.coerce.number().finite().positive(),
  paidAmount: z.coerce.number().finite().min(0),
  notes: z.string().max(500).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const rows = await Transaction.find({
    userId: new Types.ObjectId(session.user.id),
    type: "STOCK_IN",
  })
    .sort({ timestamp: -1 })
    .limit(200)
    .populate("partyId", "name")
    .populate("productId", "name unit")
    .lean();

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const input = PurchaseSchema.parse(body);
    const result = await createPurchase(session.user.id, input);
    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not save purchase";
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : undefined;
    return NextResponse.json({ error: message, code }, { status: 400 });
  }
}
