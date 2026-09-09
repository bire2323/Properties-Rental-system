import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { updateProfile } from '../../../../api/authApi';
import { Eye, EyeOff, Save, ShieldCheck, Lock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const INPUT_BASE =
    'block w-full rounded-lg border bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 transition focus:outline-none focus:ring-1 dark:bg-slate-800/60 dark:text-white placeholder:text-slate-400';

const LABEL = 'mb-0.5 block text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500';

/* ── Password strength scorer ── */
function getStrength(pw) {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8)              score++;
    if (/[A-Z]/.test(pw))           score++;
    if (/[a-z]/.test(pw))           score++;
    if (/\d/.test(pw))              score++;
    if (/[^A-Za-z0-9]/.test(pw))   score++;
    const map = [
        { label: 'Too short', color: 'bg-red-400' },
        { label: 'Weak',      color: 'bg-red-400' },
        { label: 'Fair',      color: 'bg-amber-400' },
        { label: 'Good',      color: 'bg-yellow-400' },
        { label: 'Strong',    color: 'bg-emerald-400' },
        { label: 'Very strong', color: 'bg-emerald-500' },
    ];
    return { score, ...map[score] };
}

/* ── Reusable password input ── */
function PwInput({ id, name, value, onChange, show, onToggle, placeholder, inputCls }) {
    return (
        <div className="relative">
            <input
                id={id}
                type={show ? 'text' : 'password'}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder || '••••••••'}
                className={`${INPUT_BASE} pr-7 ${inputCls}`}
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
                {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
        </div>
    );
}

export default function SecuritySettings() {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage]     = useState({ type: '', text: '' });
    const [fields, setFields]       = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [show, setShow]           = useState({ current: false, new: false, confirm: false });

    const handleChange = (e) => {
        setFields(p => ({ ...p, [e.target.name]: e.target.value }));
        setMessage({ type: '', text: '' });
    };
    const toggleShow = (key) => setShow(p => ({ ...p, [key]: !p[key] }));

    /* live checks */
    const strength        = useMemo(() => getStrength(fields.new_password), [fields.new_password]);
    const passwordsMatch  = fields.confirm_password && fields.new_password === fields.confirm_password;
    const passwordsMismatch = fields.confirm_password && fields.new_password !== fields.confirm_password;

    /* input border helper */
    const inputCls = (key) => {
        if (key === 'confirm') {
            if (passwordsMatch)    return 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/20 dark:border-emerald-600';
            if (passwordsMismatch) return 'border-red-400 focus:border-red-400 focus:ring-red-400/20 dark:border-red-600';
        }
        return 'border-slate-200 focus:border-[#c99b43] focus:ring-[#c99b43]/20 dark:border-slate-700';
    };

    const handleSubmit = async () => {
        if (!fields.current_password) {
            setMessage({ type: 'error', text: 'Enter your current password.' });
            return;
        }
        if (!fields.new_password || !fields.confirm_password) {
            setMessage({ type: 'error', text: 'Please fill in all fields.' });
            return;
        }
        if (fields.new_password !== fields.confirm_password) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        if (strength.score < 3) {
            setMessage({ type: 'error', text: 'Password is too weak. Use uppercase, numbers & symbols.' });
            return;
        }
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const fd = new FormData();
            fd.append('current_password',  fields.current_password);
            fd.append('new_password',      fields.new_password);
            fd.append('confirm_password',  fields.confirm_password);
            const result = await updateProfile(fd);
            updateUser(result.user);
            setMessage({ type: 'success', text: 'Password updated successfully.' });
            setFields({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            /* parse Django field errors */
            const raw = err.message || 'Failed to update.';
            try {
                const parsed = JSON.parse(raw);
                if (parsed.current_password) {
                    setMessage({ type: 'error', text: `Current password: ${parsed.current_password[0]}` });
                } else if (parsed.new_password) {
                    setMessage({ type: 'error', text: parsed.new_password[0] });
                } else {
                    setMessage({ type: 'error', text: raw });
                }
            } catch {
                setMessage({ type: 'error', text: raw });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isEmailAuth = !user?.auth_provider || user?.auth_provider === 'email';

    /* strength bar segments */
    const strengthSegments = [1, 2, 3, 4, 5].map(n => ({
        active: strength.score >= n,
        color: strength.color,
    }));

    return (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 space-y-2.5">
            {/* Auth method row */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Security</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Authentication method</p>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">Signed in via</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold capitalize text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {user?.auth_provider || 'Email'}
                    </span>
                </div>
            </div>

            {/* Change password card */}
            {isEmailAuth && (
                <div className="max-w-sm rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                        <Lock className="h-3 w-3 text-[#c99b43]" />
                        <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">Change Password</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Verify your current password first</p>
                        </div>
                    </div>

                    <div className="p-4 space-y-3">
                        {/* Current password */}
                        <div>
                            <label className={LABEL}>Current Password</label>
                            <PwInput
                                id="current_password"
                                name="current_password"
                                value={fields.current_password}
                                onChange={handleChange}
                                show={show.current}
                                onToggle={() => toggleShow('current')}
                                placeholder="Enter your current password"
                                inputCls="border-slate-200 focus:border-[#c99b43] focus:ring-[#c99b43]/20 dark:border-slate-700"
                            />
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100 dark:border-slate-800" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-900 dark:text-slate-600">new password</span>
                            </div>
                        </div>

                        {/* New password — stacked single column */}
                        <div className="space-y-2.5">
                            <div>
                                <label className={LABEL}>New Password</label>
                                <PwInput
                                    id="new_password"
                                    name="new_password"
                                    value={fields.new_password}
                                    onChange={handleChange}
                                    show={show.new}
                                    onToggle={() => toggleShow('new')}
                                    inputCls="border-slate-200 focus:border-[#c99b43] focus:ring-[#c99b43]/20 dark:border-slate-700"
                                />
                                {/* Strength bar */}
                                {fields.new_password && (
                                    <div className="mt-1.5">
                                        <div className="flex gap-0.5">
                                            {strengthSegments.map((seg, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${seg.active ? seg.color : 'bg-slate-200 dark:bg-slate-700'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`mt-0.5 text-[9px] font-semibold ${
                                            strength.score >= 4 ? 'text-emerald-500' :
                                            strength.score >= 3 ? 'text-yellow-500' : 'text-red-500'
                                        }`}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={LABEL}>
                                    Confirm Password
                                    {fields.confirm_password && (
                                        <span className="ml-1 inline-flex items-center">
                                            {passwordsMatch
                                                ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                                : <XCircle className="h-2.5 w-2.5 text-red-500" />
                                            }
                                        </span>
                                    )}
                                </label>
                                <PwInput
                                    id="confirm_password"
                                    name="confirm_password"
                                    value={fields.confirm_password}
                                    onChange={handleChange}
                                    show={show.confirm}
                                    onToggle={() => toggleShow('confirm')}
                                    inputCls={inputCls('confirm')}
                                />
                                {/* Match hint */}
                                {fields.confirm_password && (
                                    <p className={`mt-0.5 text-[9px] font-semibold ${passwordsMatch ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {passwordsMatch ? 'Passwords match ✓' : 'Do not match'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Requirements hint */}
                        {fields.new_password && strength.score < 4 && (
                            <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 dark:bg-amber-900/20">
                                <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500" />
                                <p className="text-[9px] text-amber-700 dark:text-amber-400 leading-relaxed">
                                    Use 8+ characters with uppercase, lowercase, a number &amp; a special character.
                                </p>
                            </div>
                        )}

                        {/* API message */}
                        {message.text && (
                            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-medium ${
                                message.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                                {message.type === 'success'
                                    ? <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                                    : <XCircle className="h-3 w-3 flex-shrink-0" />
                                }
                                {message.text}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                        <p className="text-[9px] text-slate-400 dark:text-slate-600">
                            All fields are required
                        </p>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading || passwordsMismatch}
                            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#c99b43] to-[#e2af5b] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-[#c99b43]/20 transition hover:from-[#b08838] hover:to-[#c99b43] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="h-2.5 w-2.5" />
                            {isLoading ? 'Updating…' : 'Update Password'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
