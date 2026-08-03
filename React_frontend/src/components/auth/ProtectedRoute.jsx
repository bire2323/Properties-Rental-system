import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            window.location.hash = 'login'
        }
    }, [loading, isAuthenticated])

    if (loading) {
        return null
    }

    if (!isAuthenticated) {
        return null
    }

    return children
}
