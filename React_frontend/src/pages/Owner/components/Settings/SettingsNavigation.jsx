import React from 'react';
import { cn } from '@/lib/utils';

export default function SettingsNavigation({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'profile', label: 'Profile' },
        { id: 'general', label: 'General' },
        { id: 'security', label: 'Security' },
        { id: 'verification', label: 'Verification' },
        { id: 'appearance', label: 'Appearance' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'account', label: 'Account' },
    ];

    return (
        <div className="w-full relative">
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pointer-events-none md:hidden" />
            <nav className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar" aria-label="Settings navigation">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-shrink-0 rounded-full px-4 py-2 text-[11px] sm:text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-[#c99b43] text-white shadow-sm dark:bg-[#c99b43] dark:text-slate-950"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800"
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
