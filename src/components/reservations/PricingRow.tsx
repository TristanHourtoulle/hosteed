interface PricingRowProps {
  label: string
  value: string
  bold?: boolean
  color?: string
  indent?: boolean
}

export function PricingRow({ label, value, bold, color, indent }: PricingRowProps) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${indent ? 'pl-4' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-sm font-medium ${color || (bold ? 'text-gray-900' : 'text-gray-800')}`}>
        {value}
      </span>
    </div>
  )
}
