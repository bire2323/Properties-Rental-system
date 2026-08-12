import { useAuth } from '../../hooks/useAuth'

export default function Profile() {
    const { user } = useAuth()

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl font-semibold">
                    {(user?.first_name || user?.email || 'U').charAt(0)}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Role: {user?.role || 'Tenant'}</p>
                </div>
            </div>
        </div>
    )
}