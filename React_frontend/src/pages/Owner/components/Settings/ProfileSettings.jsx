import React, { useRef, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { updateProfile } from '../../../../api/authApi';
import { Button } from '../../../../components/ui/button';
import { getImageUrl } from '@/lib/utils';
import {
    User,
    Mail,
    Phone,
    Calendar,
    BadgeCheck,
    KeyRound,
    Sparkles,
    Pencil,
    ImagePlus,
    Trash2,
    Save,
    CheckCircle2,
    XCircle,
    Hourglass,
    Building2,
    RefreshCw,
} from 'lucide-react';

function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Not specified';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    } catch {
        return 'Not specified';
    }
}

export default function ProfileSettings() {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone_number: user?.phone_number || user?.profile?.phone_number || '',
        date_of_birth: user?.date_of_birth || user?.profile?.date_of_birth || '',
    });

    const profileImageUrl = user?.profile_image ? getImageUrl(user.profile_image) : null;
    const getInitials = (firstName, lastName) => {
        if (!firstName && !lastName) return 'U';
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemovePhoto = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const dataToSend = new FormData();
            dataToSend.append('first_name', formData.first_name);
            dataToSend.append('last_name', formData.last_name);
            dataToSend.append('email', formData.email);
            dataToSend.append('phone_number', formData.phone_number);
            if (formData.date_of_birth) {
                dataToSend.append('date_of_birth', formData.date_of_birth);
            }
            if (selectedImage) {
                dataToSend.append('profile_image', selectedImage);
            }

            const result = await updateProfile(dataToSend);
            updateUser(result.user);
            setMessage({ type: 'success', text: result.message || 'Profile updated successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
        } finally {
            setIsLoading(false);
        }
    };

    const fullName =
        [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
        user?.email?.split('@')[0] ||
        'Owner';
    const avatarUrl = imagePreview || profileImageUrl;
    const ownerProfile = user?.owner_profile || {};
    const verificationStatus = ownerProfile.verification_status || 'pending';
    const memberSince = formatDate(user?.created_at || user?.date_joined || ownerProfile?.created_at);
    const authProviderLabel = user?.auth_provider || 'Email';
    const canPostProperty = ownerProfile.can_post_property;

    const verificationMeta = {
        approved: { icon: CheckCircle2, label: 'Approved', color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 ring-emerald-200 dark:ring-emerald-900/50' },
        rejected: { icon: XCircle, label: 'Rejected', color: 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950/40 ring-red-200 dark:ring-red-900/50' },
        pending: { icon: Hourglass, label: 'Pending Approval', color: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40 ring-amber-200 dark:ring-amber-900/50' },
    };
    const vMeta = verificationMeta[verificationStatus] || verificationMeta.pending;
    const VIcon = vMeta.icon;

    const inputBase =
        'block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500';

    return (
        <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="px-1">
                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">Profile</h3>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Update your photo and personal details.
                </p>
            </div>

            {/* Hero profile card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="h-28 bg-[linear-gradient(135deg,#0b2141_0%,#1e3a63_55%,#c99b43_100%)] dark:bg-[linear-gradient(135deg,#05101e_0%,#0f223d_55%,#916e25_100%)] relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,155,67,0.25),transparent_60%)]" />
                    <div className="absolute right-5 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                        <Sparkles className="h-3.5 w-3.5 text-[#f7db96]" />
                        Owner Account
                    </div>
                </div>

                <div className="px-5 pb-6 sm:px-7">
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end -mt-14 sm:-mt-12">
                        {/* Avatar */}
                        <div className="relative self-start">
                            <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#f3cd7a,#c68c2b)] p-1 shadow-xl ring-4 ring-white dark:ring-slate-900">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={fullName} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-900 dark:bg-slate-800 sm:text-3xl dark:text-white">
                                        {getInitials(user?.first_name, user?.last_name)}
                                    </span>
                                )}
                            </div>
                            {user?.is_verified && (
                                <span title="Verified Account" className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-md dark:border-slate-900">
                                    <BadgeCheck className="h-4 w-4" />
                                </span>
                            )}
                        </div>

                        {/* Name + badges */}
                        <div className="flex-1 space-y-2 pt-1 sm:pt-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{fullName}</h2>
                                <span className="inline-flex items-center rounded-full bg-[#c99b43]/15 px-2.5 py-0.5 text-xs font-semibold text-[#b27a23] dark:text-[#f3c96d] capitalize">
                                    {user?.role || 'Owner'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
                        </div>

                        {/* Change photo controls */}
                        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                            <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                <ImagePlus className="h-4 w-4" /> Change Photo
                            </Button>
                            {(avatarUrl) && (
                                <Button variant="ghost" size="sm" type="button" onClick={handleRemovePhoto} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
                                    <Trash2 className="h-4 w-4" /> Remove
                                </Button>
                            )}
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">JPG, GIF or PNG. Max 2MB.</p>
                        </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-[#c99b43]" /> {user?.email || 'Not provided'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-[#c99b43]" /> {user?.phone_number || user?.profile?.phone_number || 'Not provided'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#c99b43]" /> Member since {memberSince}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <KeyRound className="h-3.5 w-3.5 text-[#c99b43]" /> {authProviderLabel} login
                        </span>
                    </div>
                </div>
            </div>

            {/* Verification status banner */}
            <div className={`flex items-center gap-3 rounded-2xl border p-4 ring-1 ${vMeta.color}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-black/20">
                    <VIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold">{vMeta.label}</p>
                    <p className="text-xs opacity-80">
                        {verificationStatus === 'approved'
                            ? 'Your owner account is verified and you can post properties.'
                            : verificationStatus === 'rejected'
                            ? ownerProfile.rejection_reason || 'Your owner application was not approved.'
                            : 'Your owner application is under review. Posting will be enabled once approved.'}
                    </p>
                </div>
                {canPostProperty && (
                    <span className="ml-auto hidden shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 sm:inline-flex">
                        <Building2 className="h-3.5 w-3.5" /> Can Post Property
                    </span>
                )}
            </div>

            {/* Editable personal details */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-5 dark:border-slate-800">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#c99b43]/15 text-[#c99b43]">
                        <Pencil className="h-4 w-4" />
                    </span>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Personal Information</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Update the contact details registered on your account.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5 md:space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="first_name" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                <User className="h-3.5 w-3.5 text-[#c99b43]" /> First Name
                            </label>
                            <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} className={inputBase} />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="last_name" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                <User className="h-3.5 w-3.5 text-[#c99b43]" /> Last Name
                            </label>
                            <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} className={inputBase} />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                <Mail className="h-3.5 w-3.5 text-[#c99b43]" /> Email
                            </label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={inputBase} />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="phone_number" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                <Phone className="h-3.5 w-3.5 text-[#c99b43]" /> Phone Number
                            </label>
                            <input type="tel" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} className={inputBase} />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <label htmlFor="date_of_birth" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                <Calendar className="h-3.5 w-3.5 text-[#c99b43]" /> Date of Birth
                            </label>
                            <input type="date" id="date_of_birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputBase} />
                        </div>
                    </div>

                    {message.text && (
                        <div className={`flex items-center gap-2 rounded-xl p-3 text-xs md:text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
                        <Button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl bg-[#c99b43] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b0873a] dark:bg-[#c99b43] dark:text-white dark:hover:bg-[#b0873a]">
                            {isLoading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
