interface CheckboxItemProps {
  id: string
  name: string
  checked: boolean
  onChange: () => void
  colorScheme: 'emerald' | 'orange' | 'red' | 'blue' | 'indigo' | 'purple'
}

export default function CheckboxItem({
  name,
  checked,
  onChange,
  colorScheme,
}: CheckboxItemProps) {
  const colorClasses = {
    emerald: {
      border: checked ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300',
      checkBorder: checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300',
    },
    orange: {
      border: checked ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-300',
      checkBorder: checked ? 'border-orange-500 bg-orange-500' : 'border-slate-300',
    },
    red: {
      border: checked ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-red-300',
      checkBorder: checked ? 'border-red-500 bg-red-500' : 'border-slate-300',
    },
    blue: {
      border: checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300',
      checkBorder: checked ? 'border-blue-500 bg-blue-500' : 'border-slate-300',
    },
    indigo: {
      border: checked ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300',
      checkBorder: checked ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300',
    },
    purple: {
      border: checked ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-300',
      checkBorder: checked ? 'border-purple-500 bg-purple-500' : 'border-slate-300',
    },
  }

  const colors = colorClasses[colorScheme]

  return (
    <label
      className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${colors.border}`}
    >
      <input type='checkbox' checked={checked} onChange={onChange} className='sr-only' />
      <div className='flex items-center space-x-2 w-full'>
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${colors.checkBorder}`}
        >
          {checked && (
            <svg className='w-2 h-2 text-white' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
          )}
        </div>
        <span className='text-xs font-medium text-slate-700 truncate'>{name}</span>
      </div>
    </label>
  )
}
