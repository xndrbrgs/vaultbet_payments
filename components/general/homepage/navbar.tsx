import { Link } from "next-view-transitions";
import Image from "next/image";
import BookButton from "./BookButton";

const Navbar = () => {
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Testimonials", href: "/testimonials" },
    { name: "FAQ", href: "/faq" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="flex items-center text-center justify-between px-[clamp(16px,32px)] py-2 border-b border-gray-200">
      <div className="flex items-center space-x-12">
        <div className="relative size-16">
          <Image
            src="/images/FirstHealth.png"
            fill
            alt="Logo"
            className="object-cover"
          />
        </div>
        <ul className="flex space-x-6 items-center">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className="text-gray-700 hover:text-gray-500 transition-colors duration-300"
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <BookButton />
    </nav>
  );
};

export default Navbar;
