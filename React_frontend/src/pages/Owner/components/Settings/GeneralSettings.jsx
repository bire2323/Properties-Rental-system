import React, { useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { updateProfile } from '../../../../api/authApi';
import { Save } from 'lucide-react';

const INPUT = 'block w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 transition focus:border-[#c99b43] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-[#c99b43] dark:focus:bg-slate-800 placeholder:text-slate-400';
const LABEL = 'mb-0.5 block text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500';

export default function GeneralSettings() {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [form, setForm] = useState({
        address: user?.profile?.address || user?.address || '',
        city:    user?.profile?.city    || user?.city    || '',
        country: user?.profile?.country || user?.country || '',
    });

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v); });
            const result = await updateProfile(fd);
            updateUser(result.user);
            setMessage({ type: 'success', text: 'Location updated.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to update.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-800 dark:text-white">General Info</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Location &amp; address details</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="p-4 space-y-2.5">
                    <div>
                        <label className={LABEL}>Address</label>
                        <input type="text" name="address" value={form.address} onChange={handleChange}
                            placeholder="Street address, P.O. box…" className={INPUT} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={LABEL}>City</label>
                            <input type="text" name="city" value={form.city} onChange={handleChange} className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Country</label>
                            <input type="text" name="country" value={form.country} onChange={handleChange} className={INPUT} />
                        </div>
                    </div>
                    {message.text && (
                        <div className={`rounded-lg px-3 py-1.5 text-[10px] font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                            {message.text}
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                    <button type="submit" disabled={isLoading}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#c99b43] to-[#e2af5b] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-[#c99b43]/20 transition hover:from-[#b08838] hover:to-[#c99b43] disabled:opacity-60">
                        <Save className="h-2.5 w-2.5" />
                        {isLoading ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}
