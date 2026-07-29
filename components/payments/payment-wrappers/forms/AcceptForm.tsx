"use client";

import type React from "react";
import valid from "card-validator";
import Image from "next/image";
import { useState } from "react";
import Script from "next/script";

interface AcceptPaymentFormProps {
  onPaymentComplete: (result: any) => void;
  onPaymentError: (error: string) => void;
  amount: number;
  recipientId: string;
  paymentDescription?: string;
  email: string;
}

export default function AcceptPaymentForm({
  onPaymentComplete,
  onPaymentError,
  amount,
  recipientId,
  paymentDescription,
  email,
}: AcceptPaymentFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [expirationDateError, setExpirationDateError] = useState("");
  const [cardType, setCardType] = useState<string | null>(null);
  const [cardNumberError, setCardNumberError] = useState("");
  const [cardCodeError, setCardCodeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  // Function to handle the Accept.js script loading
  const handleScriptLoad = () => {
    setScriptLoaded(true);
    console.log("Accept.js script loaded successfully");
  };

  const handleScriptError = () => {
    setScriptError(
      "Failed to load payment processing script. Please try again later."
    );
    console.error("Failed to load Accept.js script");
  };

  // Function to send payment data to Authorize.Net for tokenization
  const sendPaymentDataToAnet = async (e: React.FormEvent) => {
    e.preventDefault();

    const numberValidation = valid.number(cardNumber);
    const [month, year] = expirationDate.split("/").map((v) => v.trim());
    const expValidation = valid.expirationDate({ month, year });
    const cvvValidation = valid.cvv(cardCode);

    if (
      !numberValidation.isValid ||
      !expValidation.isValid ||
      !cvvValidation.isValid
    ) {
      onPaymentError("One or more fields are invalid");
      return;
    }

    if (!scriptLoaded) {
      onPaymentError("Payment system is not fully loaded. Please try again.");
      return;
    }

    // Basic validation
    if (!cardNumber || !expirationDate || !cardCode || !amount) {
      onPaymentError("Please fill in all required fields");
      return;
    }

    // Validate amount is a number
    const amountNum = amount;
    if (isNaN(amountNum) || amountNum <= 0) {
      onPaymentError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);

    try {
      // Create the card data object
      const secureData = {
        authData: {
          clientKey: process.env.NEXT_PUBLIC_AUTHORIZE_NET_CLIENT_KEY!,
          apiLoginID: process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID!,
        },
        cardData: {
          cardNumber,
          month: expirationDate.split("/")[0]?.trim(),
          year: expirationDate.split("/")[1]?.trim(),
          cardCode,
        },
      };

      // Check if Accept.js is available
      if (typeof window.Accept === "undefined") {
        throw new Error(
          "Payment system is not available. Please try again later."
        );
      }

      // Send payment data to Authorize.Net
      window.Accept.dispatchData(secureData, responseHandler);
    } catch (error) {
      setIsLoading(false);
      onPaymentError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      console.error("Payment error:", error);
    }
  };

  // Handle the response from Authorize.Net
  const responseHandler = async (response: any) => {
    try {
      if (response.messages.resultCode === "Error") {
        let errorMessage = "Payment processing failed";
        if (response.messages.message && response.messages.message.length > 0) {
          errorMessage = `${response.messages.message[0].code}: ${response.messages.message[0].text}`;
        }
        throw new Error(errorMessage);
      }

      // Send the payment nonce to your server
      const paymentData = {
        dataDescriptor: response.opaqueData.dataDescriptor,
        dataValue: response.opaqueData.dataValue,
        amount: amount,
        recipientId,
        paymentDescription,
        email,
        firstName,
        lastName,
        address,
        city,
        state,
        zipCode,
        phoneNumber,
      };

      console.log("Sending to server:", {
        dataDescriptor: paymentData.dataDescriptor ? "Present" : "Missing",
        dataValue: paymentData.dataValue ? "Present" : "Missing",
        amount: paymentData.amount,
      });

      // Process the payment on your server
      const serverResponse = await fetch("/api/process-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      // Check if the response is JSON
      const contentType = serverResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await serverResponse.text();
        throw new Error(`Server returned non-JSON response: ${textResponse}`);
      }

      const result = await serverResponse.json();

      if (!result.success) {
        throw new Error(result.error || "Payment processing failed");
      }

      // Payment successful
      onPaymentComplete(result);
    } catch (error) {
      onPaymentError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      console.error("Payment error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-5">
      {/* Load the Accept.js script */}
      <Script
        src="https://js.authorize.net/v1/Accept.js"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        strategy="lazyOnload"
      />

      {scriptError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {scriptError}
        </div>
      )}

      <span className="text-2xl">Pay With Card</span>
      <form onSubmit={sendPaymentDataToAnet} className="space-y-7">
        <div className="flex flex-col space-y-5">
          <div className="flex flex-col md:flex-row md:space-x-2 md:space-y-0 space-y-5 w-full justify-between">
            <div>
              <label
                htmlFor="firstName"
                className="block text-md font-medium text-white/80"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
                disabled={isLoading}
                required
                placeholder="John"
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-md font-medium text-white/80"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
                disabled={isLoading}
                required
                placeholder="Doe"
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-md font-medium text-white/80"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
              disabled={isLoading}
              required
              placeholder="123 PamPamPay St."
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-md font-medium text-white/80"
            >
              City
            </label>
            <input
              type="text"
              id="address"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
              disabled={isLoading}
              required
              placeholder="PPP City"
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:space-y-0 space-y-5 md:flex-row justify-between">
            <div>
              <label
                htmlFor="state"
                className="block text-md font-medium text-white/80"
              >
                State
              </label>
              <input
                type="text"
                id="address"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
                disabled={isLoading}
                required
                placeholder="NY, FL, TX"
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="zip"
                className="block text-md font-medium text-white/80"
              >
                Zip Code
              </label>
              <input
                type="text"
                id="address"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
                disabled={isLoading}
                required
                placeholder="12345"
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-md font-medium text-white/80"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              pattern="[0-9]{10}"
              inputMode="numeric"
              placeholder="1234567890"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
              disabled={isLoading}
              required
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <label
            htmlFor="cardNumber"
            className="block text-md font-medium text-white/80"
          >
            Card Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 19) {
                setCardNumber(value);

                const numberValidation = valid.number(value);
                if (numberValidation.card) {
                  setCardType(numberValidation.card.type);
                } else {
                  setCardType(null);
                }

                setCardNumberError(
                  numberValidation.isPotentiallyValid &&
                    numberValidation.isValid
                    ? ""
                    : "Invalid card number"
                );
              }
            }}
            placeholder="4111111111111111"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
            disabled={isLoading}
            required
          />
          {cardType && (
            <div className="mt-2">
              <Image
                src={`/images/card-types/${cardType}.svg`}
                alt={cardType}
                width={60}
                height={30}
                className="object-contain"
              />
            </div>
          )}

          {cardNumberError && (
            <p className="text-sm text-yellowish mt-1">{cardNumberError}</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:space-x-2 md:space-y-0 space-y-5 w-full justify-between">
          <div>
            <label
              htmlFor="expirationDate"
              className="block text-md font-medium text-white/80"
            >
              Expiration Date (MM/YYYY)
            </label>
            <input
              type="text"
              id="expirationDate"
              value={expirationDate}
              onChange={(e) => {
                const value = e.target.value;
                setExpirationDate(value);
                const [month, year] = value.split("/").map((v) => v.trim());
                const expValidation = valid.expirationDate({ month, year });
                setExpirationDateError(
                  expValidation.isValid ? "" : "Invalid expiration date"
                );
              }}
              placeholder="12/2025"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
              disabled={isLoading}
              required
            />
            {expirationDateError && (
              <p className="text-sm text-yellowish mt-1">
                {expirationDateError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="cardCode"
              className="block text-md font-medium text-white/80"
            >
              CVV
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              id="cardCode"
              value={cardCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");

                // Determine CVV length based on card type
                const expectedLength = cardType === "american-express" ? 4 : 3;

                if (value.length <= expectedLength) {
                  setCardCode(value);
                  const cvvValidation = valid.cvv(value, expectedLength);
                  setCardCodeError(cvvValidation.isValid ? "" : "Invalid CVV");
                }
              }}
              placeholder={cardType === "american-express" ? "1234" : "123"}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
              disabled={isLoading}
              required
            />

            {cardCodeError && (
              <p className="text-sm text-yellowish mt-1">{cardCodeError}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={isLoading || !scriptLoaded}
        >
          {isLoading ? "Processing..." : `Pay $${amount}`}
        </button>
      </form>
    </div>
  );
}

// Add TypeScript declaration for Accept.js
declare global {
  interface Window {
    Accept: {
      dispatchData: (data: any, callback: (response: any) => void) => void;
    };
  }
}
