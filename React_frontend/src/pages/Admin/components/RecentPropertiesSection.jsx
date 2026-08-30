import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../hooks/useTheme'

export default function RecentPropertiesSection({ recentProperties = [] }) {
    const navigate = useNavigate()
    const { isDark } = useTheme()

    const displayProperties = Array.isArray(recentProperties)
        ? recentProperties.map((property, index) => {
            const rawName = property.title || property.property_name || 'Untitled Property'
            const rawLocation = property.location || property.city_name || property.city?.name || property.address || property.region_name || property.region?.name || '—'
            const defaultImage = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=200&q=80'
            let image = defaultImage
            if (typeof property.main_image === 'string') {
                image = property.main_image
            } else if (property.main_image?.image) {
                image = property.main_image.image
            } else if (property.images?.[0]?.image) {
                image = property.images[0].image
            } else if (Array.isArray(property.images) && typeof property.images[0] === 'string') {
                image = property.images[0]
            }
            return {
                id: property.id ?? `recent-${index}-${Math.random().toString(36).slice(2, 8)}`,
                name: rawName,
                location: rawLocation,
                price: `ETB ${Number(property.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                ago: property.created_at ? 'Recently added' : 'Unknown',
                image,
            }
        })
        : []

    return (
        <section className={`rounded-xl border shadow-sm overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className={`border-b px-6 py-4 flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Recent Properties
                </h3>
                <button onClick={() => navigate('/admin-dashboard/properties')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    View All
                </button>
            </div>

            {displayProperties.length === 0 ? (
                <div className={`p-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No recent properties yet.
                </div>
            ) : (
                <div className={`space-y-2 p-4 max-h-80 overflow-y-auto`}>
                    {displayProperties.map((property) => (
                        <div
                            key={property.id}
                            className={`flex items-center gap-3 rounded-lg p-3 transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                        >
                            <img
                                src={property.image}
                                alt={property.name}
                                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <div className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {property.name}
                                </div>
                                <div className={`mt-1 truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {property.location}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {property.price}
                                </div>
                                <div className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {property.ago}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
