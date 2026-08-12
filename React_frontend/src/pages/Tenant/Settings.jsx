import { useTheme } from '../../hooks/useTheme'

export default function Settings() {
    const { theme, toggleTheme } = useTheme()

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h3>
                <div className="mt-4 flex items-center gap-3">
                    <button onClick={toggleTheme} className="rounded-2xl border px-3 py-2">{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</button>
                </div>
            </div>
        </div>
    )
}