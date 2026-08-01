import { saveBTCPayment } from "@/lib/actions/server/btc-actions";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const BTCPAY_HOST = process.env.BTCPAY_HOST!;

export async function POST(req: NextRequest) {
  try {
    const { amount, description, storeId } = await req.json();

    // console.log("Received create-payment request with data:", { amount, description, storeId });

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId is required" },
        { status: 400 },
      );
    }

    const store = await prisma.stores.findUnique({
      where: { id: storeId },
    });

    // console.log("Fetched store from database:", store);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const invoiceRes = await fetch(`${BTCPAY_HOST}/api/v1/stores/${store.btcpayStoreId}/invoices`, {
      method: "POST",
      headers: {
        Authorization: `token ${store.btcpayApiKey}`,
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
    // console.log("BTCPay invoice created:", paymentData);
    // await saveBTCPayment(paymentData);

    return NextResponse.json({
      checkoutLink: paymentData.checkoutLink,  // <- use this to redirect the user
      invoiceId: paymentData.id,
    });
  } catch (err: any) {
    console.error("BTCPay hybrid create-invoice error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
