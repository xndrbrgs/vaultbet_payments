"use client";

import { SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";

const BookButton = () => {
  return (
    <div className="bg-foreground rounded hover:bg-foreground/90 transition-colors duration-300">
      <SignInButton>
        <motion.button
          className="text-background px-4 py-2 hover:cursor-pointer"
          initial="rest"
          whileHover="hover"
          animate="rest"
        >
          <div className="flex items-center gap-4">
            <span>Sign In</span>
            <motion.span
              variants={{
                rest: { x: 0 },
                hover: { x: 4 },
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[var(--pollo)] p-[3.5] rounded text-xs text-black inline-block"
            >
              →
            </motion.span>
          </div>
        </motion.button>
      </SignInButton>
    </div>
  );
};

export default BookButton;