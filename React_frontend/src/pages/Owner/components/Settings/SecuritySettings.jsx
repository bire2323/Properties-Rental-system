import React, { useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { updateProfile } from '../../../../api/authApi';
import { Button } from '../../../../components/ui/button';

export default function SecuritySettings() {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [passwords, setPasswords] = useState({
        new_password: '',
        confirm_password: ''
    });
    
    const handleChange = (e) => {
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePasswordChange = async () => {
        if (!passwords.new_password || !passwords.confirm_password) {
            setMessage({ type: 'error', text: 'Please fill in both password fields.' });
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Always use FormData so the request is multipart/form-data.
            // Sending a plain JS object makes authApi.js add Content-Type: application/json,
            // which Django rejects with 415 because ProfileAPIView only has
            // parser_classes = [MultiPartParser, FormParser].
            const dataToSend = new FormData();
            dataToSend.append('new_password', passwords.new_password);
            dataToSend.append('confirm_password', passwords.confirm_password);
            const result = await updateProfile(dataToSend);
            updateUser(result.user);
            setMessage({ type: 'success', text: result.message || 'Password updated successfully.' });
            setPasswords({ new_password: '', confirm_password: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to update password.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-1">
                <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Security</h3>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Manage your account security and authentication methods.
                </p>
            </div>

            <div className="space-y-4 md:space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50">
                    <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white mb-3 md:mb-4">Authentication Method</h4>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                                {user?.auth_provider || 'Email'}
                            </p>
                            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1">
                                You are currently signed in using {user?.auth_provider || 'email'} authentication.
                            </p>
                        </div>
                    </div>
                </div>

                {(!user?.auth_provider || user?.auth_provider === 'email') && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white mb-3 md:mb-4">Change Password</h4>
                        <div className="space-y-3 md:space-y-4">
                            <div className="space-y-1 md:space-y-2">
                                <label className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                                <input
                                    type="password"
                                    name="new_password"
                                    value={passwords.new_password}
                                    onChange={handleChange}
                                    className="block w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-900 shadow-sm focus:border-[#c99b43] focus:outline-none focus:ring-1 focus:ring-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-[#c99b43] dark:focus:ring-[#c99b43]"
                                />
                            </div>
                            <div className="space-y-1 md:space-y-2">
                                <label className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={passwords.confirm_password}
                                    onChange={handleChange}
                                    className="block w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-900 shadow-sm focus:border-[#c99b43] focus:outline-none focus:ring-1 focus:ring-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-[#c99b43] dark:focus:ring-[#c99b43]"
                                />
                            </div>

                            {message.text && (
                                <div className={`p-3 rounded-md text-xs md:text-sm max-w-md ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="pt-2">
                                <Button type="button" onClick={handlePasswordChange} disabled={isLoading} className="bg-[#c99b43] text-white hover:bg-[#b0873a] dark:bg-[#c99b43] dark:hover:bg-[#b0873a] text-xs md:text-sm h-8 md:h-10">
                                    {isLoading ? 'Updating...' : 'Update Password'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
