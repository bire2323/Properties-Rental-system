import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import SettingsNavigation from './components/Settings/SettingsNavigation';
import ProfileSettings from './components/Settings/ProfileSettings';
import GeneralSettings from './components/Settings/GeneralSettings';
import SecuritySettings from './components/Settings/SecuritySettings';
import VerificationSettings from './components/Settings/VerificationSettings';
import AppearanceSettings from './components/Settings/AppearanceSettings';
import NotificationSettings from './components/Settings/NotificationSettings';
import AccountSettings from './components/Settings/AccountSettings';
import { Settings } from 'lucide-react';

export default function OwnerSettings() {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c99b43] border-t-transparent" />
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':       return <ProfileSettings />;
            case 'general':       return <GeneralSettings />;
            case 'security':      return <SecuritySettings />;
            case 'verification':  return <VerificationSettings />;
            case 'appearance':    return <AppearanceSettings />;
            case 'notifications': return <NotificationSettings />;
            case 'account':       return <AccountSettings />;
            default:              return <ProfileSettings />;
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-4">
            {/* Compact header strip */}
            <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#c99b43] to-[#e2af5b] shadow-md shadow-[#c99b43]/30">
                    <Settings className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Settings</h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Profile, security &amp; preferences</p>
                </div>
            </div>

            {/* Two-column layout on md+, stacked on mobile */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
                {/* Left: sidebar nav */}
                <div className="md:w-44 md:flex-shrink-0">
                    <SettingsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                {/* Right: content panel */}
                <div className="min-w-0 flex-1">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
