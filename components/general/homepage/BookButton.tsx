import { Link } from "next-view-transitions";

const BookButton = () => {
  return (
    <span className="bg-foreground text-background px-4 py-2 rounded hover:bg-foreground/90 transition-colors duration-300">
      <Link
        href="https://book.squareup.com/appointments/h6gg4rjdxvgfvc/location/L79TC2VHXDFKG/services"
        className="text-background"
      >
        Try Now!
      </Link>
    </span>
  );
};

export default BookButton;
