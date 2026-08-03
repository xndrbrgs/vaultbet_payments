// lib/extractPayoutAmount.ts
import { decode } from "light-bolt11-decoder";

type ExtractedAmount = {
    btcAmount: number | null; // in BTC
    satAmount: number | null; // in sats
    source: "bolt11" | "bip21" | "none";
};

// lib/btcPrice.ts
import { CoinGeckoClient } from "coingecko-api-v3";
const client = new CoinGeckoClient({ timeout: 10000, autoRetry: true });

let cachedRate: { price: number; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30_000; // avoid hammering the API on rapid requests

export async function getBtcUsdRate(): Promise<number> {
    if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_TTL_MS) {
        return cachedRate.price;
    }

    const res = await client.simplePrice({
        ids: "bitcoin",
        vs_currencies: "usd",
    });

    const price = res?.bitcoin?.usd;
    if (!price) {
        throw new Error("Failed to fetch BTC/USD rate from CoinGecko");
    }

    cachedRate = { price, fetchedAt: Date.now() };
    return price;
}

export function satsToUsd(sats: number, btcUsdRate: number): number {
    return (sats / 1e8) * btcUsdRate;
}

export function extractAmountFromDestination(recipientAddress: string): ExtractedAmount {
    const raw = recipientAddress.trim();

    // Case 1: Lightning invoice (BOLT11) — amount is embedded in the invoice
    if (/^ln(bc|tb)/i.test(raw)) {
        try {
            const decoded = decode(raw);
            const amountSection = decoded.sections.find((s: any) => s.name === "amount");
            if (amountSection && amountSection.value) {
                const msat = Number(amountSection.value); // millisatoshis
                const sat = msat / 1000;
                return { btcAmount: sat / 1e8, satAmount: sat, source: "bolt11" };
            }
            // Invoice with no amount specified (amountless invoice) — customer must still tell you the amount
            return { btcAmount: null, satAmount: null, source: "bolt11" };
        } catch (e) {
            throw new Error(`Invalid BOLT11 invoice: ${e}`);
        }
    }

    // Case 2: BIP21 URI — bitcoin:<address>?amount=0.001
    if (raw.toLowerCase().startsWith("bitcoin:")) {
        try {
            const url = new URL(raw);
            const amountParam = url.searchParams.get("amount");
            if (amountParam) {
                const btc = parseFloat(amountParam);
                return { btcAmount: btc, satAmount: Math.round(btc * 1e8), source: "bip21" };
            }
        } catch {
            // fall through
        }
        return { btcAmount: null, satAmount: null, source: "bip21" };
    }

    // Case 3: plain on-chain address, lightning address, or LNURL — no amount embedded
    return { btcAmount: null, satAmount: null, source: "none" };
}