'use server';

import prisma from "../db";
import { TransferStatus } from './../../node_modules/.prisma/client/index.d';
import { getEmailBySenderId } from "./user.actions";

export async function saveAuthorizeNetTransaction(transactionDetails: {
  amount: number;
  status: TransferStatus;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  id: string;
  description: string;
}) {
  try {
    const savedTransaction = await prisma.authNetTransfer.create({
      data: {
        id: transactionDetails.id,
        amount: transactionDetails.amount,
        description: transactionDetails.description,
        status: transactionDetails.status as TransferStatus,
        senderId: transactionDetails.senderId,
        receiverId: transactionDetails.receiverId,
        createdAt: transactionDetails.createdAt,
      },
    });
    return savedTransaction;
  } catch (error) {
    console.error("Error saving Authorize.Net transaction:", error);
    throw new Error("Failed to save transaction");
  }
}

export async function getAuthTransactions() {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);



    const recentTransactions = await prisma.authNetTransfer.findMany({
      where: {
        createdAt: {
          gte: twoDaysAgo,
        },
      },
    });

    const transactionsWithEmails = await Promise.all(
      recentTransactions.map(async (transaction) => {
        const { email } = await getEmailBySenderId({ senderId: transaction.senderId });
        return {
          ...transaction,
          senderEmail: email,
        };
      })
    );

    return transactionsWithEmails;
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    throw new Error("Failed to fetch recent transactions");
  }
}