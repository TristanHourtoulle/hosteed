import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex hover:cursor-pointer items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'flex py-[12.5px] px-5 items-center gap-[10px] rounded-full bg-gradient-to-r from-[#015993] to-[#0379C7] text-white shadow-xs hover:opacity-90',
        destructive:
          'flex py-[12.5px] px-5 items-center gap-[10px] rounded-full bg-red-600 text-white shadow-xs hover:bg-red-700 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40',
        outline:
          'flex py-[12.5px] px-5 items-center gap-[10px] rounded-full border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'flex py-[12.5px] px-5 items-center gap-[10px] rounded-full border-[1.5px] border-[#015993] bg-white text-[#015993] shadow-xs hover:bg-gray-50',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-[45px]',
        sm: 'py-2 px-4 gap-1.5 min-h-[36px]',
        lg: 'py-4 px-6 gap-3 min-h-[52px]',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
