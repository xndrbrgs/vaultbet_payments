"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function BitcoinAnimation() {
  return (
    <div className="relative flex flex-col items-center justify-center mt-6">
      <motion.div
        initial={{ opacity: 0, y: 100, rotate: 0 }}
        animate={{
          opacity: [0, 1, 1, 1],
          y: [50, -50, 0],
          rotate: [0, 720],
        }}
        transition={{
          duration: 2,
          ease: [0.85, 0, 0.15, 1],
          times: [0, 0.3, 0.7, 1],
        }}
      >
        <Image
          src={"/images/bitcoin.png"}
          alt="Bitcoin"
          width={96}
          height={96}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full text-center p-6"
      >
        <p className="text-green-400 text-xl">
          Your BTC payout request was successfully submitted!
        </p>
        <p className="text-gray-400 text-md">
          Someone from our team will review and process it shortly.
        </p>
      </motion.div>
    </div>
  );
}
