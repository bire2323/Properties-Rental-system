import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function OwnerRoute({ children }) {
    const { isAuthenticated, loading, user } = useAuth()

    if (loading) {
        return null
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    const allowTenantAccess = import.meta.env.VITE_ALLOW_TENANT_OWNER === 'true'
    if (user?.role === 'tenant' && allowTenantAccess) {
        return children
    }

    if (user?.role !== 'owner') {
        const fallback = user?.role === 'admin' ? '/admin-dashboard' : '/tenant-dashboard'
        return <Navigate to={fallback} replace />
    }

    return children
}
