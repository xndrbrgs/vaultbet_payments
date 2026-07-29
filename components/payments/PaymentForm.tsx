"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { BadgeDollarSign } from "lucide-react";
import { toast } from "@/components/ui/toast";
import Image from "next/image";

type UnifiedPaymentFormProps = {
  email: string;
  stores: Array<{
    id: string;
    name: string;
    storeImg: string;
  }>;
};

const formSchema = z.object({
  amount: z.string().min(1, "Must be a positive number"),
  paymentDescription: z.string().min(1, "Payment description is required"),
  recipientId: z.string().min(1, "Recipient is required"),
});

export function PaymentForm({ email, stores }: UnifiedPaymentFormProps) {
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBTCPay, setShowBTCPay] = useState(false);
  const [btcpayData, setBTCPayData] = useState<{
    checkoutLink: string;
    qrCodeDataUrl: string;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      paymentDescription: "",
      recipientId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const selectedStore = stores.find(
        (store) => store.id === values.recipientId,
      );

      if (!selectedStore) {
        throw new Error("Selected store could not be found.");
      }

      const res = await fetch("/api/btcpay/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: values.amount,
          description: values.paymentDescription,
          storeId: selectedStore.id,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API error:", text);

        throw new Error(text);
      }

      const data = await res.json();
      // Only keep checkoutLink and qrCodeDataUrl (no lnInvoice)
      setBTCPayData({
        checkoutLink: data.checkoutLink,
        qrCodeDataUrl: data.qrCodeDataUrl,
      });
      setShowBTCPay(true);
    } catch (error) {
      console.error("Error initiating transfer:", error);
      toast.add({
        title: "Transfer Initiation Failed",
        description:
          "An error occurred while initiating the transfer. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!btcpayData) return;

    const newWindow = window.open(
      btcpayData.checkoutLink,
      "_blank",
      "noopener,noreferrer",
    );

    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed === "undefined"
    ) {
      setPopupBlocked(true);
    } else {
      setPopupBlocked(false);
    }
  }, [btcpayData]);

  return (
    <Card className="border border-gray-600 rounded-xl shadow-lg mt-3 max-w-7xl">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <CardHeader className="border-b border-gray-600">
          <CardTitle className="text-2xl md:text-3xl flex items-center space-x-3">
            <BadgeDollarSign className="w-7 h-7" />
            <span>Perform Transfer</span>
          </CardTitle>
          <CardDescription className="text-sm text-gray-400">
            Pay via CashApp using BTC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-y-5"
          >
            <FieldGroup className="grid grid-cols-12 gap-x-5 gap-y-6 lg:gap-y-0 space-y-0">
              <div className="col-span-12 lg:col-span-6 pt-3">
                <Controller
                  name="paymentDescription"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="payment-form-paymentDescription">
                        What is this payment for?
                      </FieldLabel>
                      <input
                        id="payment-form-paymentDescription"
                        type="text"
                        {...field}
                        placeholder="Enter the name of the game you are paying for."
                        aria-invalid={fieldState.invalid}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <FieldDescription>
                        Enter a description for the payment.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <div className="col-span-12 lg:col-span-6 pt-0 md:pt-3">
                <Controller
                  name="amount"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="payment-form-amount">
                        Amount
                      </FieldLabel>
                      <input
                        id="payment-form-amount"
                        type="text"
                        {...field}
                        placeholder="Enter an amount"
                        aria-invalid={fieldState.invalid}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <FieldDescription>
                        Enter the amount you want to transfer.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <div className="col-span-12 mt-3">
                <Controller
                  name="recipientId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="payment-form-recipientId">
                        Recipient
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={(value) => {
                          const selectedStore = stores.find(
                            (store) => store.id === value,
                          );
                          field.onChange(value);
                          form.setValue("recipientId", selectedStore?.id || "");
                        }}
                      >
                        <SelectTrigger
                          id="payment-form-recipientId"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select a store" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              <div className="flex">
                                <div className="relative flex items-center space-x-3">
                                  <Image
                                    src={store.storeImg}
                                    alt={store.name}
                                    width={80}
                                    height={80}
                                  />
                                  <span className="text-sm">{store.name}</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Select the recipient for your transfer.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>

            {!showBTCPay && (
              <div className="mb-5 flex items-center w-full justify-center">
                <Button type="submit" disabled={isLoading} variant="black">
                  {isLoading ? "Initiating Transfer..." : "Initiate Transfer"}
                </Button>
              </div>
            )}
          </form>

          {/* {showBTCPay && btcpayData && (
            <div className="grid grid-cols-12">
              <button
                onClick={() => {
                  const newWindow = window.open(
                    btcpayData.checkoutLink,
                    "_blank",
                    "noopener,noreferrer",
                  );

                  if (
                    !newWindow ||
                    newWindow.closed ||
                    typeof newWindow.closed === "undefined"
                  ) {
                    return; // Handle the case where the popup was blocked
                  }

                  setShowBTCPay(false);
                }}
                className="block text-black rounded-xl text-md bg-yellowish border hover:text-white hover:border-white/20 cursor-pointer shadow-sm md:col-start-5 md:col-end-9 col-span-12 mb-6 py-2 font-semibold transition duration-150"
              >
                Continue to Checkout
              </button>
            </div>
          )} */}

          {showBTCPay && btcpayData && (
            <div className="grid grid-cols-12">
              {popupBlocked ? (
                <a
                  href={btcpayData.checkoutLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowBTCPay(false)}
                  className="block text-center text-black rounded-xl text-md bg-yellowish border  hover:border-white/20 cursor-pointer shadow-sm md:col-start-5 md:col-end-9 col-span-12 mb-6 py-2 font-semibold transition duration-150"
                >
                  Your browser blocked the popup — click to Continue to Checkout
                </a>
              ) : (
                <p className="col-span-12 mb-6 text-center text-sm text-gray-400">
                  Opening checkout in a new tab...{" "}
                  <a
                    href={btcpayData.checkoutLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowBTCPay(false)}
                    className="underline hover:text-white"
                  >
                    click here if it didn&apos;t open
                  </a>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </motion.section>
    </Card>
  );
}
