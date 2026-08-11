import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../../components/ui/button'

export default function OwnerSettings() {
    const { user } = useAuth()
    const { theme, toggleTheme } = useTheme()

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h2>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">View and manage your account preferences.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Profile</h3>
                    <div className="grid gap-4 text-sm text-slate-700 dark:text-slate-200">
                        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Name</p>
                            <p className="mt-2 font-semibold text-slate-900 dark:text-white">{user?.first_name || '—'} {user?.last_name || ''}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Email</p>
                            <p className="mt-2 font-semibold text-slate-900 dark:text-white">{user?.email || '—'}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Role</p>
                            <p className="mt-2 font-semibold text-slate-900 dark:text-white">{user?.role || 'Owner'}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Appearance</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Use the application theme you prefer.</p>
                    <div className="flex flex-col gap-4">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Current theme</p>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{theme === 'dark' ? 'Dark' : 'Light'} mode</p>
                        </div>
                        {/* <Button variant="default" onClick={toggleTheme} className="w-full">
                            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
                        </Button> */}
                        <div className="flex items-center px-3 justify-between w-full">
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                            </span>

                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#c99b43] focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${theme === 'dark'
                                    ? 'bg-[#c99b43]'
                                    : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${theme === 'dark'
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
