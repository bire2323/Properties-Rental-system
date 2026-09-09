import React from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { CheckCircle2, Clock, XCircle, Home } from 'lucide-react';

const STATUS = {
    approved: {
        border: 'border-emerald-200/60 dark:border-emerald-900/30',
        bg:     'bg-emerald-50/50 dark:bg-emerald-900/10',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        clr:    'text-emerald-600 dark:text-emerald-400',
        title:  'text-emerald-800 dark:text-emerald-300',
        desc:   'text-emerald-700 dark:text-emerald-400',
        label:  'Verified Owner',
        msg:    'Your account is verified. You can publish listings.',
        Icon:   CheckCircle2,
    },
    pending: {
        border: 'border-amber-200/60 dark:border-amber-900/30',
        bg:     'bg-amber-50/50 dark:bg-amber-900/10',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        clr:    'text-amber-600 dark:text-amber-400',
        title:  'text-amber-800 dark:text-amber-300',
        desc:   'text-amber-700 dark:text-amber-400',
        label:  'Pending Review',
        msg:    'Your application is under review. We will notify you soon.',
        Icon:   Clock,
    },
    rejected: {
        border: 'border-red-200/60 dark:border-red-900/30',
        bg:     'bg-red-50/50 dark:bg-red-900/10',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        clr:    'text-red-600 dark:text-red-400',
        title:  'text-red-800 dark:text-red-300',
        desc:   'text-red-700 dark:text-red-400',
        label:  'Rejected',
        msg:    'Your verification was rejected.',
        Icon:   XCircle,
    },
    suspended: {
        border: 'border-red-200/60 dark:border-red-900/30',
        bg:     'bg-red-50/50 dark:bg-red-900/10',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        clr:    'text-red-600 dark:text-red-400',
        title:  'text-red-800 dark:text-red-300',
        desc:   'text-red-700 dark:text-red-400',
        label:  'Suspended',
        msg:    'Your privileges are suspended. Contact support.',
        Icon:   XCircle,
    },
};

export default function VerificationSettings() {
    const { user } = useAuth();
    const ownerProfile    = user?.owner_profile || {};
    const status          = ownerProfile.verification_status || 'pending';
    const canPost         = ownerProfile.can_post_property;
    const rejectionReason = ownerProfile.rejection_reason;

    const cfg = STATUS[status] || STATUS.pending;
    const { border, bg, iconBg, clr, title, desc, label, msg, Icon } = cfg;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 space-y-2.5">
            {/* Status banner */}
            <div className={`rounded-2xl border p-3.5 ${border} ${bg}`}>
                <div className="flex items-start gap-2.5">
                    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                        <Icon className={`h-3.5 w-3.5 ${clr}`} />
                    </div>
                    <div className="min-w-0">
                        <p className={`text-xs font-bold ${title}`}>{label}</p>
                        <p className={`mt-0.5 text-[10px] leading-relaxed ${desc}`}>{msg}</p>
                        {status === 'rejected' && rejectionReason && (
                            <div className={`mt-2 rounded-lg border px-2.5 py-1.5 text-[9px] font-medium ${border} ${bg} ${desc}`}>
                                <span className="font-bold">Reason: </span>{rejectionReason}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Posting permission */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-2 dark:border-slate-800">
                    <Home className="h-2.5 w-2.5 text-[#c99b43]" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Property Posting</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-3">
                    {canPost ? (
                        <>
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                            <div>
                                <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Posting Enabled</p>
                                <p className="text-[9px] text-slate-400">You can publish new properties.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                            <div>
                                <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Posting Disabled</p>
                                <p className="text-[9px] text-slate-400">You cannot publish new properties.</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
