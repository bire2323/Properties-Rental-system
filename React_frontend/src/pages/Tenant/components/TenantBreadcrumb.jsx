import { Link, useLocation } from 'react-router-dom'

export default function TenantBreadcrumb() {
    const location = useLocation()
    const segments = location.pathname.split('/').filter(Boolean)
    const crumbs = []
    let path = ''

    segments.forEach((seg) => {
        path += `/${seg}`
        crumbs.push({ label: seg.charAt(0).toUpperCase() + seg.slice(1), path })
    })

    return (
        <nav className="text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
                <li>
                    <Link to="/tenant/dashboard" className="hover:underline">Tenant</Link>
                </li>
                {crumbs.map((c, i) => (
                    <li key={c.path} className="flex items-center gap-2">
                        <span className="text-slate-300">/</span>
                        {i === crumbs.length - 1 ? <span className="text-slate-700 dark:text-white">{c.label}</span> : <Link to={c.path} className="hover:underline">{c.label}</Link>}
                    </li>
                ))}
            </ol>
        </nav>
    )
}