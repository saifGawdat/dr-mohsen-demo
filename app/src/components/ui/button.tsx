"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-[400ms] ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary:
          "bg-gold text-black hover:bg-gold-dark active:scale-[0.98]",
        secondary:
          "bg-black text-white hover:bg-gray-800 active:scale-[0.98]",
        outline:
          "border border-black bg-transparent text-black hover:bg-black hover:text-white",
        outlineWhite:
          "border border-white bg-transparent text-white hover:bg-white hover:text-black",
        ghost:
          "bg-transparent text-black hover:bg-gray-100",
        link:
          "bg-transparent text-black underline-offset-4 hover:underline p-0 h-auto",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
        icon: "h-10 w-10",
        iconSm: "h-8 w-8",
        iconLg: "h-12 w-12",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      rounded: "none",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // When using asChild, only render the children (the slotted element)
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, rounded, fullWidth, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
