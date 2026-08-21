import React from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { Button } from '../../../../components/ui/button';

export default function AccountSettings() {
    const { user } = useAuth();

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handleDeleteAccount = () => {
        if (window.confirm("Are you sure you want to deactivate or delete your account? This action cannot be undone.")) {
            alert("Future implementation: Account deletion API required.");
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-1">
                <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Account Info</h3>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    View basic account details and manage account deletion.
                </p>
            </div>

            <div className="space-y-4 md:space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <dl className="divide-y divide-slate-200 dark:divide-slate-800">
                        <div className="grid grid-cols-1 py-3 md:py-4 sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Account ID</dt>
                            <dd className="mt-1 text-xs md:text-sm text-slate-900 dark:text-white sm:col-span-2 sm:mt-0">{user?.id || '—'}</dd>
                        </div>
                        <div className="grid grid-cols-1 py-3 md:py-4 sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Role</dt>
                            <dd className="mt-1 text-xs md:text-sm text-slate-900 dark:text-white sm:col-span-2 sm:mt-0 capitalize">{user?.role || 'Owner'}</dd>
                        </div>
                        <div className="grid grid-cols-1 py-3 md:py-4 sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Authentication</dt>
                            <dd className="mt-1 text-xs md:text-sm text-slate-900 dark:text-white sm:col-span-2 sm:mt-0 capitalize">{user?.auth_provider || 'Email'}</dd>
                        </div>
                        <div className="grid grid-cols-1 py-3 md:py-4 sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Account Created</dt>
                            <dd className="mt-1 text-xs md:text-sm text-slate-900 dark:text-white sm:col-span-2 sm:mt-0">
                                {formatDate(user?.owner_profile?.created_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-6 dark:border-red-900/50 dark:bg-red-900/10">
                    <h4 className="text-sm md:text-base font-semibold text-red-800 dark:text-red-300">Danger Zone</h4>
                    <p className="mt-1 md:mt-2 text-xs md:text-sm text-red-700 dark:text-red-400 max-w-xl">
                        Permanently remove your account and all of your content from the platform. 
                        This action is not reversible, so please continue with caution.
                    </p>
                    <div className="mt-4 md:mt-5 flex gap-4">
                        <Button variant="destructive" onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800 text-xs md:text-sm h-8 md:h-10">
                            Delete Account
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
