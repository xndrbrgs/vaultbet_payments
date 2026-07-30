"use client";

import { Button } from "@/components/ui/button";
import { cancelPayout } from "@/lib/actions/server/btc-actions";
import { useState } from "react";

export default function DeleteApprove({
  payoutId,
  name,
  approvedBy,
  amount,
  description,
  destination,
}: {
  payoutId: string;
  name: string;
  approvedBy: string;
  amount: string;
  description: string;
  destination: string;
}) {
  const [loading, setLoading] = useState(false);
  console.log(payoutId, name, amount, description, destination, approvedBy);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await cancelPayout(
        payoutId,
        name,
        amount,
        description,
        destination,
        approvedBy
      );
      alert("Payout cancelled successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Payout cancelled successfully! Error:", error);
      window.location.reload();
      alert("Failed to approve payout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="submit"
      className="hover:cursor-pointer bg-yellowish text-white hover:bg-yellowish/70"
      onClick={handleApprove}
      disabled={loading}
    >
      {loading ? "Cancelling..." : "Cancel"}
    </Button>
  );
}
