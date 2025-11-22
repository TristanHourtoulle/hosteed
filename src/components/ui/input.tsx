import { InputHTMLAttributes, forwardRef } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', type, ...props }, ref) => {
    const baseStyles =
      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50'

    // Add custom styling for time inputs to ensure proper format
    const timeStyles = type === 'time' ? '[&::-webkit-datetime-edit-fields-wrapper]:px-0' : ''

    return (
      <input
        type={type}
        className={`${baseStyles} ${timeStyles} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
