import React, { useRef, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { updateProfile } from '../../../../api/authApi';
import { Button } from '../../../../components/ui/button';
import { getImageUrl } from '@/lib/utils';

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
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
        // Assuming the backend handles empty/null profile_image to remove it.
        // We'll leave it out of FormData or send an empty string depending on backend design,
        // but since we can't be sure, we'll just clear it locally and in the next request, 
        // if supported, it could be sent as empty.
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Always use FormData so the request is multipart/form-data.
            // The backend parser_classes = [MultiPartParser, FormParser] only accepts
            // multipart or urlencoded — not application/json. Sending a plain object
            // causes authApi.js to set Content-Type: application/json, which Django
            // rejects with 415 Unsupported Media Type.
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

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-1">
                <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Profile</h3>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Update your photo and personal details.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-6">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-slate-200 text-xl md:text-2xl font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0 overflow-hidden">
                        {imagePreview || user?.profile_image ? (
                            <img src={imagePreview || getImageUrl(user.profile_image)} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <span>{getInitials(user?.first_name, user?.last_name)}</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2 md:gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <Button 
                                variant="outline" 
                                size="sm" 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs md:text-sm h-8 md:h-9"
                            >
                                Change Photo
                            </Button>
                            {(imagePreview || user?.profile_image) && (
                                <Button variant="ghost" size="sm" type="button" onClick={handleRemovePhoto} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs md:text-sm h-8 md:h-9">
                                    Remove
                                </Button>
                            )}
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">JPG, GIF or PNG. Max size of 2MB.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="first_name" className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-900 shadow-sm focus:border-[#c99b43] focus:outline-none focus:ring-1 focus:ring-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-[#c99b43] dark:focus:ring-[#c99b43]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="last_name" className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-900 shadow-sm focus:border-[#c99b43] focus:outline-none focus:ring-1 focus:ring-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-[#c99b43] dark:focus:ring-[#c99b43]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-900 shadow-sm focus:border-[#c99b43] focus:outline-none focus:ring-1 focus:ring-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-[#c99b43] dark:focus:ring-[#c99b43]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="phone_number" className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                            <input
                                type="tel"
                                id="phone_number"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-900 shadow-sm focus:border-[#c99b43] focus:outline-none focus:ring-1 focus:ring-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-[#c99b43] dark:focus:ring-[#c99b43]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="date_of_birth" className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                            <input
                                type="date"
                                id="date_of_birth"
                                name="date_of_birth"
                                value={formData.date_of_birth}
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
