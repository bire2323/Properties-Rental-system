import PropertyCard from './PropertyCard'

export default function PropertyGrid({ properties, onDelete, isDraftMode = false }) {
    if (!properties.length) {
        return null
    }

    return (
        <div className="grid gap-0.5 lg:gap-4 grid-cols-2 xl:grid-cols-4 lg:grid-cols-3">
            {properties.map((property) => (
                <PropertyCard
                    key={property.id || 'draft'}
                    property={property}
                    onDelete={onDelete}
                    isDraftMode={isDraftMode}
                />
            ))}
        </div>
    )
}
