import { Link } from "next-view-transitions";
import { SignInButton } from "@clerk/nextjs";

const BookButton = () => {
  return (
    <div className="bg-foreground rounded hover:bg-foreground/90 transition-colors duration-300 hover:cursor-pointer">
      <SignInButton>
        <button className="text-background px-4 py-2">Sign In</button>
      </SignInButton>
    </div>
  );
};

export default BookButton;
