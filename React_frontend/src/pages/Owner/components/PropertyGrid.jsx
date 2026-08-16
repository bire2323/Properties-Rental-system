import PropertyCard from './PropertyCard'

export default function PropertyGrid({ properties, onDelete, isDraftMode = false }) {
    if (!properties.length) {
        return null
    }

    return (
        <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2">
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
