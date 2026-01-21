import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-display",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Hero buttons - big, playful, attention-grabbing
        hero: "bg-primary text-primary-foreground shadow-xl hover:shadow-2xl text-lg px-8 py-4 rounded-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200",
        heroSecondary:
          "bg-card text-foreground border-2 border-card shadow-xl hover:shadow-2xl text-lg px-8 py-4 rounded-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200",
        // Gold membership CTA
        gold: "gold-gradient text-foreground shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200",
        // Navigation
        nav: "bg-transparent text-foreground hover:text-primary font-semibold font-nunito",
        navAccent:
          "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-4",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
