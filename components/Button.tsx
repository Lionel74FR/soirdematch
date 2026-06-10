import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-lg px-5 py-2.5 font-montserrat font-semibold transition-colors",
        variant === "primary" && "bg-coral text-cream hover:bg-rose",
        variant === "secondary" && "bg-navy2 text-cream hover:bg-navy",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
