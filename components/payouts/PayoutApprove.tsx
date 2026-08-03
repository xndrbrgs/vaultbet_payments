import {
  getBTCRates,
  getStoreInfo,
  getStorePayouts,
} from "@/lib/actions/server/btc-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currentUser } from "@clerk/nextjs/server";
import ApproveButton from "./PayoutButton";
import DeleteApprove from "./DeleteApprove";
import { getStoreAdmin } from "@/lib/actions/user-actions";
import { satsToUsd } from "@/lib/tools";

const PayoutApprove = async () => {
  const user = await currentUser();
  if (!user) {
    return <div>User not found</div>;
  }

  const admin = await getStoreAdmin({ userId: user.id });
  if (!admin?.storeId) {
    return <div>Store not found</div>;
  }

  const payouts = await getStorePayouts({ storeId: admin.storeId });
  // Fetch the current rate once per render — used only for display, not for any payout logic
  const ratesRes = await getBTCRates({ storeId: admin.storeId });
  const ratesData = await ratesRes.json();
  const btcUsdRate: number | null = ratesRes.ok ? ratesData.rate : null;

  const email = user?.emailAddresses[0]?.emailAddress;

  return (
    <Card className="border border-gray-600 rounded-xl shadow-lg mt-3 max-w-7xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2 font-monaSans font-semibold">
          Payouts List
        </CardTitle>
        <CardDescription>
          These are the payouts pending on our server
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount (USD)</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Approve?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length > 0 ? (
                payouts
                  .filter((payout) => payout.state === "AwaitingApproval")
                  .map((payout) => {
                    const btcAmount = Number(payout.originalAmount);
                    const sats = btcAmount * 1e8;
                    const usdValue =
                      btcUsdRate !== null ? satsToUsd(sats, btcUsdRate) : null;

                    return (
                      <TableRow key={payout.id}>
                        <TableCell>{payout.payouts.name}</TableCell>
                        <TableCell>
                          {usdValue !== null ? `$${usdValue.toFixed(2)}` : "—"}
                        </TableCell>
                        <TableCell>{payout.payouts.description}</TableCell>
                        <TableCell className="truncate max-w-[100px]">
                          {payout.destination}
                        </TableCell>
                        <TableCell className="text-right space-x-5">
                          <ApproveButton
                            payoutId={payout.id}
                            name={payout.payouts.name}
                            approvedBy={email}
                            amount={payout.originalAmount}
                            description={payout.payouts.description}
                            destination={payout.destination}
                            storeId={admin.storeId}
                          />
                          <DeleteApprove
                            payoutId={payout.id}
                            name={payout.payouts.name}
                            approvedBy={email}
                            amount={payout.originalAmount}
                            description={payout.payouts.description}
                            destination={payout.destination}
                            storeId={admin.storeId}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell className="text-gray-500" colSpan={6}>
                    No payouts available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayoutApprove;
