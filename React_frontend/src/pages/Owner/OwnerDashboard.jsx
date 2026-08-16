import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, CalendarCheck, DollarSign, Home, Plus, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getAllProperties } from '../../api/property/propertyApi'
import StatCard from './components/StatCard'
import PropertyGrid from './components/PropertyGrid'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'

const DRAFT_STORAGE_KEY = 'property_add_draft'

export default function OwnerDashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)


    useEffect(() => {
        async function loadProperties() {
            setLoading(true)
            setError(null)
            try {
                const data = await getAllProperties()
                const results = Array.isArray(data) ? data : data.results || []
                setProperties(results)
            } catch (err) {
                setError(err.message || 'Unable to load dashboard data.')
            } finally {
                setLoading(false)
            }
        }

        loadProperties()
    }, [])

    const ownerProperties = useMemo(() => {
        return properties.filter((property) => property.owner_email === user?.email)
    }, [properties, user])

    const totalProperties = ownerProperties.length
    const availableProperties = ownerProperties.filter((property) => property.status === 'active').length
    const rentedProperties = ownerProperties.filter((property) => property.status !== 'active').length
    const rentalValue = ownerProperties.reduce((sum, property) => sum + parseFloat(property.price || 0), 0)

    const recentProperties = ownerProperties.slice(0, 3)

    return (
        <div className="space-y-8">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="absolute inset-0 bg-gradient-to-r from-[#f8e6ba]/80 via-white/0 to-[#dfeaf7]/80 dark:from-[#201d17]/60 dark:via-slate-950/10 dark:to-[#0f172a]/60" aria-hidden="true" />
                <img
                    src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80"
                    alt="Modern house"
                    className="absolute -right-16 top-6 h-44 w-44 rounded-[2rem] object-cover opacity-30 blur-[1px] grayscale-[0.1] sm:h-56 sm:w-56 dark:opacity-35"
                />
                <img
                    src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80"
                    alt="Luxury car"
                    className="absolute -left-14 bottom-2 h-36 w-36 rounded-[2rem] object-cover opacity-35 blur-[1px] grayscale-[0.1] sm:h-48 sm:w-48 dark:opacity-30"
                />

                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Welcome back</p>
                        <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{user?.first_name ? `Welcome back, ${user.first_name}` : 'Welcome back'}</h2>
                        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">Manage your properties, bookings, and rental activity from one place.</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:auto-cols-fr xl:grid-flow-col">
                        <button
                            type="button"
                            onClick={() => navigate('/owner/properties/add')}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
                        >
                            <Plus className="h-4 w-4" />
                            Add Property
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/owner/properties')}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            <ArrowRight className="h-4 w-4" />
                            View Properties
                        </button>
                    </div>
                </div>
            </section>



            <section>
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
                        <p className="font-semibold">Unable to load dashboard data.</p>
                        <p className="mt-2">{error}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-4">
                        <StatCard icon={<Home className="h-5 w-5" />} label="Total Properties" value={totalProperties} description="Your active portfolio" accent="bg-[#f6e6c1] text-[#7f5c20]" />
                        <StatCard icon={<Building2 className="h-5 w-5" />} label="Available" value={availableProperties} description="Ready for new bookings" accent="bg-[#e6f8ef] text-[#1d6f4f]" />
                        <StatCard icon={<CalendarCheck className="h-5 w-5" />} label="Rented" value={rentedProperties} description="Currently occupied" accent="bg-[#ede9ff] text-[#5a3d9f]" />
                        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Monthly Value" value={`ETB ${rentalValue.toLocaleString()}`} description="Estimated property rents" accent="bg-[#fdeedb] text-[#a05713]" />
                    </div>
                )}
            </section>

            <section className="grid gap-6 xl:grid-cols-[2fr_0.6fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Property overview</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your most recent properties are shown here.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/owner/properties')}
                            className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            View all
                        </button>
                    </div>

                    {loading ? (
                        <div className="mt-6">
                            <LoadingSkeleton />
                        </div>
                    ) : !ownerProperties.length ? (
                        <div className="mt-6">
                            <EmptyState
                                title="No properties yet"
                                description="You haven't added any properties to your account."
                                action={
                                    <button
                                        type="button"
                                        onClick={() => navigate('/owner/properties/add')}
                                        className="rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
                                    >
                                        Add Property
                                    </button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="mt-6 space-y-6">
                            <PropertyGrid properties={recentProperties} />
                        </div>
                    )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick actions</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Jump to the most important owner workflows.</p>
                        </div>
                        <Sparkles className="h-6 w-6 text-[#c99b43]" />
                    </div>

                    <div className="mt-6 space-y-4">
                        <button
                            type="button"
                            onClick={() => navigate('/owner/properties/add')}
                            className="flex w-full items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-900 transition hover:border-[#c99b43] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#c99b43]"
                        >
                            Add a new property
                            <ArrowRight className="h-4 w-4 text-[#c99b43]" />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/owner/bookings')}
                            className="flex w-full items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                            Review booking requests
                            <ArrowRight className="h-4 w-4 text-slate-500" />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/owner/payments')}
                            className="flex w-full items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                            View payments
                            <ArrowRight className="h-4 w-4 text-slate-500" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    )
}
