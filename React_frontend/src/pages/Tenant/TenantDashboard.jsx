import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import TenantStatCard from './components/TenantStatCard'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'

export default function TenantDashboard() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Placeholder: fetch bookings/payments/favorites if API exists
    }, [])

    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Welcome back</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Welcome, {user?.first_name || user?.email}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Manage your rentals, bookings, payments and saved properties.</p>
            </section>

            <section>
                {loading ? (
                    <LoadingSkeleton />
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <TenantStatCard label="Active Bookings" value="—" />
                        <TenantStatCard label="Upcoming" value="—" />
                        <TenantStatCard label="Favorites" value="—" />
                        <TenantStatCard label="Outstanding" value="—" />
                    </div>
                )}
            </section>

            <section>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick actions</h3>
                <div className="mt-3 flex flex-wrap gap-3">
                    <a href="/properties" className="rounded-2xl bg-[#c99b43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b0883a]">Browse Properties</a>
                    <a href="/vehicles" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800">Browse Vehicles</a>
                    <a href="/tenant/bookings" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800">View Bookings</a>
                </div>
            </section>

            <section>
                <EmptyState
                    title="No recent activity"
                    description="You don't have recent activity to show. Your bookings, payments and messages will appear here."
                />
            </section>
        </div>
    )
}