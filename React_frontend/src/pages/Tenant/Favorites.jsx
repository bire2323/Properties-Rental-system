import EmptyState from './components/EmptyState'

export default function Favorites() {
    return (
        <div>
            <EmptyState
                title="No favorites yet"
                description="Save properties and vehicles you like to find them quickly later."
                action={<a href="/properties" className="rounded-2xl bg-[#c99b43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b0883a]">Browse Rentals</a>}
            />
        </div>
    )
}