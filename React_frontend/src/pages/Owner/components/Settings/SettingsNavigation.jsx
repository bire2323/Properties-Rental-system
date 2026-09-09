import React from 'react';
import { cn } from '@/lib/utils';
import { User, MapPin, Shield, BadgeCheck, Palette, Bell, Trash2 } from 'lucide-react';

const tabs = [
    { id: 'profile',       label: 'Profile',       icon: User },
    { id: 'general',       label: 'General',       icon: MapPin },
    { id: 'security',      label: 'Security',      icon: Shield },
    { id: 'verification',  label: 'Verification',  icon: BadgeCheck },
    { id: 'appearance',    label: 'Appearance',    icon: Palette },
    { id: 'notifications', label: 'Alerts',        icon: Bell },
    { id: 'account',       label: 'Account',       icon: Trash2 },
];

export default function SettingsNavigation({ activeTab, setActiveTab }) {
    return (
        <>
            {/* Vertical sidebar — md+ */}
            <nav className="hidden md:flex md:flex-col md:gap-0.5 md:rounded-2xl md:border md:border-slate-200/80 md:bg-white md:p-1.5 md:shadow-sm dark:md:border-slate-800/80 dark:md:bg-slate-900">
                {tabs.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-gradient-to-r from-[#c99b43] to-[#e2af5b] text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                            )}
                        >
                            <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500')} />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Horizontal scrollable pills — mobile only */}
            <div className="relative md:hidden">
                <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-950" />
                <nav className="flex gap-1.5 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
                    {tabs.map(({ id, label, icon: Icon }) => {
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={cn(
                                    'flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all duration-150',
                                    isActive
                                        ? 'bg-gradient-to-r from-[#c99b43] to-[#e2af5b] text-white shadow-md shadow-[#c99b43]/25'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800'
                                )}
                            >
                                <Icon className="h-3 w-3" />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
