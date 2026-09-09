import React from 'react';
import { useTheme } from '../../../../hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

const THEMES = [
    {
        id: 'light',
        label: 'Light',
        Icon: Sun,
        /* mini UI colours */
        nav:    'bg-white',
        navBar: 'bg-slate-100',
        sidebar:'bg-slate-50',
        card:   'bg-white border-slate-200',
        accent: 'bg-gradient-to-r from-[#c99b43] to-[#e2af5b]',
        text:   'bg-slate-300',
        subtext:'bg-slate-200',
        ring:   'ring-slate-200',
    },
    {
        id: 'dark',
        label: 'Dark',
        Icon: Moon,
        nav:    'bg-slate-950',
        navBar: 'bg-slate-900',
        sidebar:'bg-slate-900',
        card:   'bg-slate-800 border-slate-700',
        accent: 'bg-gradient-to-r from-[#c99b43] to-[#e2af5b]',
        text:   'bg-slate-600',
        subtext:'bg-slate-700',
        ring:   'ring-slate-700',
    },
];

function ThemePreview({ t }) {
    return (
        /* Outer shell: browser-chrome look */
        <div className={`overflow-hidden rounded-lg shadow-md ring-1 ${t.ring}`}>
            {/* Topbar */}
            <div className={`flex items-center gap-1 px-2 py-1.5 ${t.navBar}`}>
                <div className="h-1.5 w-1.5 rounded-full bg-red-400 opacity-80" />
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 opacity-80" />
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 opacity-80" />
                <div className={`ml-2 h-1.5 flex-1 rounded-full ${t.subtext} opacity-60`} />
            </div>
            {/* Layout */}
            <div className={`flex ${t.nav}`} style={{ minHeight: 52 }}>
                {/* Sidebar */}
                <div className={`w-8 flex-shrink-0 px-1 py-1.5 space-y-1 ${t.sidebar}`}>
                    {[1,2,3].map(i => (
                        <div key={i} className={`h-1 rounded-full ${i === 1 ? t.accent : t.subtext}`} />
                    ))}
                </div>
                {/* Content */}
                <div className="flex-1 p-1.5 space-y-1">
                    {/* Stat cards row */}
                    <div className="flex gap-1">
                        {[1,2,3].map(i => (
                            <div key={i} className={`flex-1 rounded border px-1 py-1 ${t.card}`}>
                                <div className={`mb-0.5 h-1 w-4 rounded-full ${t.accent}`} />
                                <div className={`h-1 w-3 rounded-full ${t.text}`} />
                            </div>
                        ))}
                    </div>
                    {/* Table rows */}
                    {[1,2].map(i => (
                        <div key={i} className={`h-2 w-full rounded ${t.subtext}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function AppearanceSettings() {
    const { theme, setTheme, toggleTheme } = useTheme();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            {/* Header */}
            <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-800 dark:text-white">Appearance</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Choose your dashboard theme</p>
            </div>

            <div className="p-4 space-y-4">
                {/* Theme cards */}
                <div className="grid grid-cols-2 gap-3">
                    {THEMES.map((t) => {
                        const isActive = theme === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`group relative rounded-xl border-2 p-2.5 text-left transition-all duration-200 focus:outline-none ${
                                    isActive
                                        ? 'border-[#c99b43] shadow-lg shadow-[#c99b43]/10'
                                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                                }`}
                            >
                                {/* Selected badge */}
                                {isActive && (
                                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c99b43] shadow-md">
                                        <svg className="h-2 w-2 text-white" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                )}

                                {/* Mini UI preview */}
                                <ThemePreview t={t} />

                                {/* Label row */}
                                <div className="mt-2 flex items-center gap-1.5">
                                    <t.Icon className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-[#c99b43]' : 'text-slate-400'}`} />
                                    <span className={`text-[11px] font-bold ${isActive ? 'text-[#c99b43]' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {t.label}
                                    </span>
                                    {isActive && (
                                        <span className="ml-auto rounded-md bg-[#c99b43]/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#c99b43]">
                                            Active
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-900 dark:text-slate-600">quick toggle</span>
                    </div>
                </div>

                {/* Toggle row */}
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2.5">
                        {theme === 'dark'
                            ? <Moon className="h-3.5 w-3.5 text-[#c99b43]" />
                            : <Sun className="h-3.5 w-3.5 text-[#c99b43]" />
                        }
                        <div>
                            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                {theme === 'dark' ? 'Dark mode on' : 'Light mode on'}
                            </p>
                            <p className="text-[9px] text-slate-400">Click to switch</p>
                        </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c99b43] focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                            theme === 'dark' ? 'bg-[#c99b43]' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                    >
                        <span
                            className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
                                theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                        >
                            {theme === 'dark'
                                ? <Moon className="h-2 w-2 text-[#c99b43]" />
                                : <Sun className="h-2 w-2 text-slate-400" />
                            }
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
