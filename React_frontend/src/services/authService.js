export function getDashboardRoute(role) {
    console.log("role", role);
    const allowTenantAccess = import.meta.env.VITE_ALLOW_TENANT_OWNER === 'true'
    if (allowTenantAccess && role === 'tenant') {
        return '/owner'
    } else {
        switch (role) {
            case 'admin':
                return '/admin-dashboard'
            case 'owner':
                return '/owner'
            case 'tenant':
                return '/tenant'
            default:
                // return '/tenant-dashboard'
                return '/'
        }
    }
}

export function getProfileRoute(role) {
    switch (role) {
        case 'admin':
            return '/admin-dashboard/profile'
        case 'owner':
            return '/owner/settings'
        case 'tenant':
        default:
            return '/tenant/profile'
    }
}

export function normalizeErrorMessage(error) {
    if (error?.message) {
        return error.message
    }

    return 'Something went wrong. Please try again.'
}
