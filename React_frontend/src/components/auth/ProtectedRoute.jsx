// src/components/common/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const isOwner = user?.role === 'owner';
    const isPendingOwner = isOwner && user?.owner_profile?.can_post_property === false;
    const isOnPendingPage = location.pathname === '/owner/pending';

    if (isPendingOwner && !isOnPendingPage) {
        return <Navigate to="/owner/pending" replace />;
    }

    if (isOnPendingPage && isOwner && user?.owner_profile?.can_post_property === true) {
        return <Navigate to="/owner/dashboard" replace />;
    }

    return children;
}