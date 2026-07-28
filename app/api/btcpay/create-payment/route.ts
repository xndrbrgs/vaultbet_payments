import { saveBTCPayment } from "@/lib/actions/btc-actions";
import { NextRequest, NextResponse } from "next/server";

const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY!;
const BTCPAY_HOST = process.env.BTCPAY_HOST!;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID!;

export async function POST(req: NextRequest) {
  try {
    const { amount, description } = await req.json();

    const invoiceRes = await fetch(`${BTCPAY_HOST}/api/v1/stores/${BTCPAY_STORE_ID}/invoices`, {
      method: "POST",
      headers: {
        Authorization: `token ${BTCPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: "USD",
        checkout: {
          speedPolicy: "HighSpeed",
          paymentMethods: ['BTC-LN'],
        },
        metadata: {
          itemDesc: `${description}`,
        },
      }),
    });

    if (!invoiceRes.ok) {
      const err = await invoiceRes.text();
      return NextResponse.json({ error: `BTCPay error: ${err}` }, { status: 500 });
    }

    const paymentData = await invoiceRes.json();
    console.log("BTCPay invoice created:", paymentData);
    await saveBTCPayment(paymentData);

    return NextResponse.json({
      checkoutLink: paymentData.checkoutLink,  // <- use this to redirect the user
      invoiceId: paymentData.id,
    });
  } catch (err: any) {
    console.error("BTCPay hybrid create-invoice error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
