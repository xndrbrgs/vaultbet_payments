import BTCBalance from "@/components/btcpay/BTCBalance";
import { DashboardTabs } from "@/components/payments/DashboardTabs";
import PayoutApprove from "@/components/payouts/PayoutApprove";
import { getAdminUser } from "@/lib/actions/user-actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }
  const adminUser = await getAdminUser({ userId });

  if (!adminUser) {
    return (
      <>
        <BTCBalance />
        <DashboardTabs />
        <PayoutApprove />
      </>
    );
  } else {
    return <div>ADMIN VIEW</div>;
  }
}
