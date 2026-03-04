interface FieldLabelProps {
  htmlFor: string
  required?: boolean
  children: React.ReactNode
  error?: string
  className?: string
}

export function FieldLabel({ htmlFor, required, children, error, className = '' }: FieldLabelProps) {
  return (
    <div className="space-y-0.5">
      <label htmlFor={htmlFor} className={`text-sm font-medium ${error ? 'text-red-600' : 'text-slate-700'} ${className}`}>
        {children}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
