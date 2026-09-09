import React from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

export default function AccountSettings() {
    const { user } = useAuth();

    const formatDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

    const handleDelete = () => {
        if (window.confirm('Are you sure? This action cannot be undone.')) {
            alert('Future implementation: Account deletion API required.');
        }
    };

    const rows = [
        { label: 'Account ID',   value: user?.id || '—' },
        { label: 'Role',         value: user?.role || 'Owner' },
        { label: 'Auth',         value: user?.auth_provider || 'Email' },
        { label: 'Member Since', value: formatDate(user?.owner_profile?.created_at) },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 space-y-2.5">
            {/* Info card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Account Info</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Details &amp; permissions</p>
                </div>
                <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-2">
                            <dt className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</dt>
                            <dd className="text-[11px] font-semibold capitalize text-slate-800 dark:text-slate-200">{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-3.5 dark:border-red-900/30 dark:bg-red-900/10">
                <div className="flex items-start gap-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                        <AlertTriangle className="h-3 w-3 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-red-800 dark:text-red-300">Danger Zone</p>
                        <p className="mt-0.5 text-[9px] text-red-600 dark:text-red-400 leading-relaxed">
                            Permanently remove your account and all content. This is irreversible.
                        </p>
                        <button onClick={handleDelete}
                            className="mt-2.5 rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
