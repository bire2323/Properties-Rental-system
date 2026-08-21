import React from 'react';
import { useTheme } from '../../../../hooks/useTheme';

export default function AppearanceSettings() {
    const { theme, setTheme, toggleTheme } = useTheme();

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-1">
                <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Appearance</h3>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Customize the look and feel of your dashboard.
                </p>
            </div>

            <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
                    <button
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 md:p-6 transition-all ${
                            theme === 'light'
                                ? 'border-[#c99b43] bg-amber-50/30'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
                        }`}
                    >
                        <div className="rounded-full bg-slate-100 p-2 md:p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span className={`mt-3 md:mt-4 text-sm md:text-base font-medium ${theme === 'light' ? 'text-[#c99b43]' : 'text-slate-900 dark:text-white'}`}>Light Mode</span>
                    </button>

                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 md:p-6 transition-all ${
                            theme === 'dark'
                                ? 'border-[#c99b43] bg-amber-900/10 dark:bg-amber-900/10'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
                        }`}
                    >
                        <div className="rounded-full bg-slate-100 p-2 md:p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </div>
                        <span className={`mt-3 md:mt-4 text-sm md:text-base font-medium ${theme === 'dark' ? 'text-[#c99b43]' : 'text-slate-900 dark:text-white'}`}>Dark Mode</span>
                    </button>
                </div>
                
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex items-center justify-between">
                    <div>
                        <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white">Quick Toggle</h4>
                        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1">Quickly switch between light and dark mode.</p>
                    </div>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className={`relative inline-flex h-5 w-9 md:h-6 md:w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#c99b43] focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                            theme === 'dark' ? 'bg-[#c99b43]' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                    >
                        <span
                            className={`inline-block h-3.5 w-3.5 md:h-4 md:w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                                theme === 'dark' ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}
