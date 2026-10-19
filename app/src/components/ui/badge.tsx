"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium uppercase tracking-widest transition-colors",
  {
    variants: {
      variant: {
        default: "bg-black text-white",
        gold: "bg-gold text-black",
        outline: "border border-black text-black bg-transparent",
        outlineGold: "border border-gold text-gold bg-transparent",
        muted: "bg-gray-100 text-gray-600",
        success: "bg-green-100 text-green-700",
        warning: "bg-yellow-100 text-yellow-700",
        error: "bg-red-100 text-red-700",
        new: "bg-black text-white",
        sale: "bg-red-600 text-white",
        soldOut: "bg-gray-200 text-gray-500",
      },
      size: {
        xs: "text-[10px] px-2 py-0.5",
        sm: "text-xs px-2.5 py-1",
        md: "text-xs px-3 py-1.5",
        lg: "text-sm px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  size,
  ...props
}) => {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
};

export { Badge, badgeVariants };
