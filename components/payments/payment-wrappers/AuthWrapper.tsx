"use client";

import { useState } from "react";
import PaymentStatus from "./forms/PaymentStatus";
import AcceptPaymentForm from "./forms/AcceptForm";

interface PaymentWrapperAuthProps {
  amount: number;
  recipientId: string;
  paymentDescription?: string;
  email?: string;
}

export default function PaymentWrapperAuth({
  amount,
  recipientId,
  paymentDescription,
  email,
}: PaymentWrapperAuthProps) {
  const [paymentStatus, setPaymentStatus] = useState<{
    success?: boolean;
    error?: string;
    transactionId?: string;
    message?: string;
  } | null>(null);

  const handlePaymentComplete = (result: any) => {
    console.log("Payment completed:", result);
    setPaymentStatus({
      success: true,
      transactionId: result.transactionId,
      message: result.message,
    });
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
    setPaymentStatus({
      success: false,
      error: error,
    });
  };

  const resetPayment = () => {
    setPaymentStatus(null);
  };

  return (
    <div className="auth-form-style p-7">
      {paymentStatus ? (
        <PaymentStatus
          success={paymentStatus.success || false}
          error={paymentStatus.error}
          transactionId={paymentStatus.transactionId}
          onReset={resetPayment}
        />
      ) : (
        <AcceptPaymentForm
          onPaymentComplete={handlePaymentComplete}
          onPaymentError={handlePaymentError}
          amount={amount}
          recipientId={recipientId}
          paymentDescription={paymentDescription}
          email={email || ""}
        />
      )}
    </div>
  );
}
