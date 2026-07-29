"use client";

interface PaymentStatusProps {
  success: boolean;
  transactionId?: string;
  error?: string;
  onReset: () => void;
}

export default function PaymentStatus({
  success,
  transactionId,
  error,
  onReset,
}: PaymentStatusProps) {
  return (
    <div className="text-center w-full">
      {success ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white">
            Payment Successful!
          </h2>
          {transactionId && (
            <p className="text-sm text-white/80">
              Transaction ID: <span className="font-mono">{transactionId}</span>
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white">Payment Failed</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      <button
        onClick={onReset}
        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-white hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {success ? "Make Another Payment" : "Try Again"}
      </button>
    </div>
  );
}
