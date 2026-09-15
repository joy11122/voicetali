import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import Party from "@/models/Party";
import Product from "@/models/Product";
import { Types } from "mongoose";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const question = String(body?.question ?? "").trim();
  await connectDB();

  const userId = new Types.ObjectId(session.user.id);
  const q = question.toLowerCase();
  const since = new Date(Date.now() - 7 * 86400000);

  const [tx, parties, products] = await Promise.all([
    Transaction.find({ userId, timestamp: { $gte: since } }).lean(),
    Party.find({ userId }).lean(),
    Product.find({ userId }).lean(),
  ]);

  let answer =
    "আপনার প্রশ্নটি বুঝতে পারিনি। বিক্রি, লাভ, পাওনা, দেনা বা স্টক সম্পর্কে জিজ্ঞেস করুন।";

  if (q.includes("বিক্রি") || q.includes("sales") || q.includes("sale")) {
    const sales = tx
      .filter((x) => x.type === "SALE")
      .reduce((sum, x) => sum + x.amount, 0);
    answer = `গত ৭ দিনে মোট বিক্রি ৳${sales.toLocaleString()}.`;
  } else if (q.includes("লাভ") || q.includes("profit")) {
    const sales = tx
      .filter((x) => x.type === "SALE")
      .reduce((sum, x) => sum + x.amount, 0);
    const cogs = tx
      .filter((x) => x.type === "SALE")
      .reduce((sum, x) => sum + (x.costAmount || 0), 0);
    const expenses = tx
      .filter((x) => x.type === "EXPENSE")
      .reduce((sum, x) => sum + x.amount, 0);
    answer = `গত ৭ দিনের আনুমানিক নিট লাভ ৳${(
      sales - cogs - expenses
    ).toLocaleString()}.`;
  } else if (q.includes("পাওনা") || q.includes("receivable")) {
    const receivable = parties
      .filter((x) => x.partyType === "CUSTOMER" && x.currentBalance > 0)
      .reduce((sum, x) => sum + x.currentBalance, 0);
    answer = `আপনার মোট পাওনা ৳${receivable.toLocaleString()}.`;
  } else if (q.includes("দেনা") || q.includes("payable")) {
    const payable = parties
      .filter((x) => x.partyType === "SUPPLIER" && x.currentBalance < 0)
      .reduce((sum, x) => sum + Math.abs(x.currentBalance), 0);
    answer = `আপনার মোট দেনা ৳${payable.toLocaleString()}.`;
  } else if (q.includes("স্টক") || q.includes("stock")) {
    const lowStock = products.filter(
      (x) => x.stockQuantity <= x.lowStockThreshold,
    ).length;
    answer = `${lowStock}টি পণ্য low stock-এ আছে।`;
  }

  return NextResponse.json({ answer });
}
