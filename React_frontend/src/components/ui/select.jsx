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
                    'w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-700 outline-none transition',
                    'focus:border-[#255070] focus:ring-2 focus:ring-[#255070]/20',
                    'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
                    'dark:focus:border-[#3b7cb8] dark:focus:ring-[#3b7cb8]/20',
                    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
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
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        </div>
    )
}

export { Select }
