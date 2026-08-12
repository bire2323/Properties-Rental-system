export default function LoadingSkeleton() {
    return (
        <div className="space-y-3">
            <div className="h-6 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />)}
            </div>
        </div>
    )
}