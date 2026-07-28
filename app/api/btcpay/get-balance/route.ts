// app/api/btcpay/payout/route.ts
import { getBTCPayBalances } from "@/lib/actions/btc-actions";
import { NextApiRequest, NextApiResponse } from "next";


const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY!;
const BTCPAY_HOST = process.env.BTCPAY_HOST!;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const balances = await getBTCPayBalances(
            BTCPAY_STORE_ID!,
            BTCPAY_API_KEY!,
            BTCPAY_HOST!
        );
        res.status(200).json(balances);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
