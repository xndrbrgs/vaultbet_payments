"use server";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
const BTCPAY_HOST = process.env.BTCPAY_HOST!;

export async function getBTCPay({ storeId }: { storeId: string }) {
  if (!storeId) {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
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

  //   const info = await fetch(
  //     `${BTCPAY_HOST}/api/v1/stores/${store.btcpayStoreId}/payment-methods`,
  //     {
  //       method: "GET",
  //       headers,
  //     },
  //   );
  const info = await fetch(
    `${BTCPAY_HOST}/api/v1/stores/${store.btcpayStoreId}/lightning/BTC/info`,
    {
      method: "GET",
      headers,
    },
  );

  return await info.json();
}
