"use client";

import { useEffect, useRef, useState } from "react";
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
import { AnimatePresence, motion } from "framer-motion";
import { BadgeDollarSign, ChevronDown } from "lucide-react";
import { toast } from "@/components/ui/toast";
import Image from "next/image";
import { SlideTransition } from "./anims/AnimatedCard";

type PaymentProps = {
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
  storeId: z.string().min(1, "Recipient is required"),
});

export function PaymentForm({ email, stores }: PaymentProps) {
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
      storeId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const selectedStore = stores.find((store) => store.id === values.storeId);

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

  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        storeDropdownRef.current &&
        !storeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SlideTransition show={true}>
      <Card className="border border-gray-600 rounded-xl shadow-lg mt-3 max-w-7xl z-10 overflow-visible">
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CardHeader className="border-b border-gray-600">
            <CardTitle className="text-2xl md:text-3xl flex items-center space-x-3 font-monaSans font-semibold">
              <BadgeDollarSign className="w-7 h-7" />
              <span>Perform Transfer</span>
            </CardTitle>
            <CardDescription className="text-sm text-gray-700">
              Pay via your favorite BTC payment method!
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

                {/* <div className="col-span-12 mt-3">
                <Controller
                  name="storeId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="payment-form-storeId">
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
                          form.setValue("storeId", selectedStore?.id || "");
                        }}
                      >
                        <SelectTrigger
                          id="payment-form-storeId"
                          aria-invalid={fieldState.invalid}
                        >
                          {field.value ? (
                            <span className="flex items-center space-x-2">
                              {
                                stores.find((store) => store.id === field.value)
                                  ?.name
                              }
                            </span>
                          ) : (
                            <SelectValue placeholder="Select a store" />
                          )}
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
              </div> */}

                <div className="col-span-12 mt-3">
                  <Controller
                    name="storeId"
                    control={form.control}
                    render={({ field, fieldState }) => {
                      const selectedStore = stores.find(
                        (store) => store.id === field.value,
                      );

                      return (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="payment-form-storeId">
                            Game Provider
                          </FieldLabel>

                          <div className="relative" ref={storeDropdownRef}>
                            <button
                              type="button"
                              id="payment-form-storeId"
                              aria-invalid={fieldState.invalid}
                              aria-expanded={isStoreDropdownOpen}
                              aria-haspopup="listbox"
                              onClick={() =>
                                setIsStoreDropdownOpen((prev) => !prev)
                              }
                              onBlur={field.onBlur}
                              className="flex w-full items-center justify-between rounded-md border  bg-transparent px-3 py-2 text-sm shadow-sm transition-colors  aria-[invalid=true]:border-red-500"
                            >
                              <span
                                className={selectedStore ? "" : "text-gray-400"}
                              >
                                {selectedStore
                                  ? selectedStore.name
                                  : "Select a store"}
                              </span>
                              <motion.span
                                animate={{
                                  rotate: isStoreDropdownOpen ? 180 : 0,
                                }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                              >
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </motion.span>
                            </button>

                            <AnimatePresence>
                              {isStoreDropdownOpen && (
                                <motion.div
                                  role="listbox"
                                  initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                  exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                                  transition={{
                                    duration: 0.18,
                                    ease: "easeOut",
                                  }}
                                  style={{ transformOrigin: "top" }}
                                  className="absolute z-80 mt-2 w-full overflow-hidden rounded-md border border-gray-600 shadow-lg bg-background"
                                >
                                  <div className="max-h-72 overflow-y-auto py-1">
                                    {stores.map((store, index) => (
                                      <motion.button
                                        key={store.id}
                                        type="button"
                                        role="option"
                                        aria-selected={store.id === field.value}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                          duration: 0.15,
                                          delay: index * 0.03,
                                          ease: "easeOut",
                                        }}
                                        onClick={() => {
                                          field.onChange(store.id);
                                          setIsStoreDropdownOpen(false);
                                        }}
                                        className={`flex w-full items-center space-x-3 px-3 py-2 text-left text-sm transition-colors hover:bg-black/10 hover:cursor-pointer ${
                                          store.id === field.value
                                            ? "bg-white/5"
                                            : ""
                                        }`}
                                      >
                                        <div className="relative size-12">
                                          <Image
                                            src={store.storeImg}
                                            alt={store.name}
                                            fill
                                            className="object-cover"
                                          />
                                        </div>
                                        <span className="text-sm">
                                          {store.name}
                                        </span>
                                      </motion.button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <FieldDescription>
                            Select the game provider for your transfer.
                          </FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      );
                    }}
                  />
                </div>
              </FieldGroup>

              {!showBTCPay && (
                <div className="mb-5 flex items-center w-full justify-center">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="cursor-pointer"
                  >
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
                    Your browser blocked the popup — click to Continue to
                    Checkout
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
    </SlideTransition>
  );
}
