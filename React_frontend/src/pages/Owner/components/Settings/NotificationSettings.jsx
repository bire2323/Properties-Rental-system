import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';

export default function NotificationSettings() {
    // Local state for UI only, no backend API available yet
    const [notifications, setNotifications] = useState({
        newPropertyActivity: true,
        propertyApproval: true,
        propertyStatus: true,
        newBookingRequests: true,
        bookingConfirmations: true,
        bookingCancellations: true,
        verificationUpdates: true,
        securityAlerts: true,
        platformAnnouncements: false,
    });

    const [isSaving, setIsSaving] = useState(false);

    const toggleNotification = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert("Future implementation: Notification preferences save API required.");
        }, 600);
    };

    const Toggle = ({ checked, onChange }) => (
        <button
            type="button"
            onClick={onChange}
            className={`relative inline-flex h-5 w-9 md:h-6 md:w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#c99b43] focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                checked ? 'bg-[#c99b43]' : 'bg-slate-300 dark:bg-slate-600'
            }`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 md:h-4 md:w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    checked ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );

    const NotificationItem = ({ title, description, settingKey }) => (
        <div className="flex items-start justify-between py-3 md:py-4">
            <div className="pr-4">
                <h5 className="text-xs md:text-sm font-medium text-slate-900 dark:text-white">{title}</h5>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">{description}</p>
            </div>
            <div className="flex-shrink-0 mt-1">
                <Toggle checked={notifications[settingKey]} onChange={() => toggleNotification(settingKey)} />
            </div>
        </div>
    );

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-1">
                <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Notifications</h3>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Manage how you receive updates and alerts.
                </p>
            </div>

            <div className="space-y-4 md:space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 md:pb-4 mb-1 md:mb-2">Property Notifications</h4>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        <NotificationItem 
                            title="New property activity" 
                            description="Get notified when someone interacts with your properties."
                            settingKey="newPropertyActivity"
                        />
                        <NotificationItem 
                            title="Property approval updates" 
                            description="Alerts when your submitted properties are approved or rejected."
                            settingKey="propertyApproval"
                        />
                        <NotificationItem 
                            title="Property status changes" 
                            description="Notifications when properties are rented out or become available."
                            settingKey="propertyStatus"
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 md:pb-4 mb-1 md:mb-2">Booking Notifications</h4>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        <NotificationItem 
                            title="New booking requests" 
                            description="Receive an alert when a tenant requests to book."
                            settingKey="newBookingRequests"
                        />
                        <NotificationItem 
                            title="Booking confirmations" 
                            description="Get notified when a booking is confirmed and payment is received."
                            settingKey="bookingConfirmations"
                        />
                        <NotificationItem 
                            title="Booking cancellations" 
                            description="Alerts for cancelled bookings."
                            settingKey="bookingCancellations"
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 md:pb-4 mb-1 md:mb-2">Account Notifications</h4>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        <NotificationItem 
                            title="Verification updates" 
                            description="Updates regarding your owner verification status."
                            settingKey="verificationUpdates"
                        />
                        <NotificationItem 
                            title="Security notifications" 
                            description="Important alerts about new logins and password changes."
                            settingKey="securityAlerts"
                        />
                        <NotificationItem 
                            title="Platform announcements" 
                            description="News, feature updates, and general platform announcements."
                            settingKey="platformAnnouncements"
                        />
                    </div>
                </div>
                
                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={isSaving} className="bg-[#c99b43] text-white hover:bg-[#b0873a] dark:bg-[#c99b43] dark:hover:bg-[#b0873a] text-xs md:text-sm h-8 md:h-10">
                        {isSaving ? 'Saving Preferences...' : 'Save Preferences'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
