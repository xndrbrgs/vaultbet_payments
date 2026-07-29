import { PaymentForm } from "@/components/payments/PaymentForm";
import { getAdminUser, getStores, getUserEmail } from "@/lib/actions/user-actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }
  const adminUser = await getAdminUser({ userId });
  const userEmail = await getUserEmail({ userId });
  const stores = await getStores();

  if (!adminUser) {
    return (
      <div>
        <PaymentForm email={userEmail} stores={stores} />
      </div>
    );
  } else {
    return <div>ADMIN VIEW ONLY</div>;
  }
}
