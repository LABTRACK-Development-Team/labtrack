import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold ring-offset-slate-950 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/50 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/30',
        destructive:
          'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-950/50 hover:from-rose-500 hover:to-red-500 border border-rose-400/30',
        outline:
          'border border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:border-slate-700 hover:text-white backdrop-blur-md shadow-sm',
        secondary:
          'bg-slate-800/90 text-slate-100 hover:bg-slate-700 border border-slate-700/60 shadow-sm',
        ghost:
          'text-slate-300 hover:bg-slate-800/60 hover:text-white',
        link:
          'text-cyan-400 underline-offset-4 hover:underline p-0 h-auto font-normal',
        warning:
          'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-950/50 hover:from-amber-500 hover:to-orange-500 border border-amber-400/30',
        success:
          'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-[11px]',
        lg: 'h-11 rounded-xl px-6 text-sm font-bold tracking-wide',
        icon: 'h-9 w-9 rounded-xl p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };