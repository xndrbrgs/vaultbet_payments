// app/api/btcpay/payout/lightning/route.ts

import { getBTCRates } from "@/lib/actions/server/btc-actions";
import { prisma } from "@/lib/db";
import { extractAmountFromDestination, satsToUsd } from "@/lib/tools";
import { NextRequest, NextResponse } from "next/server";

const BTCPAY_HOST = process.env.BTCPAY_HOST!;

export async function POST(req: NextRequest) {
    try {
        const { recipientAddress, description, recipientEmail, personName, storeId } = await req.json();

        if (!recipientAddress || !description || !recipientEmail || !storeId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const store = await prisma.stores.findUnique({
            where: { id: storeId },
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const isBolt11 = recipientAddress.toLowerCase().startsWith("ln");
        const isLightningAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientAddress)
            || recipientAddress.includes("$");
        const isLightning = isBolt11 || isLightningAddress;
        const paymentMethod = isLightning ? "BTC-LN" : "BTC";

        const extracted = extractAmountFromDestination(recipientAddress);

        if (!extracted.btcAmount) {
            return NextResponse.json(
                { error: "No amount could be determined from the provided destination." },
                { status: 400 }
            );
        }

        // Rate lookup is now purely for logging/reporting — no conversion feeds into the actual amounts sent to BTCPay
        const ratesRes = await getBTCRates({ storeId });
        const ratesData = await ratesRes.json();

        if (!ratesRes.ok) {
            return NextResponse.json({ error: ratesData.error }, { status: 500 });
        }

        const btcUsdRate = ratesData.rate;
        const impliedUsd = satsToUsd(extracted.satAmount!, btcUsdRate);

        console.log(
            `Destination embeds ${extracted.satAmount} sats (${extracted.btcAmount} BTC, ~$${impliedUsd.toFixed(2)} @ $${btcUsdRate}/BTC, source: ${extracted.source})`
        );

        // Everything below is BTC-native — no USD conversion, no reconversion, no drift.
        const RATE_DRIFT_BUFFER = 1.015; // headroom on the pool cap only, still in BTC
        const poolAmount = Math.round(extracted.btcAmount * RATE_DRIFT_BUFFER * 1e8) / 1e8; // round to 1 sat precision
        const payoutAmount = extracted.btcAmount; // exact invoice amount, unmodified

        // 1️⃣ Create Pull Payment — BTC-native
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
                    description: `${description}`,
                    amount: payoutAmount,
                    "BOLT11Expiration": 0,
                    currency: "BTC",
                    payoutMethods: ["BTC", "BTC-LN"],
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

        // 2️⃣ Execute Payout — BTC-native, exact sats, matches the invoice exactly
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
                    amount: payoutAmount,
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
            impliedUsd, // still reported back for your records/UI, just not used operationally
            btcUsdRate,
            pool: poolData,
            payout: payoutData,
        });
    } catch (err: any) {
        console.error("Admin payout error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}