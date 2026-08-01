"use client";

import { useState, useRef } from "react";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import BookButton from "./BookButton";
import { CircleDollarSign, Inbox, Ruler } from "lucide-react";

interface SubLink {
  name: string;
  href: string;
  icon?: React.ReactNode;
  description?: string;
}

interface NavLink {
  name: string;
  href: string;
  sublinks?: SubLink[];
}

const Navbar = () => {
  const navLinks: NavLink[] = [
    {
      name: "Product",
      href: "/product",
      sublinks: [
        {
          name: "Payments",
          icon: <CircleDollarSign />,
          href: "/product/payments",
          description: "All-in-one payment tools",
        },
        {
          name: "Invoicing",
          icon: <Inbox />,
          href: "/product/invoicing",
          description: "Recurring billing tools",
        },
        {
          name: "Metrics",
          icon: <Ruler />,
          href: "/product/metrics",
          description: "Real-time analytics over your purchases and redeems",
        },
      ],
    },
    {
      name: "Solutions",
      href: "/solutions",
      sublinks: [
        { name: "For Startups", href: "/solutions/startups" },
        { name: "For Enterprise", href: "/solutions/enterprise" },
      ],
    },
    { name: "Pricing", href: "/pricing" },
    { name: "Support", href: "/contact" },
  ];

  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = (name: string) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setHoveredLink(name);
  };

  const handleLeave = () => {
    // small delay so moving from link -> dropdown doesn't close it
    closeTimeout.current = setTimeout(() => setHoveredLink(null), 100);
  };

  const activeLink = navLinks.find((link) => link.name === hoveredLink);

  return (
    <nav
      className="sticky top-0 z-50 flex items-center text-center justify-between px-[clamp(16px,32px)] py-3 border-b border-gray-200 bg-background"
      onMouseLeave={handleLeave}
    >
      <div className="flex items-center space-x-16">
        <div className="relative w-32 h-8">
          <Image
            src="/images/vaultbet.png"
            fill
            alt="Logo"
            className="object-contain"
          />
        </div>

        <ul className="flex space-x-6 items-center">
          {navLinks.map((link) => (
            <li
              key={link.name}
              className="relative"
              onMouseEnter={() => handleEnter(link.name)}
            >
              <Link
                href={link.href}
                className="text-gray-700 hover:text-gray-500 transition-colors duration-300 flex items-center gap-1 font-semibold"
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <BookButton />

      {/* Dropdown panel */}
      <AnimatePresence>
        {activeLink?.sublinks && (
          <motion.div
            key={activeLink.name}
            onMouseEnter={() => handleEnter(activeLink.name)}
            onMouseLeave={handleLeave}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 top-full w-full bg-white border-b border-gray-200 shadow-sm"
          >
            <div className="px-8 py-6 grid grid-cols-3 gap-6">
              {activeLink.sublinks.map((sub) => (
                <Link
                  key={sub.name}
                  href={sub.href}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      {sub.icon && <span>{sub.icon}</span>}
                      <p className="font-medium text-gray-900">{sub.name}</p>
                    </div>
                    {sub.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {sub.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
