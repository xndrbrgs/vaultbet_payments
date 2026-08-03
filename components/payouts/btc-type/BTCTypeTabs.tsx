import { SlideTransition } from "@/components/payments/anims/AnimatedCard";
import { BTCLightningForm } from "@/components/payments/BTCLightningForm";
import { BTCPayoutForm } from "@/components/payments/BTCPayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Landmark } from "lucide-react";

type PaymentProps = {
  email: string;
  stores: Array<{
    id: string;
    name: string;
    storeImg: string;
  }>;
};

export async function BTCTypeTabs({ email, stores }: PaymentProps) {
  return (
    <SlideTransition show={true}>
      <Card className="border border-gray-600 rounded-xl shadow-lg mt-3 max-w-7xl z-10 overflow-visible">
        <CardHeader className="border-b border-gray-600">
          <CardTitle className="text-2xl md:text-3xl font-monaSans font-semibold flex items-center space-x-3">
            <Landmark className="w-7 h-7" />
            <span>Request BTC Payout</span>
          </CardTitle>
          <CardDescription className="text-sm text-gray-700">
            Receive BTC payouts directly to your BTC address!
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="onchain">
            <TabsList>
              <TabsTrigger value="onchain">BTC On-Chain</TabsTrigger>
              <TabsTrigger value="lightning">BTC Lightning ⚡</TabsTrigger>
            </TabsList>
            <TabsContent value="onchain">
              <BTCPayoutForm email={email} stores={stores} />
            </TabsContent>
            <TabsContent value="lightning">
              <BTCLightningForm email={email} stores={stores} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </SlideTransition>
  );
}
