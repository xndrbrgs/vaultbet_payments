// app/api/btcpay/payout/route.ts
import { NextRequest, NextResponse } from "next/server";

const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY!;
const BTCPAY_HOST = process.env.BTCPAY_HOST!;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID!;

export async function POST(req: NextRequest) {
    try {
        const { amount, recipientAddress, description, recipientEmail, personName } = await req.json();

        if (!amount || !recipientAddress || !description || !recipientEmail) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Determine payment method automatically
        const isLightning = recipientAddress.startsWith("ln");
        const paymentMethod = isLightning ? "BTC-LN" : "BTC";

        // // 1️⃣ Get Payment Method
        // const getPaymentMethod = await fetch(
        //     `${BTCPAY_HOST}/api/v1/stores/${BTCPAY_STORE_ID}/payment-methods`,
        //     {
        //         method: "GET",
        //         headers: {
        //             Authorization: `token ${BTCPAY_API_KEY}`,
        //             "Content-Type": "application/json",
        //         }
        //     }
        // );
        // if (!getPaymentMethod.ok) {
        //     const err = await getPaymentMethod.text();
        //     return NextResponse.json({ error: `BTCPay pool error: ${err}` }, { status: 500 });
        // }

        // const getPaymentMethodData = await getPaymentMethod.json();
        // console.log("Payment methods:", getPaymentMethodData);

        // 1️⃣ Create Pull Payment
        const poolRes = await fetch(
            `${BTCPAY_HOST}/api/v1/stores/${BTCPAY_STORE_ID}/pull-payments`,
            {
                method: "POST",
                headers: {
                    Authorization: `token ${BTCPAY_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: `${personName} - ${recipientEmail}`,
                    description: description,
                    amount,
                    currency: "USD",
                    // autoApproveClaims: true, // auto-execute payouts
                    paymentMethod,           // must match payout
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
                    Authorization: `token ${BTCPAY_API_KEY}`,
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
