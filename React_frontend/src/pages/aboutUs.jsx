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
            <main className="flex min-h-[60vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm sm:px-10 sm:py-10 dark:border-slate-800 dark:bg-slate-900">
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
