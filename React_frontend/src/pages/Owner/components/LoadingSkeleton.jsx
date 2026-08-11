export default function LoadingSkeleton({ type = 'card' }) {
    if (type === 'table') {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                    <div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center justify-between gap-3">
                            <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                            <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                            <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                            <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                            <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => (
                <div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-4">
                        <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                        <div className="h-10 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="mt-6 space-y-3">
                        <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>
            ))}
        </div>
    )
}
