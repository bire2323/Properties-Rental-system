import { ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react'

export default function CompanyFormNavigation({
    currentStep,
    totalSteps,
    isSubmitting,
    onBack,
    onNext,
    onSubmit,
    canSubmit,
}) {
    const isLastStep = currentStep >= totalSteps

    return (
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
            <button
                type="button"
                onClick={onBack}
                disabled={currentStep === 1 || isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
                <ChevronLeft className="h-4 w-4" />
                Back
            </button>

            <div className="text-xs text-slate-500 dark:text-slate-400">
                {currentStep} / {totalSteps}
            </div>

            {isLastStep ? (
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting || !canSubmit}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b08838] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Create Company
                        </>
                    )}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onNext}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b08838]"
                >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
