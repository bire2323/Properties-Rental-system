import React from 'react';

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
        <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-md px-1 py-1">
            <nav className="flex space-x-4 md:space-x-8 overflow-x-auto whitespace-nowrap px-1 scrollbar-hide" aria-label="Settings navigation">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap border-b-2 px-1 py-2 text-xs md:text-sm font-medium transition-colors ${
                                isActive
                                    ? 'border-[#c99b43] text-[#c99b43]'
                                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
