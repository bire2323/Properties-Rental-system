import React from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { Button } from '../../../../components/ui/button';

export default function VerificationSettings() {
    const { user } = useAuth();
    
    const ownerProfile = user?.owner_profile || {};
    const status = ownerProfile.verification_status || 'pending';
    const canPost = ownerProfile.can_post_property;
    const rejectionReason = ownerProfile.rejection_reason;

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-1">
                <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Owner Verification</h3>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    View your current verification status and permissions.
                </p>
            </div>

            <div className="space-y-4 md:space-y-6">
                <div className={`rounded-2xl border p-4 sm:p-6 shadow-sm ${
                    status === 'approved' ? 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10' :
                    status === 'pending' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10' :
                    status === 'rejected' ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10' :
                    'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50'
                }`}>
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className={`mt-1 p-1.5 md:p-2 rounded-full ${
                            status === 'approved' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                            {status === 'approved' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                            {status === 'pending' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                            )}
                            {(status === 'rejected' || status === 'suspended') && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h4 className={`text-sm md:text-base font-semibold capitalize ${
                                status === 'approved' ? 'text-green-800 dark:text-green-300' :
                                status === 'pending' ? 'text-yellow-800 dark:text-yellow-300' :
                                'text-red-800 dark:text-red-300'
                            }`}>
                                {status === 'approved' ? 'Verified Owner' : 
                                 status === 'pending' ? 'Verification Pending' : 
                                 status === 'suspended' ? 'Account Suspended' : 'Verification Rejected'}
                            </h4>
                            <p className={`mt-1 text-xs md:text-sm ${
                                status === 'approved' ? 'text-green-700 dark:text-green-400' :
                                status === 'pending' ? 'text-yellow-700 dark:text-yellow-400' :
                                'text-red-700 dark:text-red-400'
                            }`}>
                                {status === 'approved' && 'Your owner account has been verified. You can publish and manage property listings.'}
                                {status === 'pending' && 'Your verification is currently under review by our team. You will be notified once a decision is made.'}
                                {status === 'rejected' && 'Your verification application was rejected.'}
                                {status === 'suspended' && 'Your owner privileges have been suspended. Please contact support.'}
                            </p>
                            
                            {status === 'rejected' && rejectionReason && (
                                <div className="mt-2 md:mt-3 rounded-md bg-red-100 p-2 md:p-3 text-xs md:text-sm text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/50">
                                    <span className="font-semibold">Reason:</span> {rejectionReason}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <h4 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white mb-3 md:mb-4">Property Posting</h4>
                    <div className="flex items-center gap-2 md:gap-3">
                        {canPost ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">You can currently publish properties.</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">You cannot currently publish new properties.</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
