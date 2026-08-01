"use server";

import axios from "axios";

// const RECEIVER_ID = process.env.RECEIVER_ID!; 
// const BTCPAY_API_KEY = process.env.NEXT_PUBLIC_BTCPAY_API_KEY!;
// const BTCPAY_STORE_ID = process.env.NEXT_PUBLIC_BTCPAY_STORE_ID!;
const BTCPAY_HOST = process.env.NEXT_PUBLIC_BTCPAY_HOST!;

import { CoinGeckoClient } from "coingecko-api-v3";
import { TransferStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "../user-actions";
import { NextResponse } from "next/server";
const client = new CoinGeckoClient({ timeout: 10000, autoRetry: true });

export async function saveBTCPayment(invoiceData: any) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: user.clerkUserId },
  });
  if (!currentUser) throw new Error("User not found");

  const paymentData = {
    id: invoiceData.id,
    amount: invoiceData.amount,
    description: invoiceData.metadata?.itemDesc,
    senderId: currentUser.id,
    receiverId: RECEIVER_ID,
    status: "PENDING" as TransferStatus,
  };

  await prisma.bTCTransfer.create({
    data: paymentData,
  });

  console.log("Saving BTCPayment data:", invoiceData);
  return invoiceData;
}

export async function getBTCPayments() {
  const endpoint = `${process.env.BASE_URL!}/api/btcpay/transactions`;

  try {
    const response = await axios.get(endpoint, {
      headers: { "Content-Type": "application/json" },
    });

    const invoices = Array.isArray(response.data.invoices)
      ? response.data.invoices
      : response.data?.id
        ? [response.data]
        : [];

    interface Invoice {
      id: string;
      status: TransferStatus;
      amount?: number;
      metadata?: {
        itemDesc?: string;
      };
      createdAt?: string; // BTC API might provide this
    }

    interface ExistingPayment {
      id: string;
      status: TransferStatus;
    }

    if (invoices.length > 0) {
      const existingPayments: ExistingPayment[] = await prisma.bTCTransfer.findMany({
        where: { id: { in: invoices.map((inv: Invoice) => inv.id) } },
        select: { id: true, status: true },
      });

      const updates = invoices
        .filter((inv: Invoice) => {
          const existing = existingPayments.find((ep: ExistingPayment) => ep.id === inv.id);
          return existing && existing.status !== inv.status;
        })
        .map((inv: Invoice) =>
          prisma.bTCTransfer.update({
            where: { id: inv.id },
            data: {
              status: inv.status,
              description: inv.metadata?.itemDesc || undefined, // ✅ Update description if available
              // Use BTC API date if provided, else keep existing createdAt
              createdAt: inv.createdAt ? new Date(inv.createdAt) : undefined,
            },
          })
        );

      if (updates.length > 0) {
        await prisma.$transaction(updates);
      }
    }

    // Fetch settled transfers with description and date included
    const btcTransfers = await prisma.bTCTransfer.findMany({
      where: { status: "SETTLED" },
      select: {
        id: true,
        amount: true,
        status: true,
        description: true, // ✅ Include description
        createdAt: true,   // ✅ Include date
        senderId: true,
        sender: { select: { email: true } },
      },
    });

    return btcTransfers.map(t => ({
      ...t,
      senderEmail: t.sender?.email || null,
    }));
  } catch (error) {
    throw new Error(`Failed to fetch transactions: ${error}`);
  }
}


export async function getBTCPayBalances() {
  const headers = {
    Authorization: `token ${BTCPAY_API_KEY}`,
    "Content-Type": "application/json",
  };

  // On-chain wallet (BTC)
  const onchainRes = await fetch(
    `${BTCPAY_HOST}/api/v1/stores/${BTCPAY_STORE_ID}/payment-methods/BTC-CHAIN/wallet`,
    { method: "GET", headers }
  );
  if (!onchainRes.ok) {
    throw new Error(`Onchain fetch failed: ${onchainRes.statusText}`);
  }
  const onchainData = await onchainRes.json();

  const allMethods = await fetch(
    `${BTCPAY_HOST}/api/v1/stores/${BTCPAY_STORE_ID}/payment-methods/BTC-CHAIN/wallet/address`,
    { method: "GET", headers }
  );
  if (!onchainRes.ok) {
    throw new Error(`Onchain fetch failed: ${onchainRes.statusText}`);
  }
  const allMethodsRes = await allMethods.json();

  return { onchainData, allMethodsRes };
}

export async function getBTCBalanceInUSD() {
  try {
    // Get BTC balance from BTCPay
    const { onchainData } = await getBTCPayBalances();
    // Extract the BTC balance (adjust if your API uses a different field)
    const btcBalance = parseFloat(onchainData.balance);
    // Get live BTC price in USD
    const priceData = await client.simplePrice({
      ids: "bitcoin",
      vs_currencies: "usd",
    });
    const btcPriceUSD = priceData.bitcoin.usd;
    // Calculate value in USD
    const balanceUSD = btcBalance * btcPriceUSD;

    return { btcBalance, btcPriceUSD, balanceUSD };
  } catch (error) {
    console.error("Error fetching BTC balance or price:", error);
    throw error;
  }
}

export async function getConfiguredOnchainProcessor() {
  const headers = {
    Authorization: `token ${BTCPAY_API_KEY}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(
    `${BTCPAY_HOST}/api/v1/stores/${BTCPAY_STORE_ID}/payout-processors/OnChainAutomatedPayoutSenderFactory/BTC-CHAIN`,

    { method: "GET", headers }
  );
  if (!res.ok) {
    throw new Error(`Onchain fetch failed: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

export async function getStorePayouts({ storeId }: { storeId: string }) {
  if (!storeId) {
    return NextResponse.json(
      { error: "storeId is required" },
      { status: 400 },
    );
  }
  const store = await prisma.stores.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const headers = {
    Authorization: `token ${store.btcpayApiKey}`,
    "Content-Type": "application/json",
  };

  // Step 1: Get all pull payments
  const payoutsList = await fetch(
    `${BTCPAY_HOST}/api/v1/stores/${store.btcpayStoreId}/payouts`,
    { method: "GET", headers }
  );

  if (!payoutsList.ok) {
    throw new Error(`Pull payments fetch failed: ${payoutsList.statusText}`);
  }

  const payouts = await payoutsList.json();

  // Step 2: For each pull payment, fetch its payouts
  const pullPaymentsWithPayouts = await Promise.all(
    payouts.map(async (payment: any) => {
      const payoutRes = await fetch(
        `${BTCPAY_HOST}/api/v1/pull-payments/${payment.pullPaymentId}`,
        { method: "GET", headers }
      );

      if (!payoutRes.ok) {
        throw new Error(
          `Failed to fetch payouts for ${payment.id}: ${payoutRes.statusText}`
        );
      }

      const payouts = await payoutRes.json();
      return { ...payment, payouts }; // Attach payouts to pull payment
    })
  );

  return pullPaymentsWithPayouts;
}

export async function getStoreInfo({ storeId }: { storeId: string }) {
  if (!storeId) {
    return NextResponse.json(
      { error: "storeId is required" },
      { status: 400 },
    );
  }
  const store = await prisma.stores.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const headers = {
    Authorization: `token ${store.btcpayApiKey}`,
    "Content-Type": "application/json",
  };

  // Step 1: Get all pull payments
  const payoutsList = await fetch(
    `${BTCPAY_HOST}/api/v1/stores/${store.btcpayStoreId}/lightning/BTC/invoices`,
    { method: "GET", headers }
  );

  return await payoutsList.json();
}

export async function cancelPayout(
  payoutId: string,
  name: string,
  approvedBy: string,
  amount: string,
  description: string,
  destination: string,
  storeId: string
) {
  if (!storeId) {
    return NextResponse.json(
      { error: "storeId is required" },
      { status: 400 },
    );
  }
  const store = await prisma.stores.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  const headers = {
    Authorization: `token ${store.btcpayApiKey}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(
    `${BTCPAY_HOST}/api/v1/stores/${store.btcpayStoreId}/payouts/${payoutId}`,
    {
      method: "DELETE",
      headers,
      body: JSON.stringify({ revision: 0 }), // required by BTCPay
    }
  );
  if (!res.ok) {
    throw new Error(`Payout failed to cancel: ${res.statusText}`);
  }

  const payout = await res.json();
  console.log(
    "Payout deleted:",
    payout,
    description,
    name,
    approvedBy,
    destination
  );

}

export async function approvePayout(
  payoutId: string,
  name: string,
  approvedBy: string,
  amount: string,
  description: string,
  destination: string,
  storeId: string
) {
  if (!storeId) {
    return NextResponse.json(
      { error: "storeId is required" },
      { status: 400 },
    );
  }
  const store = await prisma.stores.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  const headers = {
    Authorization: `token ${store.btcpayApiKey}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(
    `${BTCPAY_HOST}/api/v1/stores/${store.btcpayStoreId}/payouts/${payoutId}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ revision: 0 }), // required by BTCPay
    }
  );
  if (!res.ok) {
    throw new Error(`Payout failed to approve: ${res.statusText}`);
  }

  const payout = await res.json();
  // console.log(
  //   "Payout approved:",
  //   payout,
  //   description,
  //   name,
  //   approvedBy,
  //   destination
  // );

  // let savedPayout = await prisma.payouts.create({
  //   data: {
  //     payoutId: payout.id,
  //     amount: payout.originalAmount,
  //     description: description,
  //     name: name,
  //     approvedBy,
  //     address: destination,
  //     status: "PENDING", // from your enum
  //   },
  // });

  // console.log("Payout saved to database:", savedPayout);
}

export async function getCompletedPayouts() {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const payouts = await prisma.payouts.findMany({
    where: {
      updatedAt: {
        gte: twoDaysAgo,
      },
      status: {
        in: ["COMPLETED", "PENDING"], // Assuming these are the correct status values
      },
    },
  });
  return payouts;
}
