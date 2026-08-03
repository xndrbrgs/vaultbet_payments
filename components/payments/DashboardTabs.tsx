import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStores, getUserEmail } from "@/lib/actions/user-actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PaymentForm } from "./PaymentForm";
import { BTCTypeTabs } from "../payouts/btc-type/BTCTypeTabs";
import { getBTCRates } from "@/lib/actions/server/btc-actions";

export async function DashboardTabs() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }
  const userEmail = await getUserEmail({ userId });
  const stores = await getStores();
  return (
    <Tabs defaultValue="payment" className="max-w-7xl">
      <TabsList>
        <TabsTrigger value="payment">Perform Payment</TabsTrigger>
        <TabsTrigger value="payout">Request Redeem</TabsTrigger>
      </TabsList>
      <TabsContent value="payment">
        <PaymentForm email={userEmail} stores={stores} />
      </TabsContent>
      <TabsContent value="payout">
        <BTCTypeTabs email={userEmail} stores={stores} />
      </TabsContent>
    </Tabs>
  );
}
