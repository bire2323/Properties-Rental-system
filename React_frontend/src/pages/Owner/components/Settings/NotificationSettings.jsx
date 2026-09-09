import React, { useState } from 'react';
import { Home, CalendarCheck, UserCog, Save } from 'lucide-react';

const Toggle = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-4.5 h-[18px] w-8 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#c99b43] focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${checked ? 'bg-[#c99b43]' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
        <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
);

const Row = ({ title, description, settingKey, notifications, toggle }) => (
    <div className="flex items-center justify-between py-2">
        <div className="min-w-0 pr-3">
            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">{title}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">{description}</p>
        </div>
        <Toggle checked={notifications[settingKey]} onChange={() => toggle(settingKey)} />
    </div>
);

const Group = ({ icon: Icon, label, children }) => (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <Icon className="h-2.5 w-2.5 text-[#c99b43]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</span>
        </div>
        <div className="divide-y divide-slate-100 px-3 dark:divide-slate-800">
            {children}
        </div>
    </div>
);

export default function NotificationSettings() {
    const [notifications, setNotifications] = useState({
        newPropertyActivity:   true,
        propertyApproval:      true,
        propertyStatus:        true,
        newBookingRequests:    true,
        bookingConfirmations:  true,
        bookingCancellations:  true,
        verificationUpdates:   true,
        securityAlerts:        true,
        platformAnnouncements: false,
    });
    const [isSaving, setIsSaving] = useState(false);

    const toggle = (key) => setNotifications(p => ({ ...p, [key]: !p[key] }));

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert('Future implementation: Notification preferences save API required.');
        }, 600);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 space-y-2">
            <Group icon={Home} label="Property">
                <Row title="Property activity"    description="Someone interacts with your listings"    settingKey="newPropertyActivity"  notifications={notifications} toggle={toggle} />
                <Row title="Approval updates"     description="Approved or rejected submissions"        settingKey="propertyApproval"     notifications={notifications} toggle={toggle} />
                <Row title="Status changes"       description="Properties rented or available"          settingKey="propertyStatus"       notifications={notifications} toggle={toggle} />
            </Group>

            <Group icon={CalendarCheck} label="Bookings">
                <Row title="New requests"         description="Tenant books your property"              settingKey="newBookingRequests"   notifications={notifications} toggle={toggle} />
                <Row title="Confirmations"        description="Booking confirmed, payment received"     settingKey="bookingConfirmations" notifications={notifications} toggle={toggle} />
                <Row title="Cancellations"        description="Booking cancelled"                       settingKey="bookingCancellations" notifications={notifications} toggle={toggle} />
            </Group>

            <Group icon={UserCog} label="Account">
                <Row title="Verification"         description="Owner verification status changes"       settingKey="verificationUpdates"  notifications={notifications} toggle={toggle} />
                <Row title="Security alerts"      description="New logins, password changes"            settingKey="securityAlerts"       notifications={notifications} toggle={toggle} />
                <Row title="Announcements"        description="News and feature updates"                settingKey="platformAnnouncements" notifications={notifications} toggle={toggle} />
            </Group>

            <div className="flex justify-end pt-0.5">
                <button onClick={handleSave} disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#c99b43] to-[#e2af5b] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-[#c99b43]/20 transition hover:from-[#b08838] hover:to-[#c99b43] disabled:opacity-60">
                    <Save className="h-2.5 w-2.5" />
                    {isSaving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </div>
    );
}
