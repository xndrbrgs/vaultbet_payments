"use server";

import { randomUUID } from "crypto";
import { SquareClient, SquareEnvironment } from "square";
import prisma from "../db";
import { createOrGetUser } from "./user.actions";
import { unstable_cache } from "next/cache";

type ProcessSquarePaymentParams = {
  sourceId: string;
  amount: number;
  recipientId: string;
  paymentDescription: string;
  buyerEmail?: string;
};

export async function processSquarePayment({
  sourceId,
  amount,
  recipientId,
  paymentDescription,
  buyerEmail,
}: ProcessSquarePaymentParams) {
  try {
    // Initialize Square client
    const client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment:
      process.env.NODE_ENV === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
    });

    const user = await createOrGetUser();
    if (!user.id) throw new Error("Not authenticated");

    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: user.clerkUserId },
    });
    if (!currentUser) throw new Error("User not found");

    // Convert amount to cents for Square
    const amountInCents = Math.round(amount * 100);

    // Create a unique idempotency key for this payment
    const idempotencyKey = randomUUID();

    await prisma.squareTransfer.create({
      data: {
        id: sourceId,
        amount,
        description: paymentDescription,
        senderId: currentUser.id,
        receiverId: recipientId,
        status: "PENDING",
      },
    });

    // Create the payment with Square
    const response = await client.payments.create({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(amountInCents),
        currency: "USD",
      },
      note: paymentDescription,
      // Store recipient ID in metadata for your application
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
      // Include buyer details if available
      buyerEmailAddress: buyerEmail,
    });

    console.log("Square payment response:", response);

    if (response.payment?.status === "COMPLETED") {
      await prisma.squareTransfer.update({
        where: { id: sourceId },
        data: { status: "COMPLETED" },
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Square payment error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Payment processing failed",
    };
  }
}

export const getSquareTransactions = unstable_cache(
  async () => {
    const transactions = await prisma.squareTransfer.findMany({
      where: { status: "COMPLETED" },
    });
    const transactionsWithUserEmails = await Promise.all(
      transactions.map(async (transaction) => {
        const user = await prisma.user.findUnique({
          where: { id: transaction.senderId },
          select: { email: true },
        });
        return {
          ...transaction,
          senderEmail: user?.email || null,
        };
      })
    );
    return transactionsWithUserEmails;
  },
  [`square-transactions`],
  { revalidate: 600, tags: ["square-transactions"] }
);
