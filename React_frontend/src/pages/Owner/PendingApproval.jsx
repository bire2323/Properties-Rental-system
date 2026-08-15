// src/pages/owner/PendingApproval.jsx
import { Clock, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/card';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export default function PendingApproval() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
            <Navbar />
            <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
                <Card className="max-w-lg w-full p-8 text-center border-slate-200 dark:border-slate-800 shadow-xl">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-[#c99b43]/10 p-4">
                            <Clock className="h-12 w-12 text-[#c99b43]" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Account Under Review
                    </h1>
                    <p className="mt-3 text-slate-600 dark:text-slate-400">
                        Your owner verification is currently <strong>pending</strong>.
                        Our team will review your documents shortly.
                    </p>
                    <div className="mt-6 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-left dark:bg-blue-950/30">
                        <ShieldCheck className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            You will be able to list properties as soon as your account is approved.
                            We'll notify you via <span className='rounded px-1 hover:text-underline focus:text-underline bg-[#c99b43] text-white'>email</span> .
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#c99b43] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b88a35] transition"
                    >
                        Check Status
                    </button>
                </Card>
            </main>
            <Footer />
        </div>
    );
}