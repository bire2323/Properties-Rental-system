export default function OwnerMessages() {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Messages</h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Your tenant and booking messages will appear here.</p>
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">No messages available yet</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Message support will be enabled when the backend is ready.</p>
            </div>
        </div>
    )
}
