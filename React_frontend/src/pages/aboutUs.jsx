import { useEffect, useState } from 'react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import { getSiteSettings } from '../api/siteSettingsApi'

export default function AboutUs() {
    const [aboutText, setAboutText] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getSiteSettings()
            .then((settings) => setAboutText(settings.about_us || ''))
            .catch(() => setAboutText(''))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
            <Navbar />
            <main className="relative flex min-h-[68vh] items-center justify-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
                <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=90"
                    alt="Modern villa exterior"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/45" />
                <section className="relative w-full max-w-2xl rounded-xl border border-white/30 bg-white/90 px-6 py-8 text-center shadow-2xl backdrop-blur-sm sm:px-10 sm:py-10 dark:border-slate-700/70 dark:bg-slate-950/85">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c99b43]">About Us</p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">About our rental platform</h1>
                    <div className="mx-auto mt-6 max-w-xl whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                        {loading ? 'Loading...' : aboutText || 'Our story and mission will be available here soon.'}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
