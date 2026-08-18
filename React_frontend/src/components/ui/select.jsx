import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

function Select({
    className,
    options = [],
    value,
    onChange,
    placeholder = 'Select an option',
    ...props
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className={cn(
                    'appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-[#C99B43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-600',
                    className,
                )}
                {...props}
            >
                {placeholder ? <option value="">{placeholder}</option> : null}
                {options.map((option) => (
                    <option key={option.value ?? option} value={option.value ?? option}>
                        {option.label ?? option}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
        </div>
    )
}

export { Select }
