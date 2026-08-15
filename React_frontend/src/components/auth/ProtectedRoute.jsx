// src/components/common/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return null; // or a loading spinner
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (
        user?.role === 'owner' &&
        !user?.owner_profile &&
        location.pathname !== '/become-owner'
    ) {
        return <Navigate to="/become-owner" replace />;
    }

    return children;
}