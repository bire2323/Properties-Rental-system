import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import SEO from '../seo/SEO'

export default function AdminRoute({ children }) {
    const { isAuthenticated, loading, user } = useAuth()

    if (loading) {
        return null
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (user?.role !== 'admin') {
        const fallback = user?.role === 'owner' ? '/owner/dashboard' : '/tenant/dashboard'
        return <Navigate to={fallback} replace />
    }

    return <>
        <SEO
            noindex
            title="Admin Dashboard | GetSpace"
            description="Administration panel for GetSpace."
        />
        {children}
    </>
}
