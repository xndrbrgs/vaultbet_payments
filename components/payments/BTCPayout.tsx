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
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/components/ui/toast";
import { BadgeDollarSign, Bitcoin, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import BitcoinAnimation from "./payment-wrappers/BitcoinAnim";
import Image from "next/image";
import { SlideTransition } from "./anims/AnimatedCard";

const formSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Amount can have at most 2 decimal places"),
  recipientEmail: z.string().email("Invalid email address"),
  personName: z.string().min(1, "Recipient name is required"),
  recipientAddress: z.string().min(1, "Recipient BTC address is required"),
  paymentDescription: z.string().min(1, "Payment description is required"),
  storeId: z.string().min(1, "Store ID is required"),
});

type PaymentProps = {
  email: string;
  stores: Array<{
    id: string;
    name: string;
    storeImg: string;
  }>;
};

export function BTCPayoutForm({ email, stores }: PaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      recipientEmail: email,
      recipientAddress: "",
      paymentDescription: "",
      personName: "",
      storeId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/btcpay/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: values.amount,
          description: values.paymentDescription,
          recipientEmail: email,
          recipientAddress: values.recipientAddress,
          personName: values.personName,
          storeId: values.storeId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create BTCPay payout");
      }

      await res.json();
      setIsSuccess(true);
    } catch (error) {
      console.error("BTCPay payout error:", error);
      toast.add({
        title: "Payout Failed",
        description: "An error occurred while initiating the payout.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SlideTransition show={true}>
      <Card className="border border-gray-600 rounded-xl shadow-lg mt-3 max-w-7xl z-10 overflow-visible">
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CardHeader className="border-b border-gray-600">
            <CardTitle className="text-2xl md:text-3xl font-monaSans font-semibold flex items-center space-x-3">
              <Bitcoin className="w-7 h-7 text-green-400" />
              <span>BTC On-Chain Payout</span>
            </CardTitle>
            <CardDescription className="text-sm text-gray-700">
              Receive BTC payouts directly to your on-chain BTC address!
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSuccess ? (
              <BitcoinAnimation />
            ) : (
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-y-5"
              >
                <FieldGroup className="grid grid-cols-12 gap-x-5 gap-y-6 lg:gap-y-0 space-y-0 mt-4">
                  <div className="col-span-12 lg:col-span-6 pt-3">
                    <Controller
                      name="personName"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="btc-payout-personName">
                            What's your name on Facebook?
                          </FieldLabel>
                          <Input
                            id="btc-payout-personName"
                            type="text"
                            placeholder="Please write first and last name"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="col-span-12 lg:col-span-6 pt-0 md:pt-3">
                    <Controller
                      name="paymentDescription"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="btc-payout-paymentDescription">
                            Which game did you play?
                          </FieldLabel>
                          <Input
                            id="btc-payout-paymentDescription"
                            placeholder="Please write game name"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="col-span-12 lg:col-span-6 pt-0 md:pt-3">
                    <Controller
                      name="recipientAddress"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="btc-payout-recipientAddress">
                            BTC Address
                          </FieldLabel>
                          <Input
                            id="btc-payout-recipientAddress"
                            type="text"
                            placeholder="bc1q..."
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
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
                          <FieldLabel htmlFor="btc-payout-amount">
                            Max cashout per day:{" "}
                            <span className="text-green-500">$300</span>
                          </FieldLabel>
                          <Select
                            name={field.name}
                            value={field.value?.toString()}
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                          >
                            <SelectTrigger
                              id="btc-payout-amount"
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder="Select amount" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 5, 10, 300, 1000].map((value) => (
                                <SelectItem
                                  key={value}
                                  value={value.toString()}
                                  className="py-2 border-b border-yellowish"
                                >
                                  ${value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

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
                                  className={
                                    selectedStore ? "" : "text-gray-400"
                                  }
                                >
                                  {selectedStore
                                    ? selectedStore.name
                                    : "Select a store"}
                                </span>
                                <motion.span
                                  animate={{
                                    rotate: isStoreDropdownOpen ? 180 : 0,
                                  }}
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeOut",
                                  }}
                                >
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                </motion.span>
                              </button>

                              <AnimatePresence>
                                {isStoreDropdownOpen && (
                                  <motion.div
                                    role="listbox"
                                    initial={{
                                      opacity: 0,
                                      y: -8,
                                      scaleY: 0.95,
                                    }}
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
                                          aria-selected={
                                            store.id === field.value
                                          }
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

                  {/* <div className="col-span-12 mt-3">
                  <Controller
                    name="storeId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="payment-form-storeId">
                          Game Provider
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
                                  stores.find(
                                    (store) => store.id === field.value,
                                  )?.name
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
                                  <div className="relative flex items-center text-center space-x-3">
                                    <Image
                                      src={store.storeImg}
                                      alt={store.name}
                                      width={60}
                                      height={60}
                                    />
                                    <span className="text-sm">
                                      {store.name}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Select the game provider for your transfer.
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div> */}
                </FieldGroup>

                <div className="mb-5 flex items-center w-full justify-center">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-4 w-fit cursor-pointer"
                  >
                    {isLoading ? "Processing..." : "Request BTC Payout"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </motion.section>
      </Card>
    </SlideTransition>
  );
}
