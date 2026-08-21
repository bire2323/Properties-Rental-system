import React, { useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { updateProfile } from '../../../../api/authApi';
import { Button } from '../../../../components/ui/button';

export default function GeneralSettings() {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Fallback to user root properties if profile properties are missing
    const [formData, setFormData] = useState({
        address: user?.profile?.address || user?.address || '',
        city: user?.profile?.city || user?.city || '',
        country: user?.profile?.country || user?.country || '',
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Update profile endpoint usually expects profile nested object or flat depending on API. 
            // Assuming it handles flat for these fields as per current API handling, or we send them.
            // If the API expects nested, it might fail, but we'll try flat first.
            // Always use FormData so the request is multipart/form-data.
            // Sending a plain JS object makes authApi.js add Content-Type: application/json,
            // which Django rejects with 415 because ProfileAPIView only has
            // parser_classes = [MultiPartParser, FormParser].
            const dataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    dataToSend.append(key, value);
                }
            });
            const result = await updateProfile(dataToSend);
            updateUser(result.user);
            setMessage({ type: 'success', text: result.message || 'Location details updated successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to update location details.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-1">
                <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">General Info</h3>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Update your location and address details.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <label htmlFor="address" className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-900 shadow-sm focus:border-[#c99b43] focus:outline-none focus:ring-1 focus:ring-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-[#c99b43] dark:focus:ring-[#c99b43]"
                                placeholder="Street address, P.O. box, etc."
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="city" className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-900 shadow-sm focus:border-[#c99b43] focus:outline-none focus:ring-1 focus:ring-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-[#c99b43] dark:focus:ring-[#c99b43]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="country" className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
                            <input
                                type="text"
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-900 shadow-sm focus:border-[#c99b43] focus:outline-none focus:ring-1 focus:ring-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-[#c99b43] dark:focus:ring-[#c99b43]"
                            />
                        </div>
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-md text-xs md:text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button type="submit" disabled={isLoading} className="bg-[#c99b43] text-white hover:bg-[#b0873a] dark:bg-[#c99b43] dark:hover:bg-[#b0873a] text-xs md:text-sm h-8 md:h-10">
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
