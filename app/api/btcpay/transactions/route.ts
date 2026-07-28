import { NextResponse } from "next/server";

const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY!;
const BTCPAY_HOST = process.env.BTCPAY_HOST!;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID!;

export async function GET() {
  try {
    const params = new URLSearchParams({
      limit: "25",
      status: "settled"
      // dateFrom: "2024-01-01", // optional
      // dateTo: "2025-07-01",   // optional
    });

    const res = await fetch(`${BTCPAY_HOST}/api/v1/stores/${BTCPAY_STORE_ID}/invoices?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `token ${BTCPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `BTCPay error: ${err}` }, { status: res.status });
    }

    const invoices = await res.json();

    return NextResponse.json({ invoices }, { status: 200 });
  } catch (error: any) {
    console.error("BTCPay get-transactions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}