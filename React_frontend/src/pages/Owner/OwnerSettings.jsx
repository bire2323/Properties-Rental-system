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

export default function OwnerSettings() {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#c99b43]"></div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings />;
            case 'general':
                return <GeneralSettings />;
            case 'security':
                return <SecuritySettings />;
            case 'verification':
                return <VerificationSettings />;
            case 'appearance':
                return <AppearanceSettings />;
            case 'notifications':
                return <NotificationSettings />;
            case 'account':
                return <AccountSettings />;
            default:
                return <ProfileSettings />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">Settings</h2>
                    <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                        Manage your account preferences, profile, and security settings.
                    </p>
                </div>
                
                <div className="mt-4">
                    <SettingsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>

            <div>
                {renderContent()}
            </div>
        </div>
    );
}
