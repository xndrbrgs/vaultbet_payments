"use server";

import { createOrGetUser } from "./user.actions";
import prisma from "../db";
import { stripe } from "../stripe";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";

const PRIVATE_CONNECTED_ACCOUNT = process.env.PRIVATE_CONNECTED_ACCOUNT;

export async function addConnection(connectedUserId: string) {
  const user = await createOrGetUser();
  if (!user.id) throw new Error("Not authenticated");

  // Fetch the current user
  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: user.clerkUserId },
  });
  if (!currentUser) throw new Error("User not found");

  // Fetch the user to connect
  const userToConnect = await prisma.user.findUnique({
    where: { id: connectedUserId },
  });
  if (!userToConnect) throw new Error("User to connect not found");

  if (currentUser.id === userToConnect.id)
    throw new Error("Cannot connect to yourself");

  // Check if the connection already exists in either direction
  const existingConnection = await prisma.connection.findFirst({
    where: {
      OR: [
        { userId: currentUser.id, connectedUserId: userToConnect.id },
        { userId: userToConnect.id, connectedUserId: currentUser.id },
      ],
    },
  });

  if (existingConnection) throw new Error("Connection already exists");

  // Create the bidirectional connections using a transaction
  await prisma.$transaction([
    prisma.connection.create({
      data: {
        userId: currentUser.id,
        connectedUserId: userToConnect.id,
      },
    }),
    prisma.connection.create({
      data: {
        userId: userToConnect.id,
        connectedUserId: currentUser.id,
      },
    }),
  ]);
}

export async function createStripeSession({
  amount,
  paymentDescription,
  recipientEmail,
  ssn,
  recipientId,
}: StripeSessionProps) {
  const user = await createOrGetUser();
  if (!user.id) throw new Error("Not authenticated");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: user.clerkUserId },
  });
  if (!currentUser) throw new Error("User not found");

  // Check if the recipient exists
  const recipientUser = await prisma.user.findUnique({
    where: { id: recipientId },
  });
  if (!recipientUser) {
    throw new Error(`Recipient with ID ${recipientId} does not exist.`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: paymentDescription,
            description: recipientEmail,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],

    payment_intent_data: {
      // application_fee_amount: Math.round((amount * 100) * 0.05), // 5% fee
      transfer_data: {
        destination: recipientUser.connectedAccountId!,
      },
    },
    //  Pass the customer email
    customer_email: currentUser.email,
    //  Add the metadata here
    metadata: {
      //  Pass the original parameters
      paymentDescription,
      //  Include the user ID of the sender
      customerEmail: currentUser.email,
    },

    success_url: "https://rlcpay.com/dashboard/payment/success",
    cancel_url: "https://rlcpay.com/dashboard/payment/cancel",
  });

  // Save transaction details to the database
  await prisma.transfer.create({
    data: {
      id: session.id, // Use the Stripe session ID as the transfer ID
      amount,
      description: paymentDescription,
      senderId: currentUser.id,
      receiverId: recipientId,
      status: "PENDING", // Set initial status
      ssn, // Store the user's SSN for verification
    },
  });

  return redirect(session.url!);
}

export async function createStripeAccountLink() {
  const user = await currentUser();

  if (!user) throw new Error("Not authenticated");

  const data = await prisma.user.findUnique({
    where: {
      clerkUserId: user.id,
    },
    select: {
      connectedAccountId: true,
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: data?.connectedAccountId!,
    refresh_url: "https://rlcpay.com/dashboard/",
    return_url: `https://rlcpay.com/dashboard/`,
    type: "account_onboarding",
  });

  return redirect(accountLink.url);
}

export async function getStripeDashboard() {
  const user = await currentUser();

  if (!user) throw new Error("Not authenticated");

  const data = await prisma.user.findUnique({
    where: {
      clerkUserId: user.id,
    },
    select: {
      connectedAccountId: true,
    },
  });

  const loginLink = await stripe.accounts.createLoginLink(
    data?.connectedAccountId!
  );

  return redirect(loginLink.url!);
}

export async function getUserTransactions() {
  const user = await createOrGetUser();
  if (!user.id) throw new Error("Not authenticated");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: user.clerkUserId },
  });
  if (!currentUser) throw new Error("User not found");

  const transferItems = await prisma.transfer.findMany({
    where: {
      OR: [
        { senderId: currentUser.id, status: "COMPLETED" }, // Fetch completed transfers sent by the current user
        { receiverId: currentUser.id, status: "COMPLETED" }, // Fetch completed transfers received by the current user
      ],
    },
    include: {
      sender: true, // Include sender details if needed
      receiver: true, // Include receiver details if needed
    },
  });

  // Separate the transfers into sent and received
  const sentTransfers = transferItems.filter(
    (transfer) => transfer.senderId === currentUser.id
  );
  const receivedTransfers = transferItems.filter(
    (transfer) => transfer.receiverId === currentUser.id
  );

  return { sentTransfers, receivedTransfers };
}

// export const getUserStripeTransactions = unstable_cache(
//   async () => {
//     if (!PRIVATE_CONNECTED_ACCOUNT) {
//       console.error("PRIVATE_CONNECTED_ACCOUNT environment variable not set.");
//       return [];
//     }

//     const currentUser = await prisma.user.findUnique({
//       where: { connectedAccountId: PRIVATE_CONNECTED_ACCOUNT },
//     });

//     if (!currentUser) {
//       throw new Error("User not found");
//     }

//     if (!currentUser.stripeConnectedLinked) {
//       return [];
//     }

//     // Fetch transactions from Stripe (consider pagination if needed)
//     const transactions = await stripe.balanceTransactions.list({
//       limit: 100,
//       expand: ["data.source"], // Only expand what you need
//     });

//     const userTransactions = transactions.data.filter(
//       (transaction) =>
//         transaction.source?.destination === currentUser.connectedAccountId
//     );

//     const positiveTransactions = userTransactions.filter(
//       (transaction) => transaction.amount > 0
//     );

//     const receiptEmails = positiveTransactions.map(
//       (transaction) =>
//         transaction.source?.receipt_email ||
//         transaction.source?.billing_details?.email
//     );

//     // Filter out undefined emails
//     const validReceiptEmails = receiptEmails.filter((email) => email !== undefined);

//     // Fetch users in a single query
//     // Fetch users in a single query
//     const users = await prisma.user.findMany({
//       where: {
//         email: {
//           in: validReceiptEmails,
//         },
//       },
//       select: { id: true, email: true }, // Only fetch necessary fields
//     });
//     const userMap = new Map(users.map((user) => [user.email, user.id]));

//     // Fetch matching transfers in a single query
//     const userIds = Array.from(userMap.values());
//     const matchingTransfers = await prisma.transfer.findMany({
//       where: {
//         senderId: {
//           in: userIds,
//         },
//       },
//     });

//     // Prepare updates for transfers
//     const transfersToUpdate = matchingTransfers.filter((transfer) => {
//       const matchingTransaction = positiveTransactions.find(
//         (transaction) => transaction.amount === transfer.amount * 100
//       );
//       return matchingTransaction && transfer.status !== "COMPLETED"; // Only update if not already completed
//     });

//     // Update transfers in batch
//     await prisma.transfer.updateMany({
//       where: {
//         id: {
//           in: transfersToUpdate.map((transfer) => transfer.id),
//         },
//       },
//       data: { status: "COMPLETED" },
//     });

//     // Fetch completed transfers (after the update)
//     const completedTransfers = await prisma.transfer.findMany({
//       where: {
//         senderId: {
//           in: userIds,
//         },
//         status: "COMPLETED",
//       },
//     });

//     // Create a map of senderId to email for efficient lookup
//     const senderEmailMap = new Map<string, string | undefined>();
//     for (const user of users) {
//       senderEmailMap.set(user.id, user.email);
//     }

//     return completedTransfers.map((transfer) => {
//       const matchingTransaction = positiveTransactions.find(
//         (transaction) => transaction.amount === transfer.amount * 100
//       );
//       return {
//         ...transfer,
//         transaction: matchingTransaction,
//         senderEmail: senderEmailMap.get(transfer.senderId),
//       };
//     });
//   },
//   [`stripe-transactions-${PRIVATE_CONNECTED_ACCOUNT}`],
//   { revalidate: 600, tags: ["stripe-transactions"] }
// );

export const getUserStripeTransactions = async () => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const transactions = await prisma.transfer.findMany({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: twoDaysAgo, // Filter transactions created in the last 48 hours
      },
    },
    include: {
      sender: true, // Include sender details if needed
      receiver: true, // Include receiver details if needed
    },
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
}

export const updateConnectAccount = async () => {
  const user = await currentUser();

  if (!user) throw new Error("Not authenticated");

  const stripeAccount = await stripe.accounts.create({
    email: user.emailAddresses[0].emailAddress ?? "",
    controller: {
      losses: {
        payments: "application",
      },
      fees: {
        payer: "application",
      },
      stripe_dashboard: {
        type: "express",
      },
    },
  });

  const account = await prisma.user.update({
    where: {
      clerkUserId: user.id,
    },
    data: {
      connectedAccountId: stripeAccount.id,
    },
  });

  return account;
}
