// src/components/common/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c99b43] border-t-transparent shadow-md" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Loading account...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const isOwner = user?.role === 'owner';
    const isOnBecomeOwnerPage = location.pathname === '/become-owner';
    const isOnPendingPage = location.pathname === '/owner/pending';
    const hasOwnerProfile = Boolean(user?.owner_profile);

    // ─── 1. New owner without OwnerProfile → redirect to /become-owner ───
    const isNewOwner = isOwner && !hasOwnerProfile;

    if (isNewOwner && !isOnBecomeOwnerPage) {
        return <Navigate to="/become-owner" replace />;
    }

    // ─── 2. Owner has OwnerProfile but not approved → redirect to /owner/pending ───
    const isPendingOwner = isOwner && hasOwnerProfile && user.owner_profile?.can_post_property === false;

    if (isPendingOwner && !isOnPendingPage) {
        return <Navigate to="/owner/pending" replace />;
    }

    // ─── 3. Approved owner on pending page → redirect to dashboard ───
    const isApprovedOwner = isOwner && hasOwnerProfile && user.owner_profile?.can_post_property === true;

    if (isApprovedOwner && isOnPendingPage) {
        return <Navigate to="/owner/dashboard" replace />;
    }

    // ─── 4. If on /become-owner but already has OwnerProfile → redirect to dashboard ───
    if (isOnBecomeOwnerPage && isOwner && user?.owner_profile) {
        return <Navigate to="/owner/dashboard" replace />;
    }

    return children;
}