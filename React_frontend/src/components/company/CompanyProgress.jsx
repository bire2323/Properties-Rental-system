import { Check } from 'lucide-react'

export default function CompanyProgress({ currentStep, totalSteps }) {
    const progress = ((currentStep - 1) / Math.max(totalSteps - 1, 1)) * 100

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 sm:hidden">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{currentStep === totalSteps ? 'Review' : `Step ${currentStep}`}</span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 sm:hidden">
                <div
                    className="h-full rounded-full bg-[#c99b43] transition-all duration-300"
                    style={{ width: `${((currentStep / totalSteps) * 100)}%` }}
                />
            </div>

            <div className="relative hidden sm:block">
                <div className="absolute left-8 right-8 top-5 h-0.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div
                    className="absolute left-8 top-5 h-0.5 rounded-full bg-[#c99b43] transition-all duration-300"
                    style={{ width: `calc(${progress}% - 3.25rem)` }}
                />

                <div className="relative flex items-start justify-between gap-2">
                    {Array.from({ length: totalSteps }, (_, index) => {
                        const stepNumber = index + 1
                        const completed = currentStep > stepNumber
                        const active = currentStep === stepNumber

                        return (
                            <div key={stepNumber} className="flex w-1/5 min-w-0 flex-col items-center text-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white shadow-sm dark:bg-slate-950">
                                    {completed ? (
                                        <Check className="h-4 w-4 text-[#c99b43]" />
                                    ) : (
                                        <span className={`text-sm font-semibold ${active ? 'text-[#c99b43]' : 'text-slate-400'}`}>
                                            {stepNumber}
                                        </span>
                                    )}
                                </div>
                                <span className={`mt-2 text-[10px] font-medium sm:text-[11px] ${active ? 'text-[#c99b43]' : completed ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                                    {stepNumber === 1 && 'Identity'}
                                    {stepNumber === 2 && 'Contact'}
                                    {stepNumber === 3 && 'Location'}
                                    {stepNumber === 4 && 'Documents'}
                                    {stepNumber === 5 && 'Review'}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
