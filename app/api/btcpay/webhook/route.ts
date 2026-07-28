import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

const BTCPAY_WEBHOOK = process.env.BTCPAY_WEBHOOK!;

export async function POST(req: NextRequest) {
    const signature = req.headers.get("BTCPay-Sig");

    const rawBody = await req.text();
    const calculatedSig = `sha256=${crypto
        .createHmac("sha256", BTCPAY_WEBHOOK)
        .update(rawBody)
        .digest("hex")}`;

    if (signature !== calculatedSig) {
        return new NextResponse("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Optionally log or handle specific event types
    if (event.type === "InvoiceCreated") {
        console.log("BTCPay invoice created data:", event);

        return NextResponse.json({ received: true });
    }
    // Optionally log or handle specific event types
    if (event.type === "InvoiceSettled") {
        const invoiceId = event.invoiceId;
        const status = event?.status;

        // Check if we already have the invoice stored
        const existingPayment = await prisma.bTCTransfer.findUnique({
            where: { id: invoiceId },
        });

        if (existingPayment) {
            await prisma.bTCTransfer.update({
                where: { id: invoiceId },
                data: { status },
            });
        } else {
            return NextResponse.json({ received: true });
        }
    }

    if (event.type === "PayoutUpdated") {
        const eventConst = JSON.stringify(event, null, 2);
        console.log('Payout webhook received:', eventConst);

        const payoutId = event.payoutId;
        const state = event.payoutState;


        if (!payoutId) {
            return NextResponse.json({ message: "No payoutId in webhook" });
        }

        const status =
            state === "Completed"
                ? "COMPLETED"
                : state === "Cancelled"
                    ? "CANCELLED"
                    : "PENDING";

        await prisma.payouts.updateMany({
            where: { payoutId }, // or payoutId if you store it
            data: { status },
        });

        return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
}

// export async function POST(req: NextRequest) {
//     try {
//         const rawBody = await req.text();
//         const signature = req.headers.get("BTCPay-Sig");

//         // Verify signature
//         const hmac = crypto
//             .createHmac("SHA256", BTCPAY_WEBHOOK)
//             .update(rawBody)
//             .digest("hex");

//         if (signature !== `sha256=${hmac}`) {
//             console.error("Invalid signature");
//             return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//         }

//         const event = JSON.parse(rawBody);

//         if (
//             event.type === "PayoutCompleted" &&
//             event.data &&
//             event.data.payoutId
//         ) {
//             const payout = event.data;
//             console.log("Payout completed event received:", payout);

//             // Upsert payout info
//             await prisma.payouts.upsert({
//                 where: { id: payout.payoutId },
//                 create: {
//                     id: payout.pullPaymentId,
//                     amount: payout.amount,
//                     description: payout.description,
//                     name: payout.name,
//                     status: payout.status,
//                     createdAt: new Date(), // Add createdAt field
//                 },
//                 update: {
//                     status: "COMPLETED",
//                 },
//             });

//             console.log(`✅ Payout ${payout.payoutId} marked as COMPLETED`);
//         }

//         return NextResponse.json({ received: true });
//     } catch (err) {
//         console.error(err);
//         return NextResponse.json({ error: "Webhook error" }, { status: 500 });
//     }
// }