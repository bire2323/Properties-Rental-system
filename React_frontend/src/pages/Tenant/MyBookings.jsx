import EmptyState from './components/EmptyState'

export default function MyBookings() {
    return (
        <div>
            <EmptyState
                title="No bookings yet"
                description="You haven't made any bookings. Explore properties or vehicles to make your first booking."
                action={<a href="/properties" className="rounded-2xl bg-[#c99b43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b0883a]">Explore Properties</a>}
            />
        </div>
    )
}