// app/api/btcpay/payout/route.ts
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const BTCPAY_HOST = process.env.BTCPAY_HOST!;

export async function POST(req: NextRequest) {
    try {
        const { amount, recipientAddress, description, recipientEmail, personName, storeId } = await req.json();

        // console.log("Received redeem request with data:", { amount, description, storeId, recipientAddress, recipientEmail, personName });

        if (!amount || !recipientAddress || !description || !recipientEmail || !storeId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const store = await prisma.stores.findUnique({
            where: { id: storeId },
        });

        // console.log("Fetched store from database:", store);

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Determine payment method automatically
        const isBolt11 = recipientAddress.toLowerCase().startsWith("ln");
        const isLightningAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientAddress)
            || recipientAddress.includes("$"); // some services use $cashtag style
        const isLightning = isBolt11 || isLightningAddress;
        const paymentMethod = isLightning ? "BTC-LN" : "BTC";

        // 1️⃣ Create Pull Payment
        const poolRes = await fetch(
            `${BTCPAY_HOST}/api/v1/stores/${store.btcpayStoreId}/pull-payments`,
            {
                method: "POST",
                headers: {
                    Authorization: `token ${store.btcpayApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: `${personName} - ${recipientEmail}`,
                    description: description,
                    amount,
                    "BOLT11Expiration": 0,
                    currency: "USD",
                    payoutMethods: ["BTC", "BTC-LN"]
                    // autoApproveClaims: true, // auto-execute payouts
                    // paymentMethod,
                }),
            }
        );

        if (!poolRes.ok) {
            const err = await poolRes.text();
            return NextResponse.json({ error: `BTCPay pool error: ${err}` }, { status: 500 });
        }

        const poolData = await poolRes.json();
        console.log("Pull payment created:", poolData);
        const pullPaymentId = poolData.id;

        // 2️⃣ Execute Payout
        const payoutRes = await fetch(
            `${BTCPAY_HOST}/api/v1/pull-payments/${pullPaymentId}/payouts`,
            {
                method: "POST",
                headers: {
                    Authorization: `token ${store.btcpayApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    destination: recipientAddress,
                    amount,
                    payoutMethodId: paymentMethod,
                }),
            }
        );

        if (!payoutRes.ok) {
            const err = await payoutRes.text();
            return NextResponse.json({ error: `BTCPay payout creation error: ${err}` }, { status: 500 });
        }

        const payoutData = await payoutRes.json();
        console.log("Payout executed:", payoutData);

        return NextResponse.json({
            message: "Pull payment created and payout executed successfully",
            pool: poolData,
            payout: payoutData,
        });
    } catch (err: any) {
        console.error("Admin payout error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
