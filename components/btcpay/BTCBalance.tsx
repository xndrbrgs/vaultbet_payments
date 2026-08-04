import { BadgeDollarSign, Bitcoin, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { getBTCBalanceInUSD } from "@/lib/actions/server/btc-actions";
import { currentUser } from "@clerk/nextjs/server";
import { getStoreAdmin } from "@/lib/actions/user-actions";
import { SlideTransition } from "../payments/anims/AnimatedCard";

const BTCBalance = async () => {
  const user = await currentUser();
  if (!user) {
    return <div>User not found</div>;
  }

  const admin = await getStoreAdmin({ userId: user.id });
  if (!admin?.storeId) {
    return <div>Store not found</div>;
  }
  const { onchainUSD, lightningUSD } = await getBTCBalanceInUSD({
    storeId: admin.storeId,
  });

  return (
    <SlideTransition show={true}>
      <Card className="border border-gray-600 rounded-xl shadow-lg mb-3 max-w-7xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl flex items-center gap-3 font-monaSans font-semibold">
            <BadgeDollarSign className="w-6 h-6" />
            <span>BTC Balance</span>
          </CardTitle>
          <CardDescription>
            This is the balance we currently have on our BTC server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            <Card className="border border-gray-600 rounded-xl shadow-lg mt-3">
              <div className="p-4">
                <p className="text-lg text-gray-500">On-Chain BTC Balance</p>
                <div className="flex space-x-4">
                  <p className="text-lg md:text-2xl flex items-center gap-2">
                    <Bitcoin className="w-6 h-6 text-yellow-300" />≈{" "}
                    <span className="text-green-500">
                      ${onchainUSD.toFixed(2)}
                    </span>{" "}
                    USD
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border border-gray-600 rounded-xl shadow-lg mt-3">
              <div className="p-4">
                <p className="text-lg text-gray-500">Lightning BTC Balance</p>
                <div className="flex space-x-4">
                  <p className="text-lg md:text-2xl flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-300" />≈{" "}
                    <span className="text-green-500">
                      ${lightningUSD.toFixed(2)}
                    </span>{" "}
                    USD
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </SlideTransition>
  );
};

export default BTCBalance;
