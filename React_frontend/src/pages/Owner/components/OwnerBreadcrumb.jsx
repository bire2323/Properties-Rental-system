import { Link, useLocation } from 'react-router-dom'

const labelMap = {
    dashboard: 'Dashboard',
    properties: 'Properties',
    bookings: 'Bookings',
    payments: 'Payments',
    messages: 'Messages',
    favorites: 'Favorites',
    reports: 'Reports',
    settings: 'Settings',
    add: 'Add Property',
    edit: 'Edit Property',
}

export default function OwnerBreadcrumb() {
    const location = useLocation()
    const segments = location.pathname.split('/').filter(Boolean)
    const crumbItems = [{ label: 'Owner', to: '/owner/dashboard' }]

    let path = '/owner'
    segments.slice(1).forEach((segment, index) => {
        path += `/${segment}`
        const isId = /^\\d+$/.test(segment)
        const label = isId ? 'Property Details' : labelMap[segment] || segment
        crumbItems.push({ label, to: path, isCurrent: index === segments.slice(1).length - 1 })
    })

    return (
        <div className="rounded-3xl   px-2 py-1.5 text-sm text-slate-600  dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <nav className="flex flex-wrap items-center gap-1">
                {crumbItems.map((item, index) => {
                    const isLast = index === crumbItems.length - 1
                    return (
                        <span key={item.to} className="flex items-center gap-2">
                            {index > 0 && <span className="text-slate-400 dark:text-slate-500">/</span>}
                            {isLast ? (
                                <span className="font-semibold text-[#c99b43] dark:text-white">{item.label}</span>
                            ) : (
                                <Link to={item.to} className="text-slate-600 transition hover:text-[#c99b43] dark:text-slate-300 dark:hover:text-[#f3c96d]">
                                    {item.label}
                                </Link>
                            )}
                        </span>
                    )
                })}
            </nav>
        </div>
    )
}
