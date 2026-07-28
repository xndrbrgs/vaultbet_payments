import { Link } from "next-view-transitions";
import { SignInButton } from "@clerk/nextjs";

const BookButton = () => {
  return (
    <SignInButton>
      <button className="bg-foreground text-background px-4 py-2 rounded hover:bg-foreground/90 transition-colors duration-300">
        Sign In
      </button>
    </SignInButton>
  );
};

export default BookButton;
